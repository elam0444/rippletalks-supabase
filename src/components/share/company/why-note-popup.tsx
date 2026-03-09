"use client";

import { createPortal } from "react-dom";
import { CompanyLogoImage } from "@/components/dashboard/company-logo-image";
import type { Company } from "@/types/share";

interface WhyNotePopupProps {
  active: { company: Company; anchor: HTMLElement } | null;
  onClose: () => void;
  onSave: (why: string, note: string) => Promise<void>;
}

export function WhyNotePopup({ active }: WhyNotePopupProps) {
  if (!active?.anchor || !active.company) return null;

  const { company } = active;
  const rect = active.anchor.getBoundingClientRect();
  const top = rect.top + window.scrollY - 8;
  const left = rect.left + window.scrollX;
  const text = [company.description, company.why].filter(Boolean).join("\n\n");

  return createPortal(
    <div
      className="absolute z-[9999] w-72 bg-white rounded-xl shadow-xl border border-gray-200 pointer-events-none"
      style={{ top, left, transform: "translateY(-100%)" }}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-3 border-b">
        <CompanyLogoImage
          name={company.name}
          logoUrl={company.logo_url}
          website={company.website}
          size={24}
          className="rounded-md object-cover"
          fallbackClassName="rounded-md"
        />
        <span className="text-sm font-semibold text-gray-900 truncate">
          {company.name}
        </span>
      </div>

      <div className="px-3.5 py-3">
        {text ? (
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{text}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">No notes yet.</p>
        )}
      </div>
    </div>,
    document.body,
  );
}