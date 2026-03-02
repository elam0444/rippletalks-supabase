import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, targetCompanyId } = await req.json();

    if (!token || !targetCompanyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Validate share link token
    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("id, company_id, profile_id, revoked, expires_at")
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

    const clientCompanyId = shareLink.company_id;

    // Prevent targeting self
    if (clientCompanyId === targetCompanyId) {
      return NextResponse.json({ error: "Cannot target the same company" }, { status: 400 });
    }

    // Get default relationship category
    const { data: categories } = await adminClient
      .from("relationship_categories")
      .select("id")
      .order("name")
      .limit(1);

    const defaultCategoryId = categories?.[0]?.id || null;

    // Check if a soft-deleted record exists — restore it
    const { data: existingDeleted } = await adminClient
      .from("target_companies")
      .select("id")
      .eq("client_company_id", clientCompanyId)
      .eq("target_company_id", targetCompanyId)
      .not("deleted_at", "is", "null")
      .maybeSingle();

    if (existingDeleted) {
      const { error } = await adminClient
        .from("target_companies")
        .update({
          deleted_at: null,
          selected: true,
          relationship_category: defaultCategoryId,
        })
        .eq("id", existingDeleted.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Insert new target company
      const { error } = await adminClient
        .from("target_companies")
        .insert({
          profile_id: shareLink.profile_id,
          client_company_id: clientCompanyId,
          target_company_id: targetCompanyId,
          relationship_category: defaultCategoryId,
          selected: true,
          added_by_profile_id: shareLink.profile_id,
        });

      if (error) {
        if (error.code === "23505") {
          return NextResponse.json({ error: "This company is already targeted" }, { status: 409 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Fetch company details to return
    const { data: company } = await adminClient
      .from("companies")
      .select("id, name, description, logo_url, website")
      .eq("id", targetCompanyId)
      .single();

    return NextResponse.json({ success: true, company });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
