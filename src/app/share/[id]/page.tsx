import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShareClient } from '@/components/share/share-client';

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientCompanyId } = await params;

  if (!clientCompanyId) {
    console.error('No clientCompanyId provided');
    return <div>Invalid share link</div>;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('target_companies')
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
    .eq('client_company_id', clientCompanyId)
    // eslint-disable-next-line unicorn/no-null
    .is('deleted_at', null); // <-- exclude deleted companies

  if (error) {
    console.error('Error fetching target companies:', error);
    return <div>Error fetching companies</div>;
  }

  const companies = (data || []).flatMap((item) => {
    let companiesArray: typeof item.companies = [];

    if (Array.isArray(item.companies)) {
      companiesArray = item.companies;
    } else if (item.companies) {
      companiesArray = [item.companies];
    }

    // Map to expected structure
    return companiesArray.map((company: { id: any; name: any; description: any }) => ({
      id: String(company.id),
      name: company.name,
      description: company.description,
      why: item.why,
      note: item.note,
      selected: item.selected,
      relationship_category: item.relationship_category?.[0]?.name || 'Uncategorized',
    }));
  });

  return <ShareClient clientCompanyId={clientCompanyId} companies={companies} />;
}
