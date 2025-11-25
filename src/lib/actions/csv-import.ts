"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Types for batch import
export interface TargetCompanyImportRow {
  targetCompanyName: string
  category: string
  why?: string
}

export interface ImportResult {
  rowNumber: number
  targetCompanyName: string
  success: boolean
  error?: string
  targetCompanyId?: string
}

export interface BatchImportResult {
  success: boolean
  totalRows: number
  successCount: number
  failureCount: number
  results: ImportResult[]
  error?: string
}

/**
 * Batch import target companies from CSV data
 */
export async function importTargetCompaniesFromCSV(
  clientCompanyId: string,
  rows: { rowNumber: number; data: TargetCompanyImportRow }[]
): Promise<BatchImportResult> {
  const supabase = await createClient()

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      totalRows: rows.length,
      successCount: 0,
      failureCount: rows.length,
      results: [],
      error: "Unauthorized - Please log in",
    }
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return {
      success: false,
      totalRows: rows.length,
      successCount: 0,
      failureCount: rows.length,
      results: [],
      error: "Profile not found",
    }
  }

  // Get all relationship categories
  const { data: categories } = await supabase
    .from("relationship_categories")
    .select("id, name")

  if (!categories || categories.length === 0) {
    return {
      success: false,
      totalRows: rows.length,
      successCount: 0,
      failureCount: rows.length,
      results: [],
      error: "Relationship categories not found in database",
    }
  }

  // Create category name to ID map
  const categoryMap = new Map(
    categories.map((cat) => [cat.name.toLowerCase(), cat.id])
  )

  // Get all companies to map names to IDs
  const { data: allCompanies } = await supabase
    .from("companies")
    .select("id, name")
    .is("deleted_at", null)

  if (!allCompanies || allCompanies.length === 0) {
    return {
      success: false,
      totalRows: rows.length,
      successCount: 0,
      failureCount: rows.length,
      results: [],
      error: "No companies found in database. Please create companies first.",
    }
  }

  // Create company name to ID map (case-insensitive)
  const companyMap = new Map(
    allCompanies.map((company) => [company.name.toLowerCase().trim(), company])
  )

  // Get already targeted companies to avoid duplicates
  const { data: existingTargets } = await supabase
    .from("target_companies")
    .select("target_company_id")
    .eq("client_company_id", clientCompanyId)
    .is("deleted_at", null)

  const alreadyTargetedIds = new Set(
    existingTargets?.map((t) => t.target_company_id) || []
  )

  // Process each row
  const results: ImportResult[] = []
  let successCount = 0
  let failureCount = 0

  for (const row of rows) {
    const { rowNumber, data } = row
    const { targetCompanyName, category, why } = data

    try {
      // Map category name to ID
      const categoryId = categoryMap.get(category.toLowerCase())
      if (!categoryId) {
        results.push({
          rowNumber,
          targetCompanyName,
          success: false,
          error: `Invalid category: "${category}". Must be one of: ${categories.map(c => c.name).join(', ')}`,
        })
        failureCount++
        continue
      }

      // Map company name to ID
      const targetCompany = companyMap.get(targetCompanyName.toLowerCase().trim())
      if (!targetCompany) {
        results.push({
          rowNumber,
          targetCompanyName,
          success: false,
          error: `Company "${targetCompanyName}" not found in database. Please create it first.`,
        })
        failureCount++
        continue
      }

      // Prevent targeting self
      if (targetCompany.id === clientCompanyId) {
        results.push({
          rowNumber,
          targetCompanyName,
          success: false,
          error: "A company cannot target itself",
        })
        failureCount++
        continue
      }

      // Check if already targeted
      if (alreadyTargetedIds.has(targetCompany.id)) {
        results.push({
          rowNumber,
          targetCompanyName,
          success: false,
          error: "This company is already being targeted",
        })
        failureCount++
        continue
      }

      // Insert target company
      const { data: insertedData, error } = await supabase
        .from("target_companies")
        .insert({
          profile_id: profile.id,
          client_company_id: clientCompanyId,
          target_company_id: targetCompany.id,
          relationship_category: categoryId,
          why: why || null,
          note: null,
          added_by_profile_id: profile.id,
        })
        .select("id")
        .single()

      if (error) {
        results.push({
          rowNumber,
          targetCompanyName,
          success: false,
          error: error.message,
        })
        failureCount++
      } else {
        results.push({
          rowNumber,
          targetCompanyName,
          success: true,
          targetCompanyId: insertedData.id,
        })
        successCount++
        // Add to already targeted set to prevent duplicates within same batch
        alreadyTargetedIds.add(targetCompany.id)
      }
    } catch (error) {
      results.push({
        rowNumber,
        targetCompanyName,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      failureCount++
    }
  }

  // Revalidate the company page to show new targets
  revalidatePath(`/dashboard/companies/${clientCompanyId}`)
  revalidatePath(`/dashboard`)

  return {
    success: successCount > 0,
    totalRows: rows.length,
    successCount,
    failureCount,
    results,
  }
}
