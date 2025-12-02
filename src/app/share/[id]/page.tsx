import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShareClient } from "@/components/share/share-client";

interface SharePageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ token?: string }>;
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
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

    // If there's a token, fetch the share link and contact information
    let sharedContact = null;
    let sharedCompany = null;

    if (token) {
        const { data: shareLink, error: shareLinkError } = await supabase
            .from("share_links")
            .select("*")
            .eq("link_token", token)
            .eq("company_id", clientCompanyId)
            .single();

        if (!shareLinkError && shareLink) {
            const contactId = shareLink.permissions?.contact_id;

            if (contactId) {
                // Fetch contact details
                const { data: contact } = await supabase
                    .from("contacts")
                    .select(`
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
                    `)
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
                    // Supabase returns the relation as a single object, not an array
                    const company = contact.companies as any;
                    if (company) {
                        sharedCompany = {
                            id: company.id,
                            name: company.name,
                            logo_url: company.logo_url,
                            website: company.website,
                            description: company.description,
                        };
                    }
                }
            }
        }
    }

    // Only fetch target companies if user is authenticated
    let companies: any[] = [];

    if (user) {
        const { data, error } = await supabase
            .from("target_companies")
            .select(`
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
            `)
            .eq("client_company_id", clientCompanyId)
            .is("deleted_at", null); // <-- exclude deleted companies

        if (error) {
            console.error("Error fetching target companies:", error);
        } else {
            companies = (data || []).map((item: any) => ({
                id: String(item.companies.id),
                name: item.companies.name,
                description: item.companies.description,
                why: item.why,
                note: item.note,
                selected: item.selected,
                relationship_category: item.relationship_category?.name || "Uncategorized",
            }));
        }
    }

    return (
        <ShareClient
            clientCompanyId={clientCompanyId}
            companies={companies}
            sharedContact={sharedContact}
            sharedCompany={sharedCompany}
        />
    );
}
