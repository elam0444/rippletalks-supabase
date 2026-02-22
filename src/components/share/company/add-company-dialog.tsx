"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Company, Industry } from "@/types/share";

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
  const [description, setDescription] = useState("");
  const [industryId, setIndustryId] = useState<string>("");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIndustries = async () => {
    if (!token) return;
    setIndustriesLoading(true);
    try {
      const res = await fetch(
        `/api/share/industries?token=${encodeURIComponent(token)}`
      );
      const data = await res.json();
      if (res.ok) setIndustries(data.industries || []);
    } catch (err) {
      console.error("Error fetching industries:", err);
    } finally {
      setIndustriesLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (isOpen) {
      setError(null);
      setName("");
      setDescription("");
      setIndustryId("");
      fetchIndustries();
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
          description: description.trim() || undefined,
          industry_id:
            industryId && industryId !== "__none__" ? industryId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.company) {
        const newCompany: Company = {
          id: data.company.id,
          name: data.company.name,
          description: data.company.description,
          selected: true,
        };
        onAddCompany(newCompany);
        setName("");
        setDescription("");
        setIndustryId("");
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
            optional description.
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
              Industry (optional)
            </label>
            <Select
              value={industryId || "__none__"}
              onValueChange={setIndustryId}
              disabled={adding || industriesLoading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue
                  placeholder={
                    industriesLoading ? "Loading…" : "Select an industry"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {industries.map((industry) => (
                  <SelectItem key={industry.id} value={industry.id}>
                    {industry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">
              Description (optional)
            </label>
            <Input
              placeholder="Brief description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              disabled={adding}
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
