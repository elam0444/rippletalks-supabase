import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CSVUploadCard } from "@/components/dashboard/csv-upload-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Building2, Globe, ChevronRight, Plus } from "lucide-react";
import { CompanyForm } from "@/components/dashboard/company-form";
import { getCompanies, getIndustries } from "@/lib/actions/company";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch companies and industries
  const [companies, industries] = await Promise.all([
    getCompanies(),
    getIndustries(),
  ]);

  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto max-w-6xl space-y-6'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>Dashboard</h1>
          <div>
            <SignOutButton />
          </div>
        </div>

        {/* Companies Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Companies
              </CardTitle>
              <CardDescription>
                Click on a company to view its target companies
              </CardDescription>
            </div>
            <CompanyForm
              mode="create"
              industries={industries}
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Company
                </Button>
              }
            />
          </CardHeader>
          <CardContent>
            {companies && companies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50'>
                    <TableHead className='w-[300px]'>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead className='w-[50px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className='group'>
                      <TableCell>
                        <Link
                          href={`/dashboard/companies/${company.id}`}
                          className='flex items-center gap-3 font-medium hover:text-primary'
                        >
                          {company.logo_url ? (
                            <Image
                              src={company.logo_url}
                              alt={company.name}
                              className='h-8 w-8 rounded object-cover'
                            />
                          ) : (
                            <div className='flex h-8 w-8 items-center justify-center rounded bg-muted'>
                              <Building2 className='h-4 w-4 text-muted-foreground' />
                            </div>
                          )}
                          {company.name}
                        </Link>
                      </TableCell>
                      <TableCell className='text-muted-foreground'>
                        {/* @ts-expect-error - Supabase returns single object for foreign key relation */}
                        {company.industries?.name || "—"}
                      </TableCell>
                      <TableCell>
                        {company.website ? (
                          <a
                            href={company.website}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='flex items-center gap-1 text-sm text-muted-foreground hover:text-primary'
                          >
                            <Globe className='h-3 w-3' />
                            {company.website
                              .replace(/^https?:\/\//, "")
                              .replace(/\/$/, "")}
                          </a>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/companies/${company.id}`}>
                          <ChevronRight className='h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100' />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className='py-8 text-center text-muted-foreground'>
                No companies found. Upload a CSV to get started.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile and CSV Upload */}
        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>Email</p>
                <p className='font-medium'>{user.email}</p>
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>User ID</p>
                <p className='font-mono text-sm'>{user.id}</p>
              </div>
              <div className='space-y-2'>
                <p className='text-sm text-muted-foreground'>Last Sign In</p>
                <p className='text-sm'>
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </CardContent>
          </Card>

          <CSVUploadCard />
        </div>
      </div>
    </div>
  );
}
