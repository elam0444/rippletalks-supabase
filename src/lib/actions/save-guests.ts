"use server";

import { createClient } from "@/lib/supabase/server";

interface GuestInput {
  first: string;
  last: string;
  linkedin: string;
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
    if (!guest.first && !guest.last && !guest.linkedin) continue;

    const fullName = [guest.first, guest.last].filter(Boolean).join(" ");

    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id")
      .eq("linkedin_url", guest.linkedin)
      .single();

    if (existingContact?.id) {
      await supabase
        .from("contacts")
        .update({
          name: fullName || null,
          first_name: guest.first || null,
          last_name: guest.last || null,
          linkedin_url: guest.linkedin || null,
        })
        .eq("id", existingContact.id);

      saved.push(existingContact.id);
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          name: fullName || null,
          first_name: guest.first || null,
          last_name: guest.last || null,
          linkedin_url: guest.linkedin || null,
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

  return saved;
}
