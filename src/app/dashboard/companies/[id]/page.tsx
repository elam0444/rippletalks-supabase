import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Building2, Target, Pencil, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/dashboard/company-form";
import { DeleteCompanyDialog } from "@/components/dashboard/delete-company-dialog";
import { AddTargetCompanyForm } from "@/components/dashboard/add-target-company-form";
import { EditTargetCompanyForm } from "@/components/dashboard/edit-target-company-form";
import { RemoveTargetCompanyButton } from "@/components/dashboard/remove-target-company-button";
import { AddContactForm } from "@/components/dashboard/add-contact-form";
import { EditContactForm } from "@/components/dashboard/edit-contact-form";
import { RemoveContactButton } from "@/components/dashboard/remove-contact-button";
import { ShareContactButton } from "@/components/dashboard/share-contact-button";
import { AttachContactForm } from "@/components/dashboard/attach-contact-form";
import { getIndustries, getCompanyById } from "@/lib/actions/company";
import { getContactsByCompanyId, getAvailableContacts } from "@/lib/actions/contact";
import {
  getRelationshipCategories,
  getAvailableCompaniesToTarget,
} from "@/lib/actions/target-company";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the company details
  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  // Fetch industries for the edit form
  const industries = await getIndustries();

  // Fetch relationship categories, available companies, and contacts
  const [categories, availableCompanies, contacts, availableContacts] = await Promise.all([
    getRelationshipCategories(),
    getAvailableCompaniesToTarget(id),
    getContactsByCompanyId(id),
    getAvailableContacts(id),
  ]);

  // Fetch target companies for this company (as client_company)
  const { data: targetCompanies } = await supabase
    .from("target_companies")
    .select(
      `
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
      relationship_category,
      category:relationship_category (
        id,
        name
      )
    `
    )
    .eq("client_company_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className='min-h-screen p-6'>
      <div className='mx-auto max-w-6xl space-y-6'>
        {/* Back button and header */}
        <div className='flex items-center gap-4'>
          <Link href='/dashboard'>
            <Button variant='ghost' size='sm' className='gap-2'>
              <ArrowLeft className='h-4 w-4' />
              Back
            </Button>
          </Link>
        </div>

        {/* Company Header */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                className='h-16 w-16 rounded-lg object-cover'
              />
            ) : (
              <div className='flex h-16 w-16 items-center justify-center rounded-lg bg-muted'>
                <Building2 className='h-8 w-8 text-muted-foreground' />
              </div>
            )}
            <div>
              <h1 className='text-2xl font-bold'>{company.name}</h1>
              <p className='text-muted-foreground'>
                {/* @ts-expect-error - Supabase returns single object for foreign key relation */}
                {company.industries?.name || "No industry"}
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <CompanyForm
              mode='edit'
              industries={industries}
              initialData={{
                id: company.id,
                name: company.name,
                legal_name: company.legal_name,
                website: company.website,
                logo_url: company.logo_url,
                description: company.description,
                industry_id: company.industry_id,
              }}
              trigger={
                <Button variant='outline' size='sm'>
                  <Pencil className='h-4 w-4 mr-2' />
                  Edit
                </Button>
              }
            />
            <DeleteCompanyDialog
              companyId={company.id}
              companyName={company.name}
              redirectOnDelete
            />
          </div>
        </div>

        {/* Contacts Table */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                Contacts
              </CardTitle>
              <CardDescription>
                People at {company.name}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <AttachContactForm
                companyId={company.id}
                companyName={company.name}
                availableContacts={availableContacts}
              />
              <AddContactForm
                companyId={company.id}
                companyName={company.name}
              />
            </div>
          </CardHeader>
          <CardContent>
            {contacts && contacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50'>
                    <TableHead className='w-[250px]'>Name</TableHead>
                    <TableHead className='w-[150px]'>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className='w-[150px]'>Phone</TableHead>
                    <TableHead className='w-[100px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          {contact.avatar_url ? (
                            <Image
                              src={contact.avatar_url}
                              alt={contact.name}
                              width={32}
                              height={32}
                              className='h-8 w-8 rounded-full object-cover'
                            />
                          ) : (
                            <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
                              <Users className='h-4 w-4 text-muted-foreground' />
                            </div>
                          )}
                          <span className='font-medium'>{contact.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='text-muted-foreground'>
                          {contact.title || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className='text-primary hover:underline'
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className='text-muted-foreground'>
                          {contact.phone || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <ShareContactButton
                            contactId={contact.id}
                            companyId={company.id}
                            contactName={contact.name}
                          />
                          <EditContactForm
                            contactId={contact.id}
                            companyId={company.id}
                            initialData={{
                              name: contact.name,
                              email: contact.email,
                              title: contact.title,
                              phone: contact.phone,
                              avatar_url: contact.avatar_url,
                            }}
                          />
                          <RemoveContactButton
                            contactId={contact.id}
                            companyId={company.id}
                            contactName={contact.name}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className='py-8 text-center text-muted-foreground'>
                No contacts found for {company.name}.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Companies Table */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                Target Companies
              </CardTitle>
              <CardDescription>
                Companies that {company.name} is targeting
              </CardDescription>
            </div>
            <AddTargetCompanyForm
              clientCompanyId={company.id}
              availableCompanies={availableCompanies}
              categories={categories}
            />
          </CardHeader>
          <CardContent>
            {targetCompanies && targetCompanies.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className='bg-muted/50'>
                    <TableHead className='w-[300px]'>Target Company</TableHead>
                    <TableHead className='w-[150px]'>Category</TableHead>
                    <TableHead>Why</TableHead>
                    <TableHead className='w-[100px]'></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {targetCompanies.map((target) => {
                    const targetCompany = target.target_company as unknown as {
                      id: string;
                      name: string;
                      logo_url: string | null;
                      website: string | null;
                    } | null;
                    const category = target.category as unknown as {
                      id: string;
                      name: string;
                    } | null;

                    return (
                      <TableRow key={target.id}>
                        <TableCell>
                          <div className='flex items-center gap-3'>
                            {targetCompany?.logo_url ? (
                              <Image
                                src={targetCompany.logo_url}
                                alt={targetCompany.name}
                                className='h-8 w-8 rounded object-cover'
                              />
                            ) : (
                              <div className='flex h-8 w-8 items-center justify-center rounded bg-muted'>
                                <Building2 className='h-4 w-4 text-muted-foreground' />
                              </div>
                            )}
                            <span className='font-medium'>
                              {targetCompany?.name || "Unknown"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className='inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium'>
                            {category?.name || "—"}
                          </span>
                        </TableCell>
                        <TableCell className='max-w-[400px]'>
                          <p
                            className='truncate text-muted-foreground'
                            title={target.why || ""}
                          >
                            {target.why || "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center gap-1'>
                            <EditTargetCompanyForm
                              targetId={target.id}
                              clientCompanyId={company.id}
                              targetCompanyName={
                                targetCompany?.name || "Unknown"
                              }
                              categories={categories}
                              initialData={{
                                relationship_category: category?.id || "",
                                why: target.why,
                                note: target.note,
                              }}
                            />
                            <RemoveTargetCompanyButton
                              targetId={target.id}
                              clientCompanyId={company.id}
                              targetCompanyName={
                                targetCompany?.name || "Unknown"
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className='py-8 text-center text-muted-foreground'>
                No target companies found for {company.name}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
