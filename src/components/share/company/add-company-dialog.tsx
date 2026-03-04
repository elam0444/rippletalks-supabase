"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Company } from "@/types/share";

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
  onAddCompany: (company: Company) => void;
  trigger?: React.ReactNode;
}

/**
 * Dialog for adding a custom company (not in database)
 */
export function AddCompanyDialog({
  open,
  onOpenChange,
  token,
  onAddCompany,
  trigger,
}: AddCompanyDialogProps) {
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      setError(null);
      setName("");
      setWebsiteUrl("");
    }
  };

  const handleAddCompany = async () => {
    if (!token || !name.trim()) return;
    setError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/share/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          website_url: websiteUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.company) {
        const newCompany: Company = {
          id: data.company.id,
          name: data.company.name,
          website_url: data.company.website_url,
          selected: true,
        };
        onAddCompany(newCompany);
        setName("");
        setWebsiteUrl("");
        onOpenChange(false);
      } else {
        setError(data.error || "Failed to add company");
      }
    } catch (err) {
      console.error("Error adding custom company:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Add a company</DialogTitle>
          <p className="text-sm text-gray-500 font-normal">
            Add a company that isn&apos;t in our database. Enter the name and
            optional website URL.
          </p>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-gray-700">
              Company name
            </label>
            <Input
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              disabled={adding}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Website URL (optional)
            </label>
            <Input
              placeholder="e.g. https://acmecorp.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-1"
              disabled={adding}
              type="url"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={adding}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddCompany}
              disabled={adding || !name.trim()}
            >
              {adding ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {adding ? "Adding…" : "Add company"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
