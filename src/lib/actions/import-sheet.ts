"use server";

import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ImportResult = {
  success: boolean;
  count?: number;
  error?: string;
};

/**
 * Utility to generate a slug from a name
 */
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");
}

/**
 * Simple CSV parser for standard exports
 */
function parseCSV(text: string) {
  const lines = text.split(/\r?\n/);
  return lines
    .slice(1)
    .map((line) => {
      // Basic CSV split (handles simple quoted strings)
      const cells = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      return cells.map((c) => c.replace(/^"|"$/g, "").trim());
    })
    .filter((row) => row.length > 1 && row[0] !== "");
}

export async function importPipelineFromXlsx(
  clientCompanyId: string,
  formDataOrFile: any,
): Promise<ImportResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };

  // --- Robust File Extraction ---
  let file: File | null = null;

  if (formDataOrFile instanceof FormData) {
    file = formDataOrFile.get("file") as File;
  } else if (formDataOrFile instanceof File) {
    file = formDataOrFile;
  } else if (
    formDataOrFile &&
    typeof formDataOrFile === "object" &&
    formDataOrFile.file instanceof File
  ) {
    file = formDataOrFile.file;
  }

  if (!file || !(file instanceof File)) {
    console.error(
      "Import Error: No valid File object found. Received:",
      typeof formDataOrFile,
    );
    return {
      success: false,
      error:
        "No valid file provided. Please ensure you are uploading an .xlsx or .csv file.",
    };
  }

  try {
    const fileName = file.name.toLowerCase();
    const isCsv = fileName.endsWith(".csv") || file.type === "text/csv";
    let dataRows: any[][] = [];

    if (isCsv) {
      const text = await file.text();
      dataRows = parseCSV(text);
    } else {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(arrayBuffer);

      // Try 'Pipeline' sheet first, then default to first sheet
      const worksheet =
        workbook.getWorksheet("Pipeline") || workbook.worksheets[0];

      if (!worksheet)
        return { success: false, error: "No worksheet found in Excel file" };

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          const rowValues: any[] = [];
          // Map exactly 14 columns as per export definition
          for (let i = 1; i <= 14; i++) {
            const cell = row.getCell(i);

            let value = "";

            if (cell.value !== null && cell.value !== undefined) {
              if (typeof cell.value === "object") {
                // Handle Formula results, Rich Text, etc.
                if ("result" in cell.value) {
                  value = String(cell.value.result ?? "");
                } else if (
                  "richText" in cell.value &&
                  Array.isArray(cell.value.richText)
                ) {
                  value = cell.value.richText.map((rt) => rt.text).join("");
                } else if (cell.value instanceof Date) {
                  value = cell.value.toISOString();
                } else {
                  value = String(cell.text || "");
                }
              } else {
                value = String(cell.value);
              }
            }

            rowValues.push(value.trim());
          }
          dataRows.push(rowValues);
        }
      });
    }

    if (dataRows.length === 0) {
      return { success: false, error: "The file appears to be empty" };
    }

    const { data: categories } = await supabase
      .from("relationship_categories")
      .select("id, name");

    let processedCount = 0;

    for (const rowData of dataRows) {
      const companyName = rowData[0];
      const website = rowData[1];
      const categoryName = rowData[2];
      const firstName = rowData[4];
      const lastName = rowData[5];
      const phone = rowData[6];
      const title = rowData[7];
      const email = rowData[8];
      const linkedin = rowData[9];
      const why = rowData[10];
      const notes = rowData[11];

      if (!companyName) continue;

      let targetCompanyId: string | null = null;

      // 1. Resolve Company
      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("name", companyName)
        .maybeSingle();

      if (existingCompany) {
        targetCompanyId = existingCompany.id;
      } else {
        const newSlug = `${slugify(companyName)}-${Math.floor(Math.random() * 1000)}`;
        const { data: newCompany, error: compErr } = await supabase
          .from("companies")
          .insert({
            name: companyName,
            slug: newSlug,
            website: website || null,
            added_by_profile_id: user.id,
          })
          .select("id")
          .single();

        if (compErr || !newCompany) continue;
        targetCompanyId = newCompany.id;

        const categoryId =
          categories?.find(
            (c) => c.name.toLowerCase() === categoryName?.toLowerCase(),
          )?.id || categories?.[0]?.id;

        await supabase.from("target_companies").insert({
          client_company_id: clientCompanyId,
          target_company_id: targetCompanyId,
          relationship_category: categoryId,
          why: why || null,
          note: notes || null,
          source: "import",
          profile_id: user.id,
          interested: false,
        });
      }

      // 2. Resolve Contact
      if (email && targetCompanyId) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("id, company_id")
          .eq("email", email)
          .maybeSingle();

        const contactData = {
          first_name: firstName || null,
          last_name: lastName || null,
          name: `${firstName || ""} ${lastName || ""}`.trim() || null,
          title: title || null,
          phone: phone || null,
          linkedin_url: linkedin || null,
          updated_at: new Date().toISOString(),
        };

        if (existingContact) {
          const updatePayload: any = { ...contactData };
          if (!existingContact.company_id)
            updatePayload.company_id = targetCompanyId;
          await supabase
            .from("contacts")
            .update(updatePayload)
            .eq("id", existingContact.id);
        } else {
          await supabase.from("contacts").insert({
            ...contactData,
            company_id: targetCompanyId,
            email: email,
            added_by_profile_id: user.id,
          });
        }
      }
      processedCount++;
    }

    revalidatePath(`/dashboard/companies/${clientCompanyId}`);
    return { success: true, count: processedCount };
  } catch (err: any) {
    console.error("Import error details:", err);
    return { success: false, error: err.message };
  }
}
