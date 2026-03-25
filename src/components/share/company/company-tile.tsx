"use client";

import { useState } from "react";
import Image from "next/image";
import { Building2, Check, Trash2 } from "lucide-react";
import { getLogoDevUrl } from "@/lib/utils/logo-utils";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/share";

interface CompanyTileProps {
  company: Company;
  isSelected: boolean;
  isWhyOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEditWhy: (e: React.MouseEvent<HTMLElement>) => void;
  onCloseWhy: () => void;
}

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
        width={32}
        height={32}
        className="h-8 w-8 rounded object-cover shrink-0"
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded bg-muted shrink-0">
      <Building2 className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

/**
 * Tile view display for a single company
 */
export function CompanyTile({
  company,
  isSelected,
  isWhyOpen,
  onToggle,
  onDelete,
  onEditWhy,
  onCloseWhy,
}: CompanyTileProps) {
  return (
    <div className="relative flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white">
      <Button
        variant="outline"
        size="icon"
        className="absolute top-2 right-2"
        onClick={onDelete}
        aria-label="Remove company"
      >
        <Trash2 size={16} />
      </Button>
      <div className="flex items-start space-x-4">
        <button
          onClick={onToggle}
          className={`w-5 h-5 rounded-sm border flex items-center justify-center mt-1 ${
            isSelected
              ? "bg-green-500 border-green-500 text-white"
              : "bg-white border-gray-300 text-gray-400"
          }`}
          aria-label={isSelected ? "Deselect company" : "Select company"}
        >
          {isSelected && <Check size={12} />}
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <CompanyLogo
            name={company.name}
            logoUrl={company.logo_url}
            website={company.website}
          />
          <p className="font-semibold text-gray-800">{company.name}</p>
          {company.description && (
            <p className="mt-1 text-sm text-gray-500">{company.description}</p>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        className="mt-4 w-full"
        onClick={(e) => (isWhyOpen ? onCloseWhy() : onEditWhy(e))}
      >
        Why
      </Button>
    </div>
  );
}
