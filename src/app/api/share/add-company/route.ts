import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { token, name, description, industry_id } = await req.json();

    if (!token || !name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Missing required fields: token and name" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json(
        { error: "Company name is required" },
        { status: 400 }
      );
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

    // Check if a company with this name already exists (case-insensitive)
    const { data: existingCompany } = await adminClient
      .from("companies")
      .select("id, name, description")
      .ilike("name", trimmedName)
      .is("deleted_at", null)
      .maybeSingle();

    let targetCompanyId: string;

    if (existingCompany) {
      targetCompanyId = existingCompany.id;
      // Prevent targeting self
      if (clientCompanyId === targetCompanyId) {
        return NextResponse.json(
          { error: "Cannot add your own company" },
          { status: 400 }
        );
      }
    } else {
      // Create new company
      const { data: newCompany, error: insertError } = await adminClient
        .from("companies")
        .insert({
          name: trimmedName,
          description: description?.trim() || null,
          industry_id: industry_id && typeof industry_id === "string" ? industry_id : null,
          added_by_profile_id: shareLink.profile_id,
        })
        .select("id, name, description")
        .single();

      if (insertError) {
        if (insertError.code === "23505") {
          // Unique violation - name exists, fetch and use it
          const { data: byName } = await adminClient
            .from("companies")
            .select("id, name, description")
            .ilike("name", trimmedName)
            .is("deleted_at", null)
            .maybeSingle();
          if (byName) {
            targetCompanyId = byName.id;
            if (clientCompanyId === targetCompanyId) {
              return NextResponse.json(
                { error: "Cannot add your own company" },
                { status: 400 }
              );
            }
          } else {
            return NextResponse.json({ error: insertError.message }, { status: 500 });
          }
        } else {
          return NextResponse.json({ error: insertError.message }, { status: 500 });
        }
      } else if (newCompany) {
        targetCompanyId = newCompany.id;
      } else {
        return NextResponse.json({ error: "Failed to create company" }, { status: 500 });
      }
    }

    // Get default relationship category
    const { data: categories } = await adminClient
      .from("relationship_categories")
      .select("id")
      .order("name")
      .limit(1);

    const defaultCategoryId = categories?.[0]?.id || null;

    // Add as target (reuse add-target logic)
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
          return NextResponse.json(
            { error: "This company is already in your list" },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Fetch company to return (in case we used existing)
    const { data: company } = await adminClient
      .from("companies")
      .select("id, name, description")
      .eq("id", targetCompanyId)
      .single();

    return NextResponse.json({ success: true, company });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
