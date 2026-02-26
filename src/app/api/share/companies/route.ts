import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    const search = req.nextUrl.searchParams.get("search") || "";

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
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

    const clientCompanyId = shareLink.company_id;

    // Get already-targeted company IDs for this client
    const { data: existingTargets } = await adminClient
      .from("target_companies")
      .select("target_company_id")
      .eq("client_company_id", clientCompanyId)
      .is("deleted_at", null);

    const targetedIds = existingTargets?.map((t) => t.target_company_id) || [];
    const excludeIds = [...targetedIds, clientCompanyId];

    // console.log("[API /share/companies] Excluding IDs:", excludeIds);

    // First, check total companies count
    const { count: totalCount } = await adminClient
      .from("companies")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    console.log("[API /share/companies] Total companies in DB:", totalCount);

    // Fetch available companies
    let query = adminClient
      .from("companies")
      .select("id, name, description")
      .is("deleted_at", null)
      .order("name");

    if (excludeIds.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data: companies, error } = await query;

    if (error) {
      console.error("[API /share/companies] Query error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("[API /share/companies] Found companies:", companies?.length || 0);

    return NextResponse.json({ companies: companies || [] });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
