"use client";

import { Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Company } from "@/types/share";

interface CompanyTileProps {
  company: Company;
  isSelected: boolean;
  onToggle: () => void;
  onDelete: () => void;
  onEditWhy: () => void;
}

/**
 * Tile view display for a single company
 */
export function CompanyTile({
  company,
  isSelected,
  onToggle,
  onDelete,
  onEditWhy,
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
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{company.name}</p>
          {company.description && (
            <p className="mt-1 text-sm text-gray-500">{company.description}</p>
          )}
        </div>
      </div>
      <Button variant="outline" className="mt-4 w-full" onClick={onEditWhy}>
        Why
      </Button>
    </div>
  );
}
