import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, availableDate, isSelected } = await req.json();

    if (!token || !availableDate || typeof isSelected !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Validate share link token
    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("id, company_id, revoked, expires_at, permissions")
      .eq("link_token", token)
      .single();

    if (shareLinkError || !shareLink) {
      return NextResponse.json({ error: "Invalid share link" }, { status: 403 });
    }

    if (shareLink.revoked) {
      return NextResponse.json({ error: "Share link has been revoked" }, { status: 403 });
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      return NextResponse.json({ error: "Share link has expired" }, { status: 403 });
    }

    const contactId = shareLink.permissions?.contact_id;
    if (!contactId) {
      return NextResponse.json({ error: "No contact associated with this share link" }, { status: 400 });
    }

    // Update the target date
    const { error } = await adminClient
      .from("contact_available_dates")
      .update({ is_selected: isSelected })
      .eq("contact_id", contactId)
      .eq("available_date", availableDate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
