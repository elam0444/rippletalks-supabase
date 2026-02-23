"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

type TargetCompany = {
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  contact?: { email?: string; name?: string; title?: string } | null;
  relationship_category?: string;
  why?: string;
};

// Call OpenAI to get companies with category suggestion
export async function fetchTargetCompaniesFromOpenAI(
  description: string,
  availableCategories: string[],
): Promise<TargetCompany[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
You are an expert researcher. Generate a JSON array of 2 companies that are related, complementary, or relevant to this company/description, and could be good for networking, partnerships, or business connections:
"${description}"

Each company should include:
- name
- website (if available)
- description
- industry
- why
- a contact object with "name" (first and last name only, no title), "title" (job title separately), and "email" fields for a person who could be useful for outreach
- a relationship_category (must use exactly this key name) from the following options: ${availableCategories.join(", ")}

Output strictly as a JSON object with a "companies" array. Do NOT return the same company described in the input.

Example output format:
{
  "companies": [
    {
      "name": "Acme Corp",
      "website": "https://acmecorp.com",
      "description": "A leading provider of cloud infrastructure solutions for mid-market enterprises.",
      "industry": "Cloud Computing",
      "why": "This company is important because..."
      "contact": {
        "name": "Jane Smith",
        "title": "Head of Partnerships",
        "email": "jane.smith@acmecorp.com"
      },
      "relationship_category": "Strategic Partner"
    },
    {
      "name": "Bright Ventures",
      "website": "https://brightventures.io",
      "description": "Early-stage VC fund focused on B2B SaaS startups.",
      "industry": "Venture Capital",
      "why": "This company is important because..."
      "contact": {
        "name": "Tom Nguyen",
        "title": "General Partner",
        "email": "tom@brightventures.io"
      },
      "relationship_category": "Investor"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_API_MODEL || "gpt-4.1",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: `Description: ${description}` },
    ],
    response_format: { type: "json_object" },
  });

  console.log("OpenAI response:", completion.choices[0].message?.content);

  try {
    const rawContent = completion.choices[0].message?.content || "{}";
    let parsed;
    try {
      parsed = JSON.parse(rawContent.trim());
    } catch {
      const match = rawContent.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { companies: [] };
    }

    const companies: TargetCompany[] = Array.isArray(parsed.companies)
      ? parsed.companies
      : [];
    return companies;
  } catch (err) {
    console.error("Error parsing OpenAI JSON:", err);
    return [];
  }
}

export async function saveTargetCompanies(
  companies: TargetCompany[],
  addedByProfileId: string,
  clientCompanyId?: string,
) {
  if (companies.length === 0) return [];

  const supabase = await createClient();

  // Fetch relationship categories
  const { data: categories } = await supabase
    .from("relationship_categories")
    .select("id, name");

  const categoryMap =
    categories?.reduce(
      (acc, c) => {
        acc[c.name.toLowerCase()] = c.id;
        return acc;
      },
      {} as Record<string, string>,
    ) || {};

  // Fetch industries
  const { data: industries } = await supabase
    .from("industries")
    .select("id, name");

  const industryMap =
    industries?.reduce(
      (acc, i) => {
        acc[i.name.toLowerCase()] = i.id;
        return acc;
      },
      {} as Record<string, string>,
    ) || {};

  const insertedCompanies = [];

  for (const c of companies) {
    const slug = c.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    // --- 1. Upsert company ---
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    let companyId: string;

    if (existingCompany?.id) {
      // Company already exists — reuse it
      companyId = existingCompany.id;
    } else {
      const industryId = c.industry
        ? (industryMap[c.industry.toLowerCase()] ?? null)
        : null;

      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            name: c.name,
            website: c.website || null,
            description: c.description || null,
            industry_id: industryId,
            added_by_profile_id: addedByProfileId,
            slug,
          },
        ])
        .select("id")
        .single();

      if (companyError || !companyData) {
        console.error("Error inserting company:", companyError);
        continue;
      }

      companyId = companyData.id;
    }

    // --- 2. Handle contact (separate model, linked via company_id) ---
    if (c.contact?.email) {
      // Check if contact already exists by email
      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", c.contact.email)
        .single();

      if (existingContact?.id) {
        // Update existing contact with the new company_id and details
        const { error: contactUpdateError } = await supabase
          .from("contacts")
          .update({
            company_id: companyId,
            name: c.contact.name || null,
            title: c.contact.title || null,
            added_by_profile_id: addedByProfileId,
          })
          .eq("id", existingContact.id);

        if (contactUpdateError) {
          console.error("Error updating contact:", contactUpdateError);
        }
      } else {
        // Insert new contact
        const { error: contactInsertError } = await supabase
          .from("contacts")
          .insert({
            company_id: companyId,
            email: c.contact.email,
            name: c.contact.name || null,
            title: c.contact.title || null,
            added_by_profile_id: addedByProfileId,
          });

        if (contactInsertError) {
          console.error("Error inserting contact:", contactInsertError);
        }
      }
    }

    // --- 3. Handle target_companies (always attempt, even if company existed) ---
    if (clientCompanyId) {
      const relationshipCategoryId = c.relationship_category
        ? (categoryMap[c.relationship_category.toLowerCase()] ?? null)
        : null;

      const fallbackCategoryId =
        relationshipCategoryId ?? categories?.[0]?.id ?? null;

      if (!fallbackCategoryId) {
        console.error(
          "No relationship category available, skipping target_companies insert",
        );
        insertedCompanies.push({ id: companyId, name: c.name });
        continue;
      }

      const { data: existingTarget } = await supabase
        .from("target_companies")
        .select("id")
        .eq("client_company_id", clientCompanyId)
        .eq("target_company_id", companyId)
        .single();

      if (!existingTarget?.id) {
        const { error: targetError } = await supabase
          .from("target_companies")
          .insert([
            {
              target_company_id: companyId,
              client_company_id: clientCompanyId,
              profile_id: addedByProfileId,
              added_by_profile_id: addedByProfileId,
              relationship_category: fallbackCategoryId,
              why: c.why || null,
              selected: true,
              interested: false,
            },
          ]);

        if (targetError) {
          console.error("Error inserting into target_companies:", targetError);
        }
      } else {
        console.log(
          `Target company relationship already exists for company: ${c.name}`,
        );
      }
    }

    insertedCompanies.push({ id: companyId, name: c.name });
  }

  return insertedCompanies;
}

export async function createTargetCompaniesFromDescription(
  description: string,
  profileId: string,
  clientCompanyId?: string,
) {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("relationship_categories")
    .select("name");
  const categoryNames = categories?.map((c) => c.name) || [];

  const companies = await fetchTargetCompaniesFromOpenAI(
    description,
    categoryNames,
  );

  const saved = await saveTargetCompanies(
    companies,
    profileId,
    clientCompanyId,
  );

  console.log(
    `Generated and saved ${saved.length} target companies for description: "${description}"`,
  );

  revalidatePath("/dashboard/companies");

  return saved;
}
