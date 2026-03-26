import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "guest-files";
const ALLOWED_MIME_TYPES = [
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const token = formData.get("token") as string | null;
    const clientCompanyId = formData.get("clientCompanyId") as string | null;

    if (!file || !token || !clientCompanyId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 413 });
    }

    const adminClient = createAdminClient();

    // Validate the share link token
    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("id, revoked, expires_at")
      .eq("link_token", token)
      .eq("company_id", clientCompanyId)
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

    // Sanitise file name and build storage path
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${clientCompanyId}/${shareLink.id}/${Date.now()}_${safeName}`;

    // Derive content type from extension so Excel doesn't warn about mismatched format/extension
    const lowerName = file.name.toLowerCase();
    let contentType = "text/csv";
    if (lowerName.endsWith(".xlsx")) {
      contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (lowerName.endsWith(".xls")) {
      contentType = "application/vnd.ms-excel";
    }

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await adminClient.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Record in guest_file_uploads
    const { error: dbError } = await adminClient.from("guest_file_uploads").insert({
      share_link_id: shareLink.id,
      client_company_id: clientCompanyId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: contentType,
    });

    if (dbError) {
      console.error("DB insert error:", dbError);
      // Don't fail the request — file is already in storage
    }

    return NextResponse.json({ success: true, storagePath });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
