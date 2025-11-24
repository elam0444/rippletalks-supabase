"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

// Validation schemas
const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(255),
  legal_name: z.string().max(255).optional().nullable(),
  website: z.url("Invalid URL").optional().nullable().or(z.literal("")),
  logo_url: z.url("Invalid URL").optional().nullable().or(z.literal("")),
  description: z.string().max(1000).optional().nullable(),
  industry_id: z.string().uuid().optional().nullable(),
})

export type CompanyFormData = z.infer<typeof companySchema>

export type ActionResult = {
  success: boolean
  error?: string
  data?: { id: string }
}

// Create a new company
export async function createCompany(formData: CompanyFormData): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Validate input
  const parsed = companySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, legal_name, website, logo_url, description, industry_id } = parsed.data

  // Get or create profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single()

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name,
      legal_name: legal_name || null,
      website: website || null,
      logo_url: logo_url || null,
      description: description || null,
      industry_id: industry_id || null,
      added_by_profile_id: profile?.id || null,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A company with this name already exists" }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true, data: { id: data.id } }
}

// Update an existing company
export async function updateCompany(
  id: string,
  formData: CompanyFormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Validate input
  const parsed = companySchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, legal_name, website, logo_url, description, industry_id } = parsed.data

  const { error } = await supabase
    .from("companies")
    .update({
      name,
      legal_name: legal_name || null,
      website: website || null,
      logo_url: logo_url || null,
      description: description || null,
      industry_id: industry_id || null,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "A company with this name already exists" }
    }
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/companies/${id}`)
  return { success: true, data: { id } }
}

// Soft delete a company
export async function deleteCompany(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("companies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .is("deleted_at", null)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

// Fetch all companies
export async function getCompanies() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("companies")
    .select(`
      id,
      name,
      logo_url,
      website,
      description,
      industries (
        name
      )
    `)
    .is("deleted_at", null)
    .order("name")

  if (error) {
    return []
  }

  return data
}

// Fetch industries for the dropdown
export async function getIndustries() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("industries")
    .select("id, name")
    .order("name")

  if (error) {
    return []
  }

  return data
}

// Fetch a single company by ID
export async function getCompanyById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("companies")
    .select(`
      id,
      name,
      legal_name,
      website,
      logo_url,
      description,
      industry_id,
      industries (
        id,
        name
      )
    `)
    .eq("id", id)
    .is("deleted_at", null)
    .single()

  if (error) {
    return null
  }

  return data
}
