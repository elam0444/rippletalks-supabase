import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("id, revoked, expires_at")
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

    const { data: industries, error } = await adminClient
      .from("industries")
      .select("id, name")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ industries: industries || [] });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
