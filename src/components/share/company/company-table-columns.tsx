"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Trash2, X } from "lucide-react";
import { getLogoDevUrl } from "@/lib/utils/logo-utils";
import { Button } from "@/components/ui/button";
import { CompanyCheckbox } from "./company-checkbox";
import { CategoryBadge } from "@/components/ui/category-badge";
import { truncateText } from "@/lib/utils/text-utils";
import type { Company } from "@/types/share";

function CompanyLogo({
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
        width={24}
        height={24}
        className="h-6 w-6 rounded object-cover shrink-0"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="flex h-6 w-6 items-center justify-center rounded bg-muted shrink-0">
      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}

interface UseCompanyColumnsOptions {
  selected: Record<string, boolean>;
  allSelected: boolean;
  onToggleCompany: (id: string) => void;
  onToggleAll: () => void;
  onEditWhy: (company: Company, anchor: HTMLElement) => void;
  onCloseWhy: () => void;
  onDelete: (company: Company) => void;
  isGuestView?: boolean;
}

/**
 * Hook that returns table column definitions for the company table
 */
export function useCompanyColumns({
  selected,
  allSelected,
  onToggleCompany,
  onToggleAll,
  onEditWhy,
  onCloseWhy,
  onDelete,
  isGuestView = false,
}: UseCompanyColumnsOptions): ColumnDef<Company, unknown>[] {
  return useMemo<ColumnDef<Company, unknown>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <CompanyCheckbox
            checked={allSelected}
            onToggle={onToggleAll}
            ariaLabel={allSelected ? "Deselect all" : "Select all"}
            variant="header"
          />
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <CompanyCheckbox
              checked={selected[row.original.id]}
              onToggle={() => onToggleCompany(row.original.id)}
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        id: "name",
        accessorKey: "name",
        header: "Company",
        cell: ({ row }) => (
          <div
            className="flex items-center gap-2 min-w-0 cursor-pointer"
            onMouseEnter={(e) => onEditWhy(row.original, e.currentTarget)}
            onMouseLeave={() => onCloseWhy()}
          >
            <CompanyLogo
              name={row.original.name}
              logoUrl={row.original.logo_url}
              website={row.original.website}
            />
            <span className="font-medium text-foreground wrap-break-word min-w-0">
              {row.original.name}
            </span>
          </div>
        ),
        meta: {
          cellClassName:
            "whitespace-normal min-w-0 max-w-[180px] sm:max-w-none",
        },
        enableSorting: true,
      },
      ...(!isGuestView ? [{
        id: "tile",
        accessorKey: "title",
        header: "Title",
        cell: "CEO",
        meta: {
          cellClassName:
            "whitespace-normal min-w-50 max-w-[180px] sm:max-w-none",
        },
        enableSorting: true,
      } as ColumnDef<Company, unknown>] : []),
      /*{
        id: "description",
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.original.description || "—";
          const shortDescription =
            description === "—" ? description : truncateText(description, 60);
          return (
            <span
              className="text-muted-foreground min-w-0 block max-w-[200px] truncate"
              title={description !== "—" ? description : undefined}
            >
              {shortDescription}
            </span>
          );
        },
        meta: {
          cellClassName: "min-w-0 max-w-[220px]",
        },
        enableSorting: true,
      },*/
      ...(!isGuestView ? [{
        id: "category",
        accessorKey: "relationship_category",
        header: "Category",
        cell: ({ row }: { row: { original: Company } }) => {
          const category = row.original.relationship_category;
          return <CategoryBadge category={category || ""} />;
        },
        enableSorting: true,
      } as ColumnDef<Company, unknown>] : []),
      /*{
        id: "why",
        header: "Why",
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditWhy(row.original)}
          >
            Why
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      },*/
      ...(!isGuestView ? [{
        id: "actions",
        header: "Actions",
        cell: ({ row }: { row: { original: Company } }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(row.original)}
            aria-label="Remove company"
          >
            <X size={16} />
          </Button>
        ),
        enableSorting: false,
        enableHiding: false,
      } as ColumnDef<Company, unknown>] : [])
    ],
    [selected, allSelected, onToggleCompany, onToggleAll, onEditWhy, onDelete, isGuestView],
  );
}
