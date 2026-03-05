"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, X, FileText, Lightbulb, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/types/share";

interface WhyNotePopupProps {
  company: Company | null;
  onClose: () => void;
  onSave: (why: string, note: string) => Promise<void>;
}

export function WhyNotePopup({ company, onClose, onSave }: WhyNotePopupProps) {
  const [whyText, setWhyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const whyRef = useRef<HTMLTextAreaElement>(null);

  const isOpen = !!company;

  useEffect(() => {
    if (company) {
      setWhyText(company.why ?? "");
      setNoteText(company.note ?? "");
      setTimeout(() => setVisible(true), 10);
      setTimeout(() => whyRef.current?.focus(), 200);
    } else {
      setVisible(false);
    }
  }, [company]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(whyText, noteText);
      handleClose();
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") handleClose();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSave();
  };

  const whyWordCount = whyText.trim() ? whyText.trim().split(/\s+/).length : 0;
  const noteWordCount = noteText.trim() ? noteText.trim().split(/\s+/).length : 0;

  // Fully unmount when closed — nothing in the DOM blocking clicks
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Modal — pointer-events live on this element, not a always-present wrapper */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
          visible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`relative w-full max-w-lg bg-white rounded-xl shadow-2xl flex flex-col transition-all duration-200 ${
            visible ? "scale-100 translate-y-0" : "scale-95 translate-y-2"
          }`}
          style={{ maxHeight: "90vh" }}
          onKeyDown={handleKeyDown}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 shrink-0">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Target Company
                </p>
                <h2 className="text-base font-semibold text-gray-900 truncate leading-tight">
                  {company?.name}
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0 ml-3"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {company?.description && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-600 leading-relaxed">{company.description}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <Lightbulb className="h-3.5 w-3.5 text-gray-400" />
                  Why
                </label>
                {whyWordCount > 0 && (
                  <span className="text-xs text-gray-300 tabular-nums">{whyWordCount}w</span>
                )}
              </div>
              <Textarea
                ref={whyRef}
                placeholder="Why this company?"
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                className="min-h-[112px] resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  Note
                </label>
                {noteWordCount > 0 && (
                  <span className="text-xs text-gray-300 tabular-nums">{noteWordCount}w</span>
                )}
              </div>
              <Textarea
                placeholder="Optional note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50/50 rounded-b-xl">
            <p className="text-xs text-gray-300 select-none">⌘↵ to save</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}