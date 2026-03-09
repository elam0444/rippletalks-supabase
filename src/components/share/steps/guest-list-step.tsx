"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Link,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { saveGuests } from "@/lib/actions/save-guests";

interface Guest {
  first: string;
  last: string;
  title: string;
  company: string;
  linkedin: string;
  email: string;
}

const emptyGuest = (): Guest => ({
  first: "",
  last: "",
  title: "",
  company: "",
  linkedin: "",
  email: "",
});

interface GuestListStepProps {
  onBack: () => void;
  onNext: () => void;
  addedByProfileId?: string;
  clientCompanyId?: string;
}

export function GuestListStep({
  onBack,
  onNext,
  addedByProfileId,
  clientCompanyId,
}: GuestListStepProps) {
  const [mode, setMode] = useState<"manual" | "sheet">("manual");
  const [sheetUrl, setSheetUrl] = useState("");
  const [guests, setGuests] = useState<Guest[]>([emptyGuest()]);
  const [saving, setSaving] = useState(false);

  const addGuest = () => {
    if (guests.length >= 10) return;
    setGuests((prev) => [...prev, emptyGuest()]);
  };

  const removeGuest = (i: number) => {
    setGuests((prev) => prev.filter((_, idx) => idx !== i));
  };

  const updateGuest = (i: number, field: keyof Guest, value: string) => {
    setGuests((prev) =>
      prev.map((g, idx) => (idx === i ? { ...g, [field]: value } : g)),
    );
  };

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!addedByProfileId) return;
    setSaving(true);
    setSaved(false);
    try {
      await saveGuests(guests, addedByProfileId, clientCompanyId);
      setSaved(true);
    } catch (err) {
      console.error("Error saving guests:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-gray-900">
            Step 3: Add your guest list
          </CardTitle>
          <CardDescription className="text-base text-gray-900">
            Add up to 10 guests you would like to invite to attend this
            invite-only fireside chat. Include their first name, last name,
            title, company, LinkedIn URL, and email address — or paste a link to
            your Google Sheet.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Mode toggle */}
          <div className="flex gap-2 hidden">
            <Button
              variant={mode === "manual" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("manual")}
            >
              Enter manually
            </Button>
            <Button
              variant={mode === "sheet" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("sheet")}
            >
              <Link className="h-4 w-4 mr-2" />
              Google Sheet URL
            </Button>
          </div>

          {/* Google Sheet mode */}
          {mode === "sheet" && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Paste the public URL to your Google Sheet. Make sure it has
                columns: First, Last, Title, Company, LinkedIn, Email.
              </p>
              <Input
                placeholder="https://docs.google.com/spreadsheets/d/..."
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
            </div>
          )}

          {/* Manual entry mode */}
          {mode === "manual" && (
            <div className="space-y-3">
              {guests.map((guest, i) => (
                <div
                  key={i}
                  className="relative grid grid-cols-2 sm:grid-cols-3 gap-2 p-4 pt-8 border rounded-lg bg-gray-50"
                >
                  <span className="absolute top-3 left-4 text-xs font-medium text-gray-400">
                    Guest {i + 1}
                  </span>
                  {guests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeGuest(i)}
                      className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {(
                    [
                      ["first", "First name"],
                      ["last", "Last name"],
                      ["title", "Title"],
                      ["company", "Company"],
                      ["linkedin", "LinkedIn URL"],
                      ["email", "Email address"],
                    ] as [keyof Guest, string][]
                  ).map(([field, placeholder]) => (
                    <Input
                      key={field}
                      placeholder={placeholder}
                      value={guest[field]}
                      onChange={(e) => updateGuest(i, field, e.target.value)}
                      className="bg-white text-sm h-9"
                    />
                  ))}
                </div>
              ))}

              {guests.length < 10 && (
                <Button variant="outline" size="sm" onClick={addGuest}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add guest ({guests.length}/10)
                </Button>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            {saved && (
              <span className="text-sm text-green-600 font-medium">Saved!</span>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !addedByProfileId}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
