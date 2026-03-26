"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { CompanyLogoImage } from "@/components/dashboard/company-logo-image";
import type { Company } from "@/types/share";

interface WhyNotePopupProps {
  active: { company: Company; anchor: HTMLElement } | null;
  onClose: () => void;
  onSave: (why: string, note: string) => Promise<void>;
}

export function WhyNotePopup({ active, onClose }: WhyNotePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        !active.anchor.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [active, onClose]);

  if (!active?.anchor || !active.company) return null;

  const { company } = active;
  const rect = active.anchor.getBoundingClientRect();
  const top = rect.top + window.scrollY - 8;
  const left = rect.left + window.scrollX;
  return createPortal(
    <div
      ref={popupRef}
      className='absolute z-9999 w-72 bg-white rounded-xl shadow-xl border border-gray-200'
      style={{ top, left, transform: "translateY(-100%)" }}
    >
      <div className='flex items-center gap-2.5 px-3.5 py-3 border-b'>
        <CompanyLogoImage
          name={company.name}
          logoUrl={company.logo_url}
          website={company.website}
          size={24}
          className='rounded-md object-cover'
          fallbackClassName='rounded-md'
        />
        <span className='text-sm font-semibold text-gray-900 truncate flex-1'>
          {company.name}
        </span>
        <button
          onClick={onClose}
          className='text-gray-400 hover:text-gray-600 transition-colors shrink-0'
          aria-label='Close'
        >
          <X size={14} />
        </button>
      </div>

      <div className='px-3.5 py-3 space-y-2'>
        {company.description && (
          <p className='text-sm text-gray-600 whitespace-pre-wrap'>
            {company.description}
          </p>
        )}
        {company.why && (
          <div>
            <p className='text-sm font-bold text-gray-900 mb-0.5'>
              Why suggested
            </p>
            <p className='text-sm text-gray-600 whitespace-pre-wrap'>
              {company.why}
            </p>
          </div>
        )}
        {!company.description && !company.why && (
          <p className='text-sm text-gray-400 italic'>No notes yet.</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
