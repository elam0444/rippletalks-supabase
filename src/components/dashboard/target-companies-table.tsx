"use client";

import { useState } from "react";
import { Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditTargetCompanyForm } from "@/components/dashboard/edit-target-company-form";
import { RemoveTargetCompanyButton } from "@/components/dashboard/remove-target-company-button";
import { WhyNoteDialog } from "@/components/share/company/why-note-dialog";
import { updateTargetCompany } from "@/lib/actions/target-company";
import Image from "next/image";
import { toast } from "sonner";
import type { Company } from "@/types/share";
import { getLogoDevUrl } from "@/lib/utils/logo-utils";

function TargetCompanyLogo({
  name,
  logoUrl,
  website,
}: {
  name: string;
  logoUrl?: string | null;
  website?: string | null;
}) {
  const [error, setError] = useState(false);
  const src = !error ? logoUrl || getLogoDevUrl(website) : null;

  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 rounded object-cover"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
      <Building2 className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

interface TargetCompany {
  id: string;
  why?: string | null;
  note?: string | null;
  selected?: boolean | null;
  updated_at: string;
  target_company: {
    id: string;
    name: string;
    logo_url?: string | null;
    website?: string | null;
    description?: string | null;
  } | null;
  contact: {
    id: string;
    title: string;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  relationship_category: string;
  category: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface TargetCompaniesTableProps {
  targetCompanies: TargetCompany[];
  clientCompanyId: string;
  clientCompanyName: string;
  categories: Category[];
}

export function TargetCompaniesTable({
  targetCompanies,
  clientCompanyId,
  clientCompanyName,
  categories,
}: TargetCompaniesTableProps) {
  const [activeTarget, setActiveTarget] = useState<{
    target: TargetCompany;
    company: Company;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleWhyClick = (target: TargetCompany) => {
    const tc = target.target_company;
    setActiveTarget({
      target,
      company: {
        id: target.id,
        name: tc?.name ?? "Unknown",
        description: tc?.description ?? '',
        why: target.why ?? undefined,
        note: target.note ?? undefined,
      },
    });
  };

  const handleSaveWhy = async (why: string, note: string) => {
    if (!activeTarget) return;
    const result = await updateTargetCompany(
      activeTarget.target.id,
      clientCompanyId,
      {
        relationship_category: activeTarget.target.relationship_category,
        why: why || null,
        note: note || null,
      },
    );
    if (result.success) {
      toast.success("Updated");
    } else {
      toast.error(result.error || "Something went wrong");
      throw new Error(result.error);
    }
  };

  return (
    <>
      {targetCompanies.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[150px]">Target Company</TableHead>
              <TableHead className="w-[130px]">Category</TableHead>
              <TableHead className="w-[130px]">Title</TableHead>
              <TableHead className="w-[130px]">Contact</TableHead>
              <TableHead className="w-[70px]">Why</TableHead>
              <TableHead className="w-[100px]">Interested</TableHead>
              <TableHead className="w-[120px]">Last Activity</TableHead>
              <TableHead className="w-[20]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {targetCompanies.map((target) => {
              const targetCompany = target.target_company;
              const category = target.category;
              const contact = target.contact;

              return (
                <TableRow key={target.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <TargetCompanyLogo
                        name={targetCompany?.name || "Unknown"}
                        logoUrl={targetCompany?.logo_url}
                        website={targetCompany?.website}
                      />
                      <span className="font-medium">
                        {targetCompany?.name || "Unknown"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {category?.name || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm text-muted-foreground">
                      {contact?.title || " - "}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="truncate text-sm text-muted-foreground">
                      {contact?.name ||
                        `${contact?.first_name} ${contact?.last_name}`}{" "}
                      ({contact.email})
                    </p>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleWhyClick(target)}
                    >
                      Why
                    </Button>
                  </TableCell>
                  <TableCell>
                    {target.selected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        ✓ Selected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Passed
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="text-xs text-muted-foreground"
                      title={new Date(target.updated_at).toLocaleString()}
                    >
                      {new Date(target.updated_at).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditingId(target.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => setDeletingId(target.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <EditTargetCompanyForm
                      targetId={target.id}
                      clientCompanyId={clientCompanyId}
                      targetCompanyName={targetCompany?.name || "Unknown"}
                      categories={categories}
                      initialData={{
                        relationship_category: category?.id || "",
                        why: target.why,
                        note: target.note,
                      }}
                      open={editingId === target.id}
                      onOpenChange={(open) => !open && setEditingId(null)}
                    />
                    <RemoveTargetCompanyButton
                      targetId={target.id}
                      clientCompanyId={clientCompanyId}
                      targetCompanyName={targetCompany?.name || "Unknown"}
                      open={deletingId === target.id}
                      onOpenChange={(open) => !open && setDeletingId(null)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="py-8 text-center text-muted-foreground">
          No target companies found for {clientCompanyName}.
        </div>
      )}

      <WhyNoteDialog
        company={activeTarget?.company ?? null}
        onClose={() => setActiveTarget(null)}
        onSave={handleSaveWhy}
      />
    </>
  );
}
