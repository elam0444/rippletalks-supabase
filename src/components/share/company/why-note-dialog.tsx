"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/types/share";

interface WhyNoteDialogProps {
  company: Company | null;
  onClose: () => void;
  onSave: (why: string, note: string) => Promise<void>;
}

export function WhyNoteDialog({
  company,
  onClose,
  onSave,
}: WhyNoteDialogProps) {
  const [whyText, setWhyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setWhyText(company.why ?? "");
      setNoteText(company.note ?? "");
    }
  }, [company]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(whyText, noteText);
      onClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const isOpen = !!company;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Slide panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-semibold text-gray-900">
            Why — {company?.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700">Why</label>
            <Textarea
              placeholder="Why this company?"
              value={whyText}
              onChange={(e) => setWhyText(e.target.value)}
              className="mt-1 min-h-28"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Note</label>
            <Textarea
              placeholder="Optional note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="mt-1 min-h-[72px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
