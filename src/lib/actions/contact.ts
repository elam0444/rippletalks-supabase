"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const contactSchema = z.object({
  company_id: z.string().uuid(),
  first_name: z.string().max(255).optional().nullable(),
  last_name: z.string().max(255).optional().nullable(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .nullable()
    .or(z.literal("")),
  title: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  avatar_url: z
    .string()
    .url("Invalid URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  panelist_type_id: z.string().nullable().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

// Create a new contact
export async function createContact(
  formData: ContactFormData,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  // Validate input
  const parsed = contactSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  const {
    company_id,
    first_name,
    last_name,
    email,
    title,
    phone,
    avatar_url,
    panelist_type_id,
  } = parsed.data;

  const name = [first_name, last_name].filter(Boolean).join(" ");

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      company_id,
      name,
      first_name: first_name || null,
      last_name: last_name || null,
      email: email || null,
      title: title || null,
      phone: phone || null,
      avatar_url: avatar_url || null,
      panelist_type_id: panelist_type_id ?? null,
      added_by_profile_id: profile?.id || null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A contact with this email already exists",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${company_id}`);
  return { success: true, data: { id: data.id } };
}

// Update an existing contact
export async function updateContact(
  id: string,
  companyId: string,
  formData: {
    first_name: string;
    last_name: string;
    email?: string | null;
    title?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    panelist_type_id?: string | null;
  },
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const fullName = [formData.first_name, formData.last_name]
    .filter(Boolean)
    .join(" ");

  const { error } = await supabase
    .from("contacts")
    .update({
      name: fullName,
      first_name: formData.first_name || null,
      last_name: formData.last_name || null,
      email: formData.email || null,
      title: formData.title || null,
      phone: formData.phone || null,
      avatar_url: formData.avatar_url || null,
      panelist_type_id: formData.panelist_type_id ?? null,
    })
    .eq("id", id)
    .is("deleted_at", null);

  if (error) {
    if (error.code === "23505") {
      return {
        success: false,
        error: "A contact with this email already exists",
      };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${companyId}`);
  return { success: true, data: { id } };
}

// Detach a contact from a company (sets company_id to null)
export async function removeContact(
  contactId: string,
  companyId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("contacts")
    .update({ company_id: null })
    .eq("id", contactId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${companyId}`);
  return { success: true };
}

// Fetch contacts by company ID
export async function getContactsByCompanyId(companyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      first_name,
      last_name,
      email,
      title,
      phone,
      avatar_url,
      panelist_type_id,
      panelist_types (
        name
      )
    `,
    )
    .eq("company_id", companyId)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return [];
  }

  return data;
}

// Fetch contacts not attached to a specific company (for attaching existing contacts)
export async function getAvailableContacts(excludeCompanyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contacts")
    .select(
      `
      id,
      name,
      email,
      title,
      phone,
      avatar_url,
      company:company_id (
        id,
        name
      )
    `,
    )
    .or(`company_id.neq.${excludeCompanyId},company_id.is.null`)
    .is("deleted_at", null)
    .order("name");

  if (error) {
    return [];
  }

  return data;
}

// Attach an existing contact to a company
export async function attachContact(
  contactId: string,
  companyId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("contacts")
    .update({ company_id: companyId })
    .eq("id", contactId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${companyId}`);
  return { success: true };
}
