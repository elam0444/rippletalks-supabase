// lib/actions/export-sheet.ts
"use server";

import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

const COLUMNS: { header: string; key: string; width: number }[] = [
  { header: "Company Name", key: "companyName", width: 28 },
  { header: "Website", key: "website", width: 25 },
  { header: "Category", key: "category", width: 20 },
  { header: "CEO / Contact", key: "contact", width: 25 },
  { header: "First Name", key: "firstName", width: 20 },
  { header: "Last Name", key: "lastName", width: 20 },
  { header: "Phone", key: "phone", width: 20 },
  { header: "Title", key: "title", width: 20 },
  { header: "Email", key: "email", width: 28 },
  { header: "LinkedIn", key: "linkedin", width: 28 },
  { header: "Why Targeting", key: "why", width: 35 },
  { header: "Notes", key: "notes", width: 35 },
  { header: "Status", key: "status", width: 18 },
  { header: "Last Updated", key: "updatedAt", width: 18 },
];

const STATUS_OPTIONS = ["pending", "enriched", "needs review", "invalid"];

const STATUS_FILLS: Record<string, ExcelJS.Fill> = {
  pending: { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CC" } },
  enriched: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFD4EDDA" },
  },
  "needs review": {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8D7DA" },
  },
  invalid: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E3E5" } },
};

export type ExportResult =
  | { success: true; buffer: number[] } // serialized for server → client transfer
  | { success: false; error: string };

export async function exportPipelineToXlsx(
  clientCompanyId: string,
  clientCompanyName: string,
): Promise<ExportResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // ── Fetch pipeline ────────────────────────────────────────────────────────
  const { data: targets, error } = await supabase
    .from("target_companies")
    .select(
      `
      id, why, note, updated_at,
      target_company:target_company_id ( id, name, website ),
      category:relationship_category ( name )
    `,
    )
    .eq("client_company_id", clientCompanyId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { success: false, error: error.message };
  if (!targets?.length)
    return { success: false, error: "No target companies to export" };

  // ── Fetch contacts ────────────────────────────────────────────────────────
  const targetIds = targets
    .map((t) => (t.target_company as unknown as { id: string } | null)?.id)
    .filter(Boolean) as string[];

  const { data: contacts } = await supabase
    .from("contacts")
    .select(
      "id, company_id, name, first_name, last_name, title, email, linkedin_url, phone",
    )
    .in("company_id", targetIds);

  const contactByCompany = new Map<
    string,
    {
      name: string;
      first_name: string;
      last_name: string;
      title: string | null;
      email: string | null;
      linkedin_url: string | null;
      phone: string | null;
    }
  >();
  for (const c of contacts ?? []) {
    const existing = contactByCompany.get(c.company_id);
    const isSenior = /ceo|coo|founder|president|director|vp/i;
    if (
      !existing ||
      (isSenior.test(c.title ?? "") && !isSenior.test(existing.title ?? ""))
    ) {
      contactByCompany.set(c.company_id, c);
    }
  }

  // ── Build workbook ────────────────────────────────────────────────────────
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Ripple";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Pipeline", {
    views: [{ state: "frozen", ySplit: 1 }], // freeze header row
  });

  sheet.columns = COLUMNS;

  // ── Header row styling ────────────────────────────────────────────────────
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2D3858" },
    };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "medium", color: { argb: "FF1A2340" } },
    };
  });
  headerRow.height = 28;

  // ── Data rows ─────────────────────────────────────────────────────────────
  targets.forEach((t, i) => {
    const tc = t.target_company as unknown as {
      id: string;
      name: string;
      website?: string;
    } | null;
    const contact = tc ? contactByCompany.get(tc.id) : null;
    const category = t.category as unknown as { name: string } | null;
    const status = "pending";
    const isEven = i % 2 === 0;

    const row = sheet.addRow({
      companyName: tc?.name ?? "",
      website: tc?.website ?? "",
      category: category?.name ?? "",
      contact: contact?.name ?? "",
      firstName: contact?.first_name ?? "",
      lastName: contact?.last_name ?? "",
      title: contact?.title ?? "",
      email: contact?.email ?? "",
      phone: contact?.phone ?? "",
      linkedin: contact?.linkedin_url ?? "",
      why: t.why ?? "",
      notes: t.note ?? "",
      status,
      updatedAt: t.updated_at
        ? new Date(t.updated_at).toLocaleDateString("en-US")
        : "",
    });

    row.height = 22;

    // Alternating row fill
    const rowFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: isEven ? "FFFFFFFF" : "FFF3F5F9" },
    };

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.alignment = { vertical: "middle", wrapText: false };
      cell.font = { size: 10 };

      // Status cell gets its own color
      const colKey = COLUMNS[colNumber - 1]?.key;
      if (colKey === "status") {
        cell.fill = STATUS_FILLS[status] ?? rowFill;
        cell.font = { size: 10, bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      } else {
        cell.fill = rowFill;
      }
    });

    // Status dropdown (data validation)
    const statusColLetter = sheet.getColumn("status").letter;
    sheet.getCell(`${statusColLetter}${row.number}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${STATUS_OPTIONS.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Invalid status",
      error: `Choose one of: ${STATUS_OPTIONS.join(", ")}`,
    };

    // Email as mailto hyperlink if present
    if (contact?.email) {
      const emailColLetter = sheet.getColumn("email").letter;
      sheet.getCell(`${emailColLetter}${row.number}`).value = {
        text: contact.email,
        hyperlink: `mailto:${contact.email}`,
      };
      sheet.getCell(`${emailColLetter}${row.number}`).font = {
        size: 10,
        color: { argb: "FF0563C1" },
        underline: true,
      };
    }

    // Website as hyperlink if present
    if (tc?.website) {
      const websiteColLetter = sheet.getColumn("website").letter;
      const href = tc.website.startsWith("http")
        ? tc.website
        : `https://${tc.website}`;
      sheet.getCell(`${websiteColLetter}${row.number}`).value = {
        text: tc.website,
        hyperlink: href,
      };
      sheet.getCell(`${websiteColLetter}${row.number}`).font = {
        size: 10,
        color: { argb: "FF0563C1" },
        underline: true,
      };
    }
  });

  // ── Serialize ─────────────────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  return { success: true, buffer: Array.from(new Uint8Array(buffer)) };
}
