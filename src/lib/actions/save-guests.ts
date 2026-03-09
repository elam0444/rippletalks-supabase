"use server";

import { createClient } from "@/lib/supabase/server";

interface GuestInput {
  first: string;
  last: string;
  title: string;
  company: string;
  linkedin: string;
  email: string;
}

export async function saveGuests(
  guests: GuestInput[],
  addedByProfileId: string,
  clientCompanyId?: string,
) {
  const supabase = await createClient();
  const saved = [];

  for (const guest of guests) {
    // Skip empty rows
    if (!guest.first && !guest.last && !guest.email) continue;

    // --- 1. Upsert the guest's company ---
    let companyId: string | null = null;

    if (guest.company) {
      const slug = guest.company
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const { data: existingCompany } = await supabase
        .from("companies")
        .select("id")
        .eq("slug", slug)
        .single();

      if (existingCompany?.id) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: guest.company,
            slug,
            //added_by_profile_id: addedByProfileId,
          })
          .select("id")
          .single();

        if (companyError) {
          console.error("Error inserting guest company:", companyError);
        } else {
          companyId = newCompany?.id ?? null;
        }
      }
    }

    // --- 2. Link as target_company if we have both IDs ---
    if (companyId && clientCompanyId) {
      const { data: existingTarget } = await supabase
        .from("target_companies")
        .select("id")
        .eq("client_company_id", clientCompanyId)
        .eq("target_company_id", companyId)
        .single();

      const { data: defaultCategory } = await supabase
        .from("relationship_categories")
        .select("id")
        .ilike("name", "prospect")
        .single();

      const { data: defaultProfile } = await supabase
        .from("profiles")
        .select("id")
        .limit(1)
        .single();

      const defaultProfileId = defaultProfile?.id ?? null;
      console.log(defaultProfileId)

      if (!existingTarget?.id) {
        const { error: targetError } = await supabase
          .from("target_companies")
          .insert({
            target_company_id: companyId,
            client_company_id: clientCompanyId,
            relationship_category: defaultCategory?.id,
            profile_id: defaultProfileId,
            //added_by_profile_id: addedByProfileId,
            selected: true,
            interested: false,
          });

        if (targetError) {
          console.error(
            "Error inserting target_company for guest:",
            targetError,
          );
        }
      }
    }

    // --- 3. Upsert the contact ---
    const fullName = [guest.first, guest.last].filter(Boolean).join(" ");

    if (guest.email) {
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", guest.email)
        .single();

      if (existingContact?.id) {
        await supabase
          .from("contacts")
          .update({
            company_id: companyId,
            name: fullName || null,
            first_name: guest.first || null,
            last_name: guest.last || null,
            title: guest.title || null,
            linkedin_url: guest.linkedin || null,
            //added_by_profile_id: addedByProfileId,
          })
          .eq("id", existingContact.id);

        saved.push(existingContact.id);
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({
            company_id: companyId,
            email: guest.email,
            name: fullName || null,
            first_name: guest.first || null,
            last_name: guest.last || null,
            title: guest.title || null,
            linkedin_url: guest.linkedin || null,
            //added_by_profile_id: addedByProfileId,
          })
          .select("id")
          .single();

        if (contactError) {
          console.error("Error inserting guest contact:", contactError);
        } else if (newContact) {
          saved.push(newContact.id);
        }
      }
    }
  }

  return saved;
}
