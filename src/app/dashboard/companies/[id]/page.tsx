import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Building2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the company details
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      logo_url,
      website,
      description,
      industries (
        name
      )
    `)
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (companyError || !company) {
    notFound()
  }

  // Fetch target companies for this company (as client_company)
  const { data: targetCompanies } = await supabase
    .from('target_companies')
    .select(`
      id,
      why,
      note,
      selected,
      interested,
      target_company:target_company_id (
        id,
        name,
        logo_url,
        website
      ),
      category:relationship_category (
        name
      )
    `)
    .eq('client_company_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back button and header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Company Header */}
        <div className="flex items-center gap-4">
          {company.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="h-16 w-16 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-muted-foreground">
              {/* @ts-expect-error - Supabase returns single object for foreign key relation */}
              {company.industries?.name || 'No industry'}
            </p>
          </div>
        </div>

        {/* Target Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Target Companies
            </CardTitle>
            <CardDescription>
              Companies that {company.name} is targeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {targetCompanies && targetCompanies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[300px]">Target Company</TableHead>
                    <TableHead className="w-[150px]">Category</TableHead>
                    <TableHead>Why</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetCompanies.map((target) => {
                    const targetCompany = target.target_company as unknown as {
                      id: string
                      name: string
                      logo_url: string | null
                      website: string | null
                    } | null
                    const category = target.category as unknown as { name: string } | null

                    return (
                      <TableRow key={target.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {targetCompany?.logo_url ? (
                              <img
                                src={targetCompany.logo_url}
                                alt={targetCompany.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <span className="font-medium">
                              {targetCompany?.name || 'Unknown'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                            {category?.name || '—'}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[400px]">
                          <p className="truncate text-muted-foreground" title={target.why || ''}>
                            {target.why || '—'}
                          </p>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No target companies found for {company.name}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
