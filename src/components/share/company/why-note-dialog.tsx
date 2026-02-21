"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Company } from "@/types/share";

interface WhyNoteDialogProps {
  company: Company | null;
  onClose: () => void;
  onSave: (why: string, note: string) => Promise<void>;
}

/**
 * Dialog for editing "Why" and "Note" fields for a company
 */
export function WhyNoteDialog({ company, onClose, onSave }: WhyNoteDialogProps) {
  const [whyText, setWhyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [saving, setSaving] = useState(false);

  // Update state when company changes
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

  return (
    <Dialog open={!!company} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Why — {company?.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-gray-700">Why</label>
            <Textarea
              placeholder="Why this company?"
              value={whyText}
              onChange={(e) => setWhyText(e.target.value)}
              className="mt-1 min-h-20"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Note</label>
            <Textarea
              placeholder="Optional note"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="mt-1 min-h-[60px]"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
