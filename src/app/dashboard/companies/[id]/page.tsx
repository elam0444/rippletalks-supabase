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
import {
  ArrowLeft,
  Building2,
  Target,
  Pencil,
  Users,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/dashboard/company-form";
import { DeleteCompanyDialog } from "@/components/dashboard/delete-company-dialog";
import { AddTargetCompanyForm } from "@/components/dashboard/add-target-company-form";
import { TargetCompaniesTable } from "@/components/dashboard/target-companies-table";
import { AddContactForm } from "@/components/dashboard/add-contact-form";
import { EditContactForm } from "@/components/dashboard/edit-contact-form";
import { RemoveContactButton } from "@/components/dashboard/remove-contact-button";
import { ShareContactButton } from "@/components/dashboard/share-contact-button";
import { AttachContactForm } from "@/components/dashboard/attach-contact-form";
import { getIndustries, getCompanyById } from "@/lib/actions/company";
import {
  getContactsByCompanyId,
  getAvailableContacts,
} from "@/lib/actions/contact";
import {
  getRelationshipCategories,
  getAvailableCompaniesToTarget,
} from "@/lib/actions/target-company";
import ContactDatesModal from "@/components/dashboard/contact-dates-modal";
import { CompanyLogoImage } from "@/components/dashboard/company-logo-image";

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

  const company = await getCompanyById(id);

  if (!company) {
    notFound();
  }

  const industries = await getIndustries();

  const [categories, availableCompanies, contacts, availableContacts] =
    await Promise.all([
      getRelationshipCategories(),
      getAvailableCompaniesToTarget(id),
      getContactsByCompanyId(id),
      getAvailableContacts(id),
    ]);

  const { data: targetCompanies } = await supabase
    .from("target_companies")
    .select(
      `
      id,
      why,
      note,
      selected,
      interested,
      updated_at,
      target_company:target_company_id (
        id,
        name,
        logo_url,
        website,
        description
      ),
      relationship_category,
      category:relationship_category (
        id,
        name
      )
    `,
    )
    .eq("client_company_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch selected dates for all contacts of this company
  const { data: selectedDates } = await supabase
    .from("contact_available_dates")
    .select(
      `
      id,
      available_date,
      is_selected,
      contact:contact_id (
        id,
        name,
        avatar_url
      )
    `,
    )
    .eq("company_id", id)
    .order("available_date", { ascending: true });

  // Group dates by contact
  const datesByContact = (selectedDates ?? []).reduce(
    (acc, row) => {
      const contact = row.contact as unknown as {
        id: string;
        name: string;
        avatar_url: string | null;
      } | null;
      if (!contact) return acc;
      if (!acc[contact.id]) {
        acc[contact.id] = { contact, dates: [] };
      }
      acc[contact.id].dates.push({
        date: new Date(row.available_date),
        is_selected: row.is_selected as boolean,
      });
      return acc;
    },
    {} as Record<
      string,
      {
        contact: { id: string; name: string; avatar_url: string | null };
        dates: { date: Date; is_selected: boolean }[];
      }
    >,
  );

  const groupedDates = Object.values(datesByContact);

  // Build contacts map keyed by target_company id (not the join row's company_id)
  const targetCompanyIds = targetCompanies?.length
    ? (targetCompanies
        .map(
          (tc) => (tc.target_company as unknown as { id: string } | null)?.id,
        )
        .filter(Boolean) as string[])
    : [];

  const { data: targetContacts } = targetCompanyIds.length
    ? await supabase
        .from("contacts")
        .select("id, company_id, title, first_name, last_name, name, email")
        .in("company_id", targetCompanyIds)
    : { data: [] };

  const contactsMap = new Map(
    (targetContacts ?? []).map((c) => [c.company_id, c]),
  );

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Back button */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
        </div>

        {/* Company Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <Image
                src={company.logo_url}
                alt={company.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <CompanyLogoImage
                name={company.name}
                logoUrl={company.logo_url}
                website={company.website}
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{company.name}</h1>
              <p className="text-muted-foreground">
                {/* @ts-expect-error - Supabase returns single object for foreign key relation */}
                {company.industries?.name || "No industry"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CompanyForm
              mode="edit"
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
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 mr-2" />
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Contacts
              </CardTitle>
              <CardDescription>People at {company.name}</CardDescription>
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
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[250px]">Name</TableHead>
                    <TableHead className="w-[150px]">Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="w-[150px]">Panelist Type</TableHead>
                    <TableHead className="w-[150px]">Phone</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {contact.avatar_url ? (
                            <Image
                              src={contact.avatar_url}
                              alt={contact.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                              <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                          <span className="font-medium">{contact.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {contact.title || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {contact.email ? (
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-primary hover:underline"
                          >
                            {contact.email}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {(Array.isArray(contact.panelist_types)
                            ? contact.panelist_types[0]
                            : (contact.panelist_types as {
                                name: string;
                              } | null)
                          )?.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {contact.phone || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ContactDatesModal
                            contactId={contact.id}
                            companyId={company.id}
                          />
                          <ShareContactButton
                            contactId={contact.id}
                            companyId={company.id}
                            contactName={contact.name}
                          />
                          <EditContactForm
                            contactId={contact.id}
                            companyId={company.id}
                            initialData={{
                              first_name: contact.first_name,
                              last_name: contact.last_name,
                              email: contact.email,
                              title: contact.title,
                              phone: contact.phone,
                              avatar_url: contact.avatar_url,
                              panelist_type_id: contact.panelist_type_id,
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
              <div className="py-8 text-center text-muted-foreground">
                No contacts found for {company.name}.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Companies Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
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
            <TargetCompaniesTable
              targetCompanies={(targetCompanies ?? []).map((t) => {
                const tc = t.target_company as unknown as {
                  id: string;
                  name: string;
                  logo_url?: string | null;
                  website?: string | null;
                  description?: string | null;
                } | null;
                return {
                  ...t,
                  target_company: tc,
                  category: t.category as unknown as {
                    id: string;
                    name: string;
                  } | null,
                  contact: tc
                    ? (contactsMap.get(tc.id) ?? {
                        id: "",
                        title: "",
                        name: "",
                        first_name: "",
                        last_name: "",
                        email: "",
                      })
                    : {
                        id: "",
                        title: "",
                        name: "",
                        first_name: "",
                        last_name: "",
                        email: "",
                      },
                };
              })}
              clientCompanyId={company.id}
              clientCompanyName={company.name}
              categories={categories}
            />
          </CardContent>
        </Card>

        {/* Selected Dates Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Suggested Dates for Fireside Chat
            </CardTitle>
            <CardDescription>
              Dates contacts at {company.name} are available
            </CardDescription>
          </CardHeader>
          <CardContent>
            {groupedDates.length > 0 ? (
              <div className="space-y-6">
                {groupedDates.map(({ contact, dates }, index) => (
                  <div key={contact.id}>
                    {/* Contact header */}
                    <div className="flex items-center gap-2 mb-3">
                      {contact.avatar_url ? (
                        <Image
                          src={contact.avatar_url}
                          alt={contact.name}
                          width={28}
                          height={28}
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="text-sm font-medium">
                        {contact.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({dates.length} {dates.length === 1 ? "slot" : "slots"})
                      </span>
                    </div>

                    {/* Date chips */}
                    <div className="flex flex-wrap gap-2">
                      {dates.map(({ date, is_selected }) => (
                        <span
                          key={date.toISOString()}
                          className="inline-flex items-center gap-1.5 rounded-full border bg-muted/50 px-3 py-1 text-xs font-medium"
                        >
                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                          {date.toLocaleDateString(undefined, {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          <span className="text-muted-foreground">
                            {date.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {is_selected ? (
                            <span className="ml-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                              ✓ Selected
                            </span>
                          ) : (
                            <span className="ml-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Pending
                            </span>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Divider between contacts */}
                    {index < groupedDates.length - 1 && (
                      <div className="mt-4 border-t" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                No availability dates have been selected for contacts at{" "}
                {company.name}.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
