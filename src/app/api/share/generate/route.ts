import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { contactId, companyId } = await req.json();

    if (!contactId || !companyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Verify the contact exists and belongs to the specified company
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, company_id")
      .eq("id", contactId)
      .eq("company_id", companyId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    // Check if a share link already exists for this contact
    const { data: existingLinks } = await supabase
      .from("share_links")
      .select("*")
      .eq("company_id", companyId)
      .eq("revoked", false)
      .is("expires_at", null);

    // Filter to find a link for this specific contact
    let existingLink = null;
    if (existingLinks && existingLinks.length > 0) {
      existingLink = existingLinks.find(
        (link: any) => link.permissions?.contact_id === contactId
      );
    }

    let linkToken: string;
    let shareLink: any;

    if (existingLink) {
      // Return the existing link
      linkToken = existingLink.link_token;
      shareLink = existingLink;
    } else {
      // Generate a new unique token
      linkToken = crypto.randomUUID();

      // Create a new share link for this contact
      const { data: newShareLink, error: shareLinkError } = await supabase
        .from("share_links")
        .insert({
          profile_id: profile.id,
          company_id: companyId,
          link_token: linkToken,
          permissions: {
            contact_id: contactId,
            type: "contact_share",
          },
        })
        .select()
        .single();

      if (shareLinkError) {
        console.error("Share link creation error:", shareLinkError);
        return NextResponse.json({ error: shareLinkError.message }, { status: 500 });
      }

      shareLink = newShareLink;
    }

    // Generate the share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/share/${companyId}?token=${linkToken}`;

    return NextResponse.json({
      success: true,
      shareUrl,
      linkToken,
      isExisting: !!existingLink,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
