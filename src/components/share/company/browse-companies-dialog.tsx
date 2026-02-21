"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Building2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BrowseCompany } from "@/types/share";

interface BrowseCompaniesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token?: string;
  onAddCompany: (companyId: string) => Promise<void>;
  trigger?: React.ReactNode;
}

/**
 * Dialog for browsing and adding companies from the database
 */
export function BrowseCompaniesDialog({
  open,
  onOpenChange,
  token,
  onAddCompany,
  trigger,
}: BrowseCompaniesDialogProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<BrowseCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  const fetchCompanies = async (searchTerm: string) => {
    if (!token) {
      console.error("BrowseCompaniesDialog: No token provided");
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ token });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      console.log("Fetching companies with params:", params.toString());
      const res = await fetch(`/api/share/companies?${params}`);
      const data = await res.json();
      console.log("Browse companies response:", { ok: res.ok, data });
      if (res.ok) {
        setResults(data.companies || []);
      } else {
        console.error("Error fetching companies:", data.error);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch companies when dialog opens
  useEffect(() => {
    console.log("BrowseCompaniesDialog: open changed to:", open, "token:", token);
    if (open && token) {
      setSearch("");
      fetchCompanies("");
    }
  }, [open, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (isOpen: boolean) => {
    console.log("BrowseCompaniesDialog: handleOpenChange called with isOpen:", isOpen);
    onOpenChange(isOpen);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    fetchCompanies(value);
  };

  const handleAddCompany = async (companyId: string) => {
    setAddingId(companyId);
    try {
      await onAddCompany(companyId);
      // Remove from results after successful add
      setResults((prev) => prev.filter((c) => c.id !== companyId));
    } catch (error) {
      console.error("Error adding company:", error);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[95vw] sm:max-w-[600px] max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle>Browse Companies</DialogTitle>
          <p className="text-sm text-gray-500 font-normal">
            Search and add companies already in our database.
          </p>
        </DialogHeader>
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : results.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No companies found.
                </p>
              ) : (
                results.map((company) => (
                  <div
                    key={company.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100">
                        <Building2 className="h-4 w-4 text-gray-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {company.name}
                        </p>
                        {company.description && (
                          <p className="text-sm text-gray-500 truncate">
                            {company.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddCompany(company.id)}
                      disabled={addingId === company.id}
                      className="shrink-0 ml-2"
                    >
                      {addingId === company.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
