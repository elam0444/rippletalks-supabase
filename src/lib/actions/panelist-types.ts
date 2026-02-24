"use server"

import { createClient } from "@/lib/supabase/server"

export async function getPanelistTypes() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("panelist_types")
    .select("id, name")
    .order("name")

  if (error) throw new Error(error.message)

  return data ?? []
}