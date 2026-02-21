import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, targetCompanyId, selected, why, note } = await req.json();

    if (!token || !targetCompanyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Validate share link token
    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("id, company_id, revoked, expires_at")
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

    // Build update payload with only provided fields
    const updates: Record<string, unknown> = {};
    if (typeof selected === "boolean") updates.selected = selected;
    if (typeof why === "string") updates.why = why;
    if (typeof note === "string") updates.note = note;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { error } = await adminClient
      .from("target_companies")
      .update(updates)
      .eq("client_company_id", shareLink.company_id)
      .eq("target_company_id", targetCompanyId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
