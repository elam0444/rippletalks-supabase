"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";

// -----------------------------
// 🧠 UTIL: Extract URL from text
// -----------------------------
function extractUrlFromText(text: string): string | null {
  if (!text) return null;

  const urlRegex = /(https?:\/\/[^\s]+)/i;
  const match = text.match(urlRegex);

  if (!match) return null;

  try {
    const url = new URL(match[0]);
    return url.toString();
  } catch {
    return null;
  }
}

// -----------------------------
// 🌐 UTIL: Fetch + clean webpage
// -----------------------------
export async function scrapeCleanTextFromUrl(rawText: string): Promise<string> {
  try {
    const url = extractUrlFromText(rawText);

    if (!url) {
      console.warn("No valid URL found in description");
      return "";
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PuberryBot/1.0)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Failed to fetch URL:", response.status);
      return "";
    }

    const html = await response.text();

    // Remove scripts, styles, and tags
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
      .replace(/<[^>]+>/g, " ");

    // Decode HTML entities (basic)
    text = text
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

    // Normalize whitespace
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n+/g, " ")
      .trim();

    // Limit size to avoid token explosion
    return text.slice(0, 8000);
  } catch (error) {
    console.error("Scraping error:", error);
    return "";
  }
}

type TargetCompany = {
  name: string;
  legal_name: string;
  website?: string;
  description?: string;
  industry?: string;
  contact?: {
    email?: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    title?: string;
  } | null;
  relationship_category?: string;
  why?: string;
};

// Call OpenAI to get companies with category suggestion
export async function fetchTargetCompaniesFromOpenAI(
  description: string, // includes, name, description, industry, and url
  availableCategories: string[],
  availableIndustries: string[],
  targetCustomerProfile?: string | null,
): Promise<TargetCompany[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

   // 🔥 NEW: scrape website if present
  const scrapedText = await scrapeCleanTextFromUrl(description);

  const systemPrompt = `Company:  ${description}
- Target customer profile: ${targetCustomerProfile || "N/A"}
- Scraped website text (if URL provided): ${scrapedText || "N/A"}

DO NOT USE past memory, this is a new request. You are an expert researcher and you are helping me build a high-quality list of target companies for partnership and outreach based on the above company description and target customer profile. 
Generate a JSON array of up to 20 companies inside this categories: ${availableCategories.join(", ")} with the following requirements:

1. Include a mix of: 
  a. Likely existing customers (if relevant)
  b. High-quality expansion prospects 
2. Split the list between large and mid-sized companies (no household names). 
3. The list should represent companies in different industries. 
4. Avoid suggesting emerging startups (under $20M raised) unless explicitly asked.
5. Do NOT include companies that operate in the same or adjacent categories as the Company. If there is any ambiguity, err on the side of exclusion.`;

  const userPrompt = `This is a new request. You are an expert researcher and you are helping me build a high-quality ${availableIndustries.join(", ")}
Each company should include:
- name
- legal_name (if available)
- website (if available)
- description
- industry (must use exactly this key name) from the following options: ${availableIndustries.join(", ")}
- why (this should be a brief explanation 1 line of why this company is relevant or important to connect with based on the description)
- a contact object with "name" (first and last name only, no title), "title" (job title separately please try to find the CEO), and "email" fields for a person who could be useful for outreach
- a relationship_category (must use exactly this key name) from the following options: ${availableCategories.join(", ")}

Output strictly as a JSON object with a "companies" array. Do NOT return the same company described in the input.

Example output format:
{
  "companies": [
    {
      "name": "Acme Corp",
      "legal_name": "Acme Inc."
      "website": "https://acmecorp.com",
      "description": "A leading provider of cloud infrastructure solutions for mid-market enterprises.",
      "industry": "Cloud Computing",
      "why": "This company is important because..."
      "contact": {
        "name": "Jane Smith",
        "first_name": "Jane",
        "last_name": "Smith",
        "title": "Head of Partnerships",
        "email": "jane.smith@acmecorp.com"
      },
      "relationship_category": "Prospect"
    },
    {
      "name": "Bright Ventures",
      "legal_name": "ABC Inc.",
      "website": "https://brightventures.io",
      "description": "Early-stage VC fund focused on B2B SaaS startups.",
      "industry": "Venture Capital",
      "why": "This company is important because..."
      "contact": {
        "name": "Tom Nguyen",
        "first_name": "Tom",
        "last_name": "Nguyen",
        "title": "General Partner",
        "email": "tom@brightventures.io"
      },
      "relationship_category": "Partner"
    }
  ]
}
`;

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_API_MODEL || "gpt-4.1",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
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
            legal_name: c.legal_name || null,
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

    // --- 2. Handle contact ---
    if (c.contact?.email) {
      console.log("Attempting contact save:", {
        company_id: companyId,
        email: c.contact.email,
      });

      const { data: existingContact } = await supabase
        .from("contacts")
        .select("id")
        .eq("email", c.contact.email)
        .single();

      if (existingContact?.id) {
        const { error: contactUpdateError } = await supabase
          .from("contacts")
          .update({
            company_id: companyId,
            name: c.contact.name || null,
            first_name: c.contact?.first_name || null,
            last_name: c.contact?.last_name || null,
            title: c.contact.title || null,
            added_by_profile_id: addedByProfileId,
          })
          .eq("id", existingContact.id);

        if (contactUpdateError) {
          console.error("Error updating contact:", contactUpdateError);
        }
      } else {
        const { error: contactInsertError } = await supabase
          .from("contacts")
          .insert({
            company_id: companyId,
            email: c.contact.email,
            name: c.contact.name || null,
            first_name: c.contact?.first_name || null,
            last_name: c.contact?.last_name || null,
            title: c.contact.title || null,
            added_by_profile_id: addedByProfileId,
          });

        if (contactInsertError) {
          console.error("Error inserting contact:", contactInsertError);
        }
      }
    }

    // --- 3. Handle target_companies ---
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

  // Fetch all relationship categories
  const { data: allCategories } = await supabase
    .from("relationship_categories")
    .select("id, name");

  let categoryNames: string[] = [];
  let targetCustomerProfile: string | null = null;

  if (clientCompanyId) {
    const { data: clientCompany } = await supabase
      .from("companies")
      .select("preferred_relationship_categories, target_customer_profile")
      .eq("id", clientCompanyId)
      .single();

    // Resolve preferred category UUIDs to names for the prompt
    const preferredIds: string[] =
      clientCompany?.preferred_relationship_categories ?? [];

    if (preferredIds.length > 0 && allCategories) {
      categoryNames = allCategories
        .filter((c) => preferredIds.includes(c.id))
        .map((c) => c.name);
    }

    // Grab the target customer profile if set
    targetCustomerProfile = clientCompany?.target_customer_profile ?? null;
  }

  // Fall back to all categories when no preferred ones are configured
  if (categoryNames.length === 0 && allCategories) {
    categoryNames = allCategories.map((c) => c.name);
  }

  const { data: industries } = await supabase.from("industries").select("name");
  const industryNames = industries?.map((i) => i.name) || [];

  const companies = await fetchTargetCompaniesFromOpenAI(
    description,
    categoryNames,
    industryNames,
    targetCustomerProfile,
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
