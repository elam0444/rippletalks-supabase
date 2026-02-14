import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ShareClient } from "@/components/share/share-client";

interface SharePageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

export default async function SharePage({
  params,
  searchParams,
}: SharePageProps) {
  const { id: clientCompanyId } = await params;
  const { token } = await searchParams;

  if (!clientCompanyId) {
    console.error("No clientCompanyId provided");
    return <div>Invalid share link</div>;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only require login if there's no token (accessing without a share link)
  if (!user && !token) redirect("/login");

  // Use admin client for share link queries so unauthenticated users can access
  const adminClient = createAdminClient();

  // If there's a token, fetch the share link and contact information
  let sharedContact = null;
  let sharedCompany = null;
  let contactDates: { available_date: string; is_selected: boolean }[] = [];

  if (token) {
    const { data: shareLink, error: shareLinkError } = await adminClient
      .from("share_links")
      .select("*")
      .eq("link_token", token)
      .eq("company_id", clientCompanyId)
      .single();

    if (!shareLinkError && shareLink) {
      const contactId = shareLink.permissions?.contact_id;

      if (contactId) {
        // Fetch contact details
        const { data: contact } = await adminClient
          .from("contacts")
          .select(
            `
                        id,
                        name,
                        email,
                        title,
                        phone,
                        avatar_url,
                        company_id,
                        companies (
                            id,
                            name,
                            logo_url,
                            website,
                            description
                        )
                    `,
          )
          .eq("id", contactId)
          .single();

        if (contact) {
          sharedContact = {
            id: contact.id,
            name: contact.name,
            email: contact.email,
            title: contact.title,
            phone: contact.phone,
            avatar_url: contact.avatar_url,
          };

          const { data, error } = await adminClient
            .from("contact_available_dates")
            .select("available_date")
            .eq("contact_id", sharedContact.id)
            .order("available_date", { ascending: true });

          if (error) {
            console.error("Error fetching contact dates:", error);
          } else if (data) {
            contactDates = (data || []).map((d: { available_date: string }) => ({
              available_date: d.available_date,
              is_selected: false,
            }));
          }

          // Supabase returns the relation as a single object, not an array
          const companyData = Array.isArray(contact.companies)
            ? contact.companies[0]
            : contact.companies;
          if (companyData) {
            sharedCompany = {
              id: companyData.id,
              name: companyData.name,
              logo_url: companyData.logo_url ?? undefined,
              website: companyData.website ?? undefined,
              description: companyData.description ?? undefined,
            };
          }
        }
      }
    }
  }

  // Only fetch target companies if user is authenticated
  let companies: { id: string; name: string; description?: string; why?: string; note?: string; selected?: boolean; relationship_category?: string }[] = [];

  if (user) {
    const { data, error } = await supabase
      .from("target_companies")
      .select(
        `
                id,
                why,
                note,
                selected,
                deleted_at,
                relationship_category:relationship_categories (
                  name
                ),
                companies!target_companies_target_company_id_fkey (
                  id,
                  name,
                  description
                )
            `,
      )
      .eq("client_company_id", clientCompanyId)
      .is("deleted_at", null); // <-- exclude deleted companies

    if (error) {
      console.error("Error fetching target companies:", error);
    } else {
      companies = (data || []).map((item) => {
        const comp = Array.isArray(item.companies)
          ? item.companies[0]
          : item.companies;
        const cat = Array.isArray(item.relationship_category)
          ? item.relationship_category[0]
          : item.relationship_category;
        return {
          id: String(comp?.id),
          name: comp?.name ?? "",
          description: comp?.description ?? undefined,
          why: item.why ?? undefined,
          note: item.note ?? undefined,
          selected: item.selected ?? undefined,
          relationship_category: cat?.name ?? "Uncategorized",
        };
      });
    }
  }

  return (
    <ShareClient
      clientCompanyId={clientCompanyId}
      companies={companies}
      sharedContact={sharedContact}
      sharedCompany={sharedCompany}
      contactDates={contactDates}
    />
  );
}
