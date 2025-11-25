'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const targetCompanySchema = z.object({
  client_company_id: z.string().uuid(),
  target_company_id: z.string().uuid(),
  relationship_category: z.string().uuid(),
  why: z.string().max(1000).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export type TargetCompanyFormData = z.infer<typeof targetCompanySchema>;

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: { id: string };
};

// Add a target company
export async function addTargetCompany(formData: TargetCompanyFormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate input
  const parsed = targetCompanySchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message };
  }

  const { client_company_id, target_company_id, relationship_category, why, note } = parsed.data;

  // Prevent targeting self
  if (client_company_id === target_company_id) {
    return { success: false, error: 'A company cannot target itself' };
  }

  // Get profile
  const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).single();

  if (!profile) {
    return { success: false, error: 'Profile not found' };
  }

  const { data, error } = await supabase
    .from('target_companies')
    .insert({
      profile_id: profile.id,
      client_company_id,
      target_company_id,
      relationship_category,
      why: why || null,
      note: note || null,
      added_by_profile_id: profile.id,
    })
    .select('id')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'This company is already being targeted' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${client_company_id}`);
  return { success: true, data: { id: data.id } };
}

// Update a target company
export async function updateTargetCompany(
  id: string,
  clientCompanyId: string,
  formData: {
    relationship_category: string;
    why?: string | null;
    note?: string | null;
  },
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('target_companies')
    .update({
      relationship_category: formData.relationship_category,
      why: formData.why || null,
      note: formData.note || null,
    })
    .eq('id', id)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${clientCompanyId}`);
  return { success: true, data: { id } };
}

// Remove a target company (soft delete)
export async function removeTargetCompany(
  targetCompanyId: string,
  clientCompanyId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('target_companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', targetCompanyId)
    .is('deleted_at', null);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath(`/dashboard/companies/${clientCompanyId}`);
  return { success: true };
}

// Get relationship categories for dropdown
export async function getRelationshipCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('relationship_categories')
    .select('id, name')
    .order('name');

  if (error) {
    return [];
  }

  return data;
}

// Get available companies to target (excluding already targeted ones)
export async function getAvailableCompaniesToTarget(clientCompanyId: string) {
  const supabase = await createClient();

  // Get already targeted company IDs
  const { data: existingTargets } = await supabase
    .from('target_companies')
    .select('target_company_id')
    .eq('client_company_id', clientCompanyId)
    .is('deleted_at', null);

  const targetedIds = existingTargets?.map((t) => t.target_company_id) || [];
  // Also exclude the client company itself
  const excludeIds = [...targetedIds, clientCompanyId];

  // Get all companies except already targeted ones and the client company
  const { data, error } = await supabase
    .from('companies')
    .select('id, name, logo_url')
    .is('deleted_at', null)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .order('name');

  if (error) {
    return [];
  }

  return data;
}
