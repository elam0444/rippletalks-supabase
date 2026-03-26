"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

const BUCKET = "guest-files"
const SIGNED_URL_EXPIRY = 60 * 60 // 1 hour

export interface ShareLinkAnalytics {
  id: string
  link_token: string
  created_at: string
  uses: number
  notes: string | null
  contact_id: string | null
  contact_name: string | null
  contact_email: string | null
  company_id: string
  company_name: string
  open_count: number
  last_opened_at: string | null
  has_guest_info: boolean
  guest_target_count: number
  csv_uploads: CsvUploadRecord[]
  guest_files: GuestFileRecord[]
}

export interface CsvUploadRecord {
  id: string
  file_name: string | null
  total_rows: number
  success_count: number
  failure_count: number
  created_at: string
}

export interface GuestFileRecord {
  id: string
  file_name: string
  file_size: number | null
  created_at: string
  signed_url: string | null
}

export async function getAnalyticsData(withinDays = 60): Promise<ShareLinkAnalytics[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const adminClient = createAdminClient()

  const since = new Date()
  since.setDate(since.getDate() - withinDays)
  const sinceIso = since.toISOString()

  const { data: shareLinks, error: shareLinksError } = await adminClient
    .from("share_links")
    .select("id, link_token, created_at, uses, notes, permissions, company_id, revoked")
    .gte("created_at", sinceIso)
    .eq("revoked", false)
    .order("created_at", { ascending: false })

  if (shareLinksError || !shareLinks || shareLinks.length === 0) return []

  const shareLinkIds = shareLinks.map((l) => l.id)
  const companyIds = [...new Set(shareLinks.map((l) => l.company_id).filter(Boolean))]
  const contactIds = shareLinks
    .map((l) => l.permissions?.contact_id)
    .filter(Boolean) as string[]

  // Fetch all independent datasets in parallel
  const [
    { data: companies },
    { data: contacts },
    { data: logCounts },
    { data: guestTargets },
    { data: csvUploads },
    { data: rawGuestFiles },
  ] = await Promise.all([
    adminClient.from("companies").select("id, name").in("id", companyIds),
    contactIds.length
      ? adminClient.from("contacts").select("id, name, email").in("id", contactIds)
      : Promise.resolve({ data: [] }),
    adminClient
      .from("share_link_logs")
      .select("share_link_id, timestamp")
      .in("share_link_id", shareLinkIds)
      .eq("event", "open"),
    adminClient
      .from("target_companies")
      .select("client_company_id")
      .in("client_company_id", companyIds)
      .eq("source", "guest")
      .is("deleted_at", null),
    adminClient
      .from("csv_uploads")
      .select("id, client_company_id, file_name, total_rows, success_count, failure_count, created_at")
      .in("client_company_id", companyIds)
      .order("created_at", { ascending: false }),
    adminClient
      .from("guest_file_uploads")
      .select("id, share_link_id, file_name, file_size, storage_path, created_at")
      .in("share_link_id", shareLinkIds)
      .order("created_at", { ascending: false }),
  ])

  // Batch-generate all signed URLs in parallel
  const files = rawGuestFiles ?? []
  const signedUrls = await Promise.all(
    files.map((f) =>
      adminClient.storage.from(BUCKET).createSignedUrl(f.storage_path, SIGNED_URL_EXPIRY)
    )
  )

  // Build lookup maps
  const companyMap = new Map((companies ?? []).map((c) => [c.id, c.name]))
  const contactMap = new Map((contacts ?? []).map((c) => [c.id, c]))

  const opensByLink = new Map<string, string[]>()
  for (const log of logCounts ?? []) {
    if (!opensByLink.has(log.share_link_id)) opensByLink.set(log.share_link_id, [])
    opensByLink.get(log.share_link_id)!.push(log.timestamp)
  }

  const guestTargetCountByCompany = new Map<string, number>()
  for (const t of guestTargets ?? []) {
    guestTargetCountByCompany.set(
      t.client_company_id,
      (guestTargetCountByCompany.get(t.client_company_id) ?? 0) + 1
    )
  }

  const csvUploadsByCompany = new Map<string, CsvUploadRecord[]>()
  for (const u of csvUploads ?? []) {
    if (!csvUploadsByCompany.has(u.client_company_id)) {
      csvUploadsByCompany.set(u.client_company_id, [])
    }
    csvUploadsByCompany.get(u.client_company_id)!.push({
      id: u.id,
      file_name: u.file_name,
      total_rows: u.total_rows,
      success_count: u.success_count,
      failure_count: u.failure_count,
      created_at: u.created_at,
    })
  }

  const guestFilesByLink = new Map<string, GuestFileRecord[]>()
  files.forEach((f, i) => {
    const signedUrl = signedUrls[i]?.data?.signedUrl ?? null
    if (!signedUrl) return // file no longer exists in storage
    if (!guestFilesByLink.has(f.share_link_id)) guestFilesByLink.set(f.share_link_id, [])
    guestFilesByLink.get(f.share_link_id)!.push({
      id: f.id,
      file_name: f.file_name,
      file_size: f.file_size,
      created_at: f.created_at,
      signed_url: signedUrl,
    })
  })

  return shareLinks.map((link) => {
    const contactId = link.permissions?.contact_id ?? null
    const contact = contactId ? contactMap.get(contactId) : null
    const opens = opensByLink.get(link.id) ?? []
    const lastOpened = opens.length ? opens.sort().at(-1)! : null
    const companyId = link.company_id ?? ""
    const csvUploadsForCompany = csvUploadsByCompany.get(companyId) ?? []
    const guestFiles = guestFilesByLink.get(link.id) ?? []
    const guestCount = guestTargetCountByCompany.get(companyId) ?? 0

    return {
      id: link.id,
      link_token: link.link_token,
      created_at: link.created_at,
      uses: link.uses ?? 0,
      notes: link.notes,
      contact_id: contactId,
      contact_name: contact?.name ?? null,
      contact_email: contact?.email ?? null,
      company_id: companyId,
      company_name: companyMap.get(companyId) ?? "Unknown",
      open_count: opens.length,
      last_opened_at: lastOpened,
      has_guest_info: guestCount > 0 || csvUploadsForCompany.length > 0 || guestFiles.length > 0,
      guest_target_count: guestCount,
      csv_uploads: csvUploadsForCompany,
      guest_files: guestFiles,
    }
  })
}
