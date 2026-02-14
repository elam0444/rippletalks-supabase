"use client";

import { useState, useMemo } from "react";
import {
  Check,
  Trash2,
  Building2,
  Users,
  Mail,
  Phone,
  Globe,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

interface Company {
  id: string;
  name: string;
  description?: string;
  why?: string;
  note?: string;
  selected?: boolean;
  relationship_category?: string;
}

interface Contact {
  id: string;
  name: string;
  email?: string;
  title?: string;
  phone?: string;
  avatar_url?: string;
}

interface SharedCompany {
  id: string;
  name: string;
  logo_url?: string;
  website?: string;
  description?: string;
}

interface Props {
  companies: Company[];
  clientCompanyId?: string;
  sharedContact?: Contact | null;
  sharedCompany?: SharedCompany | null;
  contactDates?: { available_date: string; is_selected: boolean }[];
  token?: string;
}

export function ShareClient({
  companies = [],
  clientCompanyId,
  sharedContact,
  sharedCompany,
  contactDates: initialDates = [],
  token,
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // --- Step 1: Contact Dates ---
  const [dates, setDates] = useState(initialDates);
  const toggleDate = (date: string) => {
    setDates((prev) =>
      prev.map((d) =>
        d.available_date === date ? { ...d, is_selected: !d.is_selected } : d
      )
    );
  };

  // --- Step 2: Companies ---
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.id, c.selected ?? true]))
  );
  const [companiesList, setCompaniesList] = useState(companies);
  const allSelected = companiesList.every((c) => selected[c.id]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [whyText, setWhyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingWhy, setSavingWhy] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"tiles" | "table">("table");

  // --- Browse Companies (from DB) ---
  const [browseOpen, setBrowseOpen] = useState(false);
  const [browseSearch, setBrowseSearch] = useState("");
  const [browseResults, setBrowseResults] = useState<
    { id: string; name: string; description?: string }[]
  >([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  // --- Add Company (not in DB / custom) ---
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyDescription, setNewCompanyDescription] = useState("");
  const [newCompanyIndustryId, setNewCompanyIndustryId] = useState<string>("");
  const [industries, setIndustries] = useState<{ id: string; name: string }[]>(
    []
  );
  const [industriesLoading, setIndustriesLoading] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [addCompanyError, setAddCompanyError] = useState<string | null>(null);

  const fetchBrowseCompanies = async (search: string) => {
    if (!token) return;
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams({ token });
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/share/companies?${params}`);
      const data = await res.json();
      if (res.ok) {
        setBrowseResults(data.companies || []);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleBrowseOpen = (open: boolean) => {
    setBrowseOpen(open);
    if (open) {
      setBrowseSearch("");
      fetchBrowseCompanies("");
    }
  };

  const handleBrowseSearch = (value: string) => {
    setBrowseSearch(value);
    fetchBrowseCompanies(value);
  };

  const handleAddCompany = async (companyId: string) => {
    if (!token) return;
    setAddingId(companyId);
    try {
      const res = await fetch("/api/share/add-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, targetCompanyId: companyId }),
      });
      const data = await res.json();
      if (res.ok && data.company) {
        const newCompany: Company = {
          id: data.company.id,
          name: data.company.name,
          description: data.company.description,
          selected: true,
        };
        setCompaniesList((prev) => [...prev, newCompany]);
        setSelected((prev) => ({ ...prev, [data.company.id]: true }));
        // Remove from browse results
        setBrowseResults((prev) => prev.filter((c) => c.id !== companyId));
      }
    } catch (err) {
      console.error("Error adding company:", err);
    } finally {
      setAddingId(null);
    }
  };

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

  const handleAddCompanyDialogOpen = (open: boolean) => {
    setAddCompanyOpen(open);
    if (open) {
      setAddCompanyError(null);
      setNewCompanyName("");
      setNewCompanyDescription("");
      setNewCompanyIndustryId("");
      fetchIndustries();
    }
  };

  const handleAddCustomCompany = async () => {
    if (!token || !newCompanyName.trim()) return;
    setAddCompanyError(null);
    setAddingCustom(true);
    try {
      const res = await fetch("/api/share/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: newCompanyName.trim(),
          description: newCompanyDescription.trim() || undefined,
          industry_id:
            newCompanyIndustryId && newCompanyIndustryId !== "__none__"
              ? newCompanyIndustryId
              : undefined,
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
        setCompaniesList((prev) => [...prev, newCompany]);
        setSelected((prev) => ({ ...prev, [data.company.id]: true }));
        setNewCompanyName("");
        setNewCompanyDescription("");
        setNewCompanyIndustryId("");
        setAddCompanyOpen(false);
      } else {
        setAddCompanyError(data.error || "Failed to add company");
      }
    } catch (err) {
      console.error("Error adding custom company:", err);
      setAddCompanyError("Something went wrong. Please try again.");
    } finally {
      setAddingCustom(false);
    }
  };

  const groupedCompanies = useMemo(() => {
    const groups: Record<string, Company[]> = {};
    companiesList.forEach((c) => {
      const cat = c.relationship_category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [companiesList]);

  const toggleCompany = (id: string) => {
    const newValue = !selected[id];
    setSelected((prev) => ({ ...prev, [id]: newValue }));
    updateSelectedInDB(id, newValue);
  };

  const toggleAll = () => {
    const newValue = !allSelected;
    const newSelected: Record<string, boolean> = {};
    companiesList.forEach((c) => {
      newSelected[c.id] = newValue;
      updateSelectedInDB(c.id, newValue);
    });
    setSelected(newSelected);
  };

  const updateSelectedInDB = async (companyId: string, value: boolean) => {
    try {
      const res = token
        ? await fetch("/api/share/update-target", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              targetCompanyId: companyId,
              selected: value,
            }),
          })
        : await fetch("/api/target-company/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientCompanyId,
              companyId,
              selected: value,
            }),
          });
      const data = await res.json();
      if (!res.ok) console.error("API error:", data.error);
    } catch (err) {
      console.error("Unexpected API error:", err);
    }
  };

  const deleteCompanyInDB = async (companyId: string) => {
    setDeleting(true);
    try {
      const res = token
        ? await fetch("/api/share/delete-target", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, targetCompanyId: companyId }),
          })
        : await fetch("/api/target-company/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientCompanyId, companyId }),
          });
      const data = await res.json();
      if (!res.ok) console.error("API error:", data.error);
      else {
        setCompaniesList((prev) => prev.filter((c) => c.id !== companyId));
        setCompanyToDelete(null);
      }
    } catch (err) {
      console.error("Unexpected API error:", err);
    } finally {
      setDeleting(false);
    }
  };

  const saveWhyAndNote = async () => {
    if (!activeCompany) return;
    setSavingWhy(true);
    try {
      const res = token
        ? await fetch("/api/share/update-target", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              targetCompanyId: activeCompany.id,
              why: whyText,
              note: noteText,
            }),
          })
        : await fetch("/api/target-company/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientCompanyId,
              companyId: activeCompany.id,
              why: whyText,
              note: noteText,
            }),
          });
      const data = await res.json();
      if (res.ok) {
        setCompaniesList((prev) =>
          prev.map((c) =>
            c.id === activeCompany.id
              ? { ...c, why: whyText, note: noteText }
              : c
          )
        );
        setActiveCompany(null);
      } else {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Unexpected API error:", err);
    } finally {
      setSavingWhy(false);
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* Shared Contact Info */}
      {sharedContact && sharedCompany && (
        <div className='bg-white border rounded-lg p-6 shadow-sm'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4'>
            Shared Contact
          </h2>
          <div className='flex items-start gap-6'>
            {/* Contact Info */}
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-3'>
                {sharedContact.avatar_url ? (
                  <Image
                    src={sharedContact.avatar_url}
                    alt={sharedContact.name}
                    width={48}
                    height={48}
                    className='h-12 w-12 rounded-full object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gray-100'>
                    <Users className='h-6 w-6 text-gray-400' />
                  </div>
                )}
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    {sharedContact.name}
                  </h3>
                  {sharedContact.title && (
                    <p className='text-sm text-gray-600'>
                      {sharedContact.title}
                    </p>
                  )}
                </div>
              </div>
              <div className='space-y-2 ml-15'>
                {sharedContact.email && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='h-4 w-4 text-gray-400' />
                    <a
                      href={`mailto:${sharedContact.email}`}
                      className='text-blue-600 hover:underline'
                    >
                      {sharedContact.email}
                    </a>
                  </div>
                )}
                {sharedContact.phone && (
                  <div className='flex items-center gap-2 text-sm'>
                    <Phone className='h-4 w-4 text-gray-400' />
                    <span className='text-gray-700'>{sharedContact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className='flex-1 border-l pl-6'>
              <div className='flex items-center gap-3 mb-3'>
                {sharedCompany.logo_url ? (
                  <Image
                    src={sharedCompany.logo_url}
                    alt={sharedCompany.name}
                    width={48}
                    height={48}
                    className='h-12 w-12 rounded object-cover'
                  />
                ) : (
                  <div className='flex h-12 w-12 items-center justify-center rounded bg-gray-100'>
                    <Building2 className='h-6 w-6 text-gray-400' />
                  </div>
                )}
                <div>
                  <h3 className='text-xl font-bold text-gray-900'>
                    {sharedCompany.name}
                  </h3>
                  {sharedCompany.website && (
                    <a
                      href={sharedCompany.website}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-sm text-blue-600 hover:underline flex items-center gap-1'
                    >
                      <Globe className='h-3 w-3' />
                      Website
                    </a>
                  )}
                </div>
              </div>
              {sharedCompany.description && (
                <p className='text-sm text-gray-600 ml-15'>
                  {sharedCompany.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Step 1: Onboarding Style Dates --- */}
      {step === 1 && (
        <motion.div
          className='bg-white border rounded-lg p-6 shadow-sm space-y-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2 className='text-2xl font-bold text-gray-900'>
            Step 1: Select Dates to Attend RippleTalk
          </h2>
          <p className='text-gray-600'>
            Choose the dates you are interested in attending. You can select
            multiple.
          </p>

          {dates.length === 0 ? (
            <p className='text-gray-500'>
              No available dates for this contact.
            </p>
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'>
              {dates.map((d) => (
                <motion.label
                  key={d.available_date}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    d.is_selected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span>{new Date(d.available_date).toLocaleString()}</span>
                  <input
                    type='checkbox'
                    checked={!!d.is_selected}
                    onChange={() => toggleDate(d.available_date)}
                    className='w-5 h-5'
                  />
                </motion.label>
              ))}
            </div>
          )}

          <div className='flex justify-between items-center mt-6'>
            <div className='flex items-center gap-2'>
              <span className='w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center'>
                1
              </span>
              <span className='text-gray-600'>Select Dates</span>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={dates.every((d) => !d.is_selected)}
            >
              Next: Select Opportunities →
            </Button>
          </div>
        </motion.div>
      )}

      {/* --- Step 2: Select Companies --- */}
      <AnimatePresence mode='wait'>
        {step === 2 && (
          <motion.div
            key='step2'
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card className='space-y-0'>
              <CardHeader>
                <CardTitle className='text-2xl md:text-3xl text-gray-900'>
                  Key Stakeholder Opportunities
                </CardTitle>
                <CardDescription className='text-base text-gray-600'>
                  Uncheck companies you&apos;d rather pass on, or add new companies
                  you want to connect with.
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='flex flex-wrap gap-2'>
                  {companiesList.length > 0 && (
                  <>
                    <Button
                      variant='outline'
                      className='border-black text-black bg-white hover:bg-gray-100'
                      onClick={toggleAll}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </Button>
                    <Button
                      variant='outline'
                      className='border-black text-black bg-white hover:bg-gray-100'
                      onClick={() =>
                        setViewMode(viewMode === "tiles" ? "table" : "tiles")
                      }
                    >
                      {viewMode === "tiles" ? "Table View" : "Tile View"}
                    </Button>
                  </>
                )}
                {token && (
                  <>
                    <Dialog open={browseOpen} onOpenChange={handleBrowseOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant='outline'
                          className='border-black text-black bg-white hover:bg-gray-100'
                        >
                          <Search className='h-4 w-4 mr-2' />
                          Browse Companies
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='sm:max-w-[700px]'>
                        <DialogHeader>
                          <DialogTitle>Browse Companies</DialogTitle>
                          <p className='text-sm text-gray-500 font-normal'>
                            Search and add companies already in our database.
                          </p>
                        </DialogHeader>
                        <div className='space-y-4'>
                          <div className='relative'>
                            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                            <Input
                              placeholder='Search companies...'
                              value={browseSearch}
                              onChange={(e) =>
                                handleBrowseSearch(e.target.value)
                              }
                              className='pl-9'
                            />
                          </div>
                          <div className='max-h-[500px] overflow-y-auto space-y-2'>
                            {browseLoading ? (
                              <div className='flex items-center justify-center py-8'>
                                <Loader2 className='h-6 w-6 animate-spin text-gray-400' />
                              </div>
                            ) : browseResults.length === 0 ? (
                              <p className='text-center text-gray-500 py-8'>
                                No companies found.
                              </p>
                            ) : (
                              browseResults.map((company) => (
                                <div
                                  key={company.id}
                                  className='flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50'
                                >
                                  <div className='flex items-center gap-3 min-w-0'>
                                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-100'>
                                      <Building2 className='h-4 w-4 text-gray-400' />
                                    </div>
                                    <div className='min-w-0'>
                                      <p className='font-medium text-gray-900 truncate'>
                                        {company.name}
                                      </p>
                                      {company.description && (
                                        <p className='text-sm text-gray-500 truncate'>
                                          {company.description}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size='sm'
                                    onClick={() => handleAddCompany(company.id)}
                                    disabled={addingId === company.id}
                                    className='shrink-0 ml-2'
                                  >
                                    {addingId === company.id ? (
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                    ) : (
                                      <>
                                        <Plus className='h-4 w-4 mr-1' />
                                        Add
                                      </>
                                    )}
                                  </Button>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog
                      open={addCompanyOpen}
                      onOpenChange={handleAddCompanyDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className='h-4 w-4 mr-2' />
                          Add Company (not in list)
                        </Button>
                      </DialogTrigger>
                      <DialogContent className='sm:max-w-[440px]'>
                        <DialogHeader>
                          <DialogTitle>Add a company</DialogTitle>
                          <p className='text-sm text-gray-500 font-normal'>
                            Add a company that isn’t in our database. Enter the
                            name and optional description.
                          </p>
                        </DialogHeader>
                        <div className='space-y-4 pt-2'>
                          {addCompanyError && (
                            <p className='text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2'>
                              {addCompanyError}
                            </p>
                          )}
                          <div>
                            <label className='text-sm font-medium text-gray-700'>
                              Company name
                            </label>
                            <Input
                              placeholder='e.g. Acme Corp'
                              value={newCompanyName}
                              onChange={(e) =>
                                setNewCompanyName(e.target.value)
                              }
                              className='mt-1'
                              disabled={addingCustom}
                            />
                          </div>
                          <div>
                            <label className='text-sm font-medium text-gray-700'>
                              Industry (optional)
                            </label>
                            <Select
                              value={newCompanyIndustryId || "__none__"}
                              onValueChange={setNewCompanyIndustryId}
                              disabled={addingCustom || industriesLoading}
                            >
                              <SelectTrigger className='mt-1'>
                                <SelectValue
                                  placeholder={
                                    industriesLoading
                                      ? "Loading…"
                                      : "Select an industry"
                                  }
                                />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value='__none__'>None</SelectItem>
                                {industries.map((industry) => (
                                  <SelectItem
                                    key={industry.id}
                                    value={industry.id}
                                  >
                                    {industry.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className='text-sm font-medium text-gray-700'>
                              Description (optional)
                            </label>
                            <Input
                              placeholder='Brief description'
                              value={newCompanyDescription}
                              onChange={(e) =>
                                setNewCompanyDescription(e.target.value)
                              }
                              className='mt-1'
                              disabled={addingCustom}
                            />
                          </div>
                          <div className='flex justify-end gap-2 pt-2'>
                            <Button
                              variant='outline'
                              onClick={() => setAddCompanyOpen(false)}
                              disabled={addingCustom}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleAddCustomCompany}
                              disabled={addingCustom || !newCompanyName.trim()}
                            >
                              {addingCustom ? (
                                <Loader2 className='h-4 w-4 animate-spin mr-2' />
                              ) : (
                                <Plus className='h-4 w-4 mr-2' />
                              )}
                              {addingCustom ? "Adding…" : "Add company"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </>
                )}
              </div>

            {/* Table or Tiles View */}
            {viewMode === "table" && (
              <div className='overflow-x-auto mt-4'>
                <table className='w-full table-auto border-collapse border border-gray-200'>
                  <thead>
                    <tr className='bg-gray-100'>
                      <th className='border p-2 w-12'></th>
                      <th className='border p-2 text-left'>Company</th>
                      <th className='border p-2 text-left'>Description</th>
                      <th className='border p-2 text-left'>Category</th>
                      <th className='border p-2 text-left'>Why</th>
                      <th className='border p-2 text-left'>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companiesList.map((company) => (
                      <tr key={company.id} className='hover:bg-gray-50'>
                        <td className='border p-2 text-center'>
                          <button
                            onClick={() => toggleCompany(company.id)}
                            className={`w-5 h-5 rounded-sm border flex items-center justify-center mx-auto ${
                              selected[company.id]
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}
                          >
                            {selected[company.id] && <Check size={12} />}
                          </button>
                        </td>
                        <td className='border p-2'>{company.name}</td>
                        <td className='border p-2'>
                          {company.description || "—"}
                        </td>
                        <td className='border p-2'>
                          {company.relationship_category || "—"}
                        </td>
                        <td className='border p-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setWhyText(company.why ?? "");
                              setNoteText(company.note ?? "");
                              setActiveCompany(company);
                            }}
                          >
                            Why
                          </Button>
                        </td>
                        <td className='border p-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => setCompanyToDelete(company)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === "tiles" &&
              Object.entries(groupedCompanies).map(([category, companies]) => (
                <div key={category} className='space-y-4 mt-4'>
                  <h2 className='text-xl font-bold text-gray-700'>
                    {category}
                  </h2>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {companies.map((company) => (
                      <div
                        key={company.id}
                        className='relative flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white'
                      >
                        <Button
                          variant='outline'
                          size='icon'
                          className='absolute top-2 right-2'
                          onClick={() => setCompanyToDelete(company)}
                        >
                          <Trash2 size={16} />
                        </Button>
                        <div className='flex items-start space-x-4'>
                          <button
                            onClick={() => toggleCompany(company.id)}
                            className={`w-5 h-5 rounded-sm border flex items-center justify-center mt-1 ${
                              selected[company.id]
                                ? "bg-green-500 border-green-500 text-white"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}
                          >
                            {selected[company.id] && <Check size={12} />}
                          </button>
                          <div className='flex-1'>
                            <p className='font-semibold text-gray-800'>
                              {company.name}
                            </p>
                            {company.description && (
                              <p className='mt-1 text-sm text-gray-500'>
                                {company.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant='outline'
                          className='mt-4 w-full'
                          onClick={() => {
                            setWhyText(company.why ?? "");
                            setNoteText(company.note ?? "");
                            setActiveCompany(company);
                          }}
                        >
                          Why
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

            {/* Step 2 footer: Done / Back */}
            <div className='mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4'>
              <Button
                variant='outline'
                onClick={() => setStep(1)}
                className='border-gray-300'
              >
                <ArrowLeft className='h-4 w-4 mr-2' />
                Back to dates
              </Button>
              <Button
                onClick={() => setStep(3)}
                className='bg-green-600 hover:bg-green-700'
              >
                <CheckCircle2 className='h-4 w-4 mr-2' />
                Done!
              </Button>
            </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* --- Step 3: Confirmation / All set --- */}
        {step === 3 && (
          <motion.div
            key='step3'
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='bg-white border rounded-lg p-8 md:p-12 shadow-sm text-center space-y-6'
          >
            <div className='flex justify-center'>
              <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600'>
                <CheckCircle2 className='h-12 w-12' />
              </div>
            </div>
            <div className='space-y-2'>
              <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
                All set!
              </h2>
              <p className='text-lg text-gray-600 max-w-md mx-auto'>
                We&apos;ve received your preferences and will be in contact
                soon.
              </p>
            </div>
            <p className='text-sm text-gray-500'>
              You selected {dates.filter((d) => d.is_selected).length} date
              {dates.filter((d) => d.is_selected).length === 1
                ? ""
                : "s"} and {Object.values(selected).filter(Boolean).length}{" "}
              compan
              {Object.values(selected).filter(Boolean).length === 1
                ? "y"
                : "ies"}{" "}
              to connect with.
            </p>
            <Button
              variant='outline'
              onClick={() => setStep(2)}
              className='mt-4'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to edit choices
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Why dialog */}
      <Dialog
        open={!!activeCompany}
        onOpenChange={(open) => {
          if (!open) setActiveCompany(null);
        }}
      >
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Why — {activeCompany?.name}</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 pt-2'>
            <div>
              <label className='text-sm font-medium text-gray-700'>Why</label>
              <Textarea
                placeholder='Why this company?'
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                className='mt-1 min-h-20'
              />
            </div>
            <div>
              <label className='text-sm font-medium text-gray-700'>Note</label>
              <Textarea
                placeholder='Optional note'
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className='mt-1 min-h-[60px]'
              />
            </div>
          </div>
          <div className='flex justify-end gap-2 pt-4'>
            <Button variant='outline' onClick={() => setActiveCompany(null)}>
              Cancel
            </Button>
            <Button onClick={saveWhyAndNote} disabled={savingWhy}>
              {savingWhy ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              {savingWhy ? " Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!companyToDelete}
        onOpenChange={(open) => {
          if (!open) setCompanyToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove company?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove {companyToDelete?.name} from this list? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              variant='destructive'
              disabled={deleting}
              onClick={() =>
                companyToDelete && deleteCompanyInDB(companyToDelete.id)
              }
            >
              {deleting ? <Loader2 className='h-4 w-4 animate-spin' /> : null}
              {deleting ? " Removing…" : "Remove"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
