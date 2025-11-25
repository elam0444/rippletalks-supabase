"use client";

import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import Image from "next/image";
import { Building2, Globe, ChevronRight } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Company = {
  id: any;
  name: any;
  website: any;
  logo_url: any;
  description: any;
  industries: any;
};

// Function to generate consistent color for each industry
const getIndustryColor = (industryName: string) => {
  const colors = [
    "bg-blue-100 text-blue-700 hover:bg-blue-100",
    "bg-green-100 text-green-700 hover:bg-green-100",
    "bg-purple-100 text-purple-700 hover:bg-purple-100",
    "bg-orange-100 text-orange-700 hover:bg-orange-100",
    "bg-pink-100 text-pink-700 hover:bg-pink-100",
    "bg-cyan-100 text-cyan-700 hover:bg-cyan-100",
    "bg-amber-100 text-amber-700 hover:bg-amber-100",
    "bg-indigo-100 text-indigo-700 hover:bg-indigo-100",
  ];

  // Generate a consistent hash from the industry name
  const hash = industryName.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  return colors[Math.abs(hash) % colors.length];
};

const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: "Company",
    cell: ({ row }) => {
      const company = row.original;
      return (
        <Link
          href={`/dashboard/companies/${company.id}`}
          className="flex items-center gap-3 font-medium hover:text-primary min-w-0"
        >
          {company.logo_url ? (
            <Image
              src={company.logo_url}
              alt={company.name}
              width={32}
              height={32}
              className="h-8 w-8 rounded object-cover shrink-0"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <span className="truncate">{company.name}</span>
        </Link>
      );
    },
    enableHiding: false,
  },
  {
    id: "industry",
    header: "Industry",
    accessorFn: (row) => row.industries?.name || "—",
    cell: ({ row }) => {
      const company = row.original;
      if (!company.industries?.name) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <Badge className={cn("truncate", getIndustryColor(company.industries.name))}>
          {company.industries.name}
        </Badge>
      );
    },
    size: 150,
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const company = row.original;
      if (!company.description) {
        return <span className="text-muted-foreground">—</span>;
      }
      const maxLength = 60;
      const truncated = company.description.length > maxLength
        ? `${company.description.slice(0, maxLength)}...`
        : company.description;
      return (
        <p className="text-sm text-muted-foreground">
          {truncated}
        </p>
      );
    },
    size: 300,
  },
  {
    accessorKey: "website",
    header: "Website",
    cell: ({ row }) => {
      const company = row.original;
      if (!company.website) {
        return <span className="text-muted-foreground">—</span>;
      }
      return (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary truncate"
        >
          <Globe className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
          </span>
        </a>
      );
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const company = row.original;
      return (
        <Link href={`/dashboard/companies/${company.id}`}>
          <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
];

interface CompaniesTableProps {
  companies: Company[];
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
  return (
    <DataTable
      columns={columns}
      data={companies}
      searchColumn="name"
      searchPlaceholder="Search companies..."
      defaultPageSize={10}
      pageSizeOptions={[5, 10, 25, 50]}
    />
  );
}
