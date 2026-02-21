"use server";

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

type TargetCompany = {
  why: null;
  name: string;
  website?: string;
  description?: string;
  industry?: string;
  contact?: {
    name?: string;
    email?: string;
  };
  relationship_category?: string;
};

// Call OpenAI to get companies with category suggestion
export async function fetchTargetCompaniesFromOpenAI(
  description: string,
  availableCategories: string[],
): Promise<TargetCompany[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const exampleOutput = {
    companies: [
      {
        name: "Example Company",
        website: "https://example.com",
        description: "A brief description of what this company does.",
        why: "This explains why this company is relevant or complementary to the input description.",
        industry: "Education Technology",
        contact: {
          name: "Partnerships Team",
          email: "partnerships@example.com",
        },
        relationship_category: availableCategories[0] ?? "Partner",
      },
    ],
  };

  const prompt = `
You are an expert researcher. Generate a list of maximum 20 companies that are related, complementary, or relevant to this company/description, and could be good for networking, partnerships, or business connections:
"${description}"

Each company should include:
- name
- website (if available)
- description
- industry
- a contact email who could be useful for outreach
- a relationship_category (must use exactly this key name) from the following options: ${availableCategories.join(", ")}

Return a JSON object with a single key "companies" containing an array of company objects.
Do NOT return the same company described in the input.

Example of the exact format to follow:
${JSON.stringify(exampleOutput, null, 2)}
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
  clientCompanyId?: string, // ID of the company that owns these targets
) {
  if (companies.length === 0) return [];

  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("relationship_categories")
    .select("id,name");

  const categoryMap =
    categories?.reduce(
      (acc, c) => {
        acc[c.name.toLowerCase()] = c.id;
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

    // --- 1. Handle company ---
    const { data: existingCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", slug)
      .single();

    let companyId: string;

    if (existingCompany?.id) {
      companyId = existingCompany.id;
    } else {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .insert([
          {
            name: c.name,
            website: c.website || null,
            description: c.description || null,
            industry_id: null,
            added_by_profile_id: addedByProfileId,
            slug,
          },
        ])
        .select("id")
        .single();

      if (companyError) {
        console.error("Error inserting company:", companyError);
        continue;
      }

      companyId = companyData.id;
    }

    // --- 2. Handle contact ---
    if (c.contact) {
      const { error: contactError } = await supabase.from("contacts").upsert(
        [
          {
            company_id: companyId,
            email: c.contact.email,
            name: c.contact.name,
            added_by_profile_id: addedByProfileId,
          },
        ],
        { onConflict: "email" }, // assumes email is unique
      );

      if (contactError) console.error("Error upserting contact:", contactError);
    }

    const relationshipCategoryId = c.relationship_category
      ? categoryMap[c.relationship_category.toLowerCase()] || null
      : null;

    // --- 3. Handle target_companies ---
    if (clientCompanyId) {
      const { data: existingTarget } = await supabase
        .from("target_companies")
        .select("id")
        .eq("client_company_id", clientCompanyId)
        .eq("target_company_id", companyId)
        .single();

      if (!existingTarget?.id) {
        // Fall back to the first available category if none matched
        const fallbackCategoryId =
          relationshipCategoryId ?? (categories?.[0]?.id || null);

        if (!fallbackCategoryId) {
          console.error("No relationship category available, skipping insert");
          continue;
        }

        const { error: targetError } = await supabase
          .from("target_companies")
          .insert([
            {
              target_company_id: companyId,
              client_company_id: clientCompanyId,
              profile_id: addedByProfileId,
              added_by_profile_id: addedByProfileId,
              relationship_category: fallbackCategoryId,
              selected: true,
              interested: false,
              why: c.why || null,
            },
          ]);

        if (targetError)
          console.error("Error inserting into target_companies:", targetError);
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
  // Fetch all relationship categories to feed AI
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
  return saved;
}
