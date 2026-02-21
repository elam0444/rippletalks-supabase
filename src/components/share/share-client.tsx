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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function ShareClient({
  companies = [],
  clientCompanyId,
  sharedContact,
  sharedCompany,
  contactDates: initialDates = [],
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);

  // --- Step 1: Contact Dates ---
  const [dates, setDates] = useState(initialDates);
  const toggleDate = (date: string) => {
    setDates((prev) =>
      prev.map((d) =>
        d.available_date === date ? { ...d, is_selected: !d.is_selected } : d,
      ),
    );
  };

  // --- Step 2: Companies ---
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.id, c.selected ?? true])),
  );
  const [companiesList, setCompaniesList] = useState(companies);
  const allSelected = companiesList.every((c) => selected[c.id]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [viewMode, setViewMode] = useState<"tiles" | "table">("table");

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
      const res = await fetch("/api/target-company/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientCompanyId, companyId, selected: value }),
      });
      const data = await res.json();
      if (!res.ok) console.error("API error:", data.error);
    } catch (err) {
      console.error("Unexpected API error:", err);
    }
  };

  const deleteCompanyInDB = async (companyId: string) => {
    try {
      const res = await fetch("/api/target-company/delete", {
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
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Shared Contact Info */}
      {sharedContact && sharedCompany && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Shared Contact
          </h2>
          <div className="flex items-start gap-6">
            {/* Contact Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {sharedContact.avatar_url ? (
                  <Image
                    src={sharedContact.avatar_url}
                    alt={sharedContact.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {sharedContact.name}
                  </h3>
                  {sharedContact.title && (
                    <p className="text-sm text-gray-600">
                      {sharedContact.title}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2 ml-15">
                {sharedContact.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a
                      href={`mailto:${sharedContact.email}`}
                      className="text-blue-600 hover:underline"
                    >
                      {sharedContact.email}
                    </a>
                  </div>
                )}
                {sharedContact.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-700">{sharedContact.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            <div className="flex-1 border-l pl-6">
              <div className="flex items-center gap-3 mb-3">
                {sharedCompany.logo_url ? (
                  <Image
                    src={sharedCompany.logo_url}
                    alt={sharedCompany.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-gray-100">
                    <Building2 className="h-6 w-6 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {sharedCompany.name}
                  </h3>
                  {sharedCompany.website && (
                    <a
                      href={sharedCompany.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                    </a>
                  )}
                </div>
              </div>
              {sharedCompany.description && (
                <p className="text-sm text-gray-600 ml-15">
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
          className="bg-white border rounded-lg p-6 shadow-sm space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2 className="text-2xl font-bold text-gray-900">
            Step 1: Select Dates to Attend RippleTalk
          </h2>
          <p className="text-gray-600">
            Choose the dates you are interested in attending. You can select multiple.
          </p>

          {dates.length === 0 ? (
            <p className="text-gray-500">No available dates for this contact.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {dates.map((d) => (
                <motion.label
                  key={d.available_date}
                  className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    d.is_selected ? "border-green-500 bg-green-50" : "border-gray-300"
                  }`}
                  whileHover={{ scale: 1.02 }}
                >
                  <span>{new Date(d.available_date).toLocaleString()}</span>
                  <input
                    type="checkbox"
                    checked={!!d.is_selected}
                    onChange={() => toggleDate(d.available_date)}
                    className="w-5 h-5"
                  />
                </motion.label>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                1
              </span>
              <span className="text-gray-600">Select Dates</span>
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
      {step === 2 && (
        <div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Key Stakeholder Opportunities
            </h1>
            <p className="mt-2 text-gray-600">
              Uncheck companies you’d rather pass on, or add new companies you want to connect with.
            </p>

            {companiesList.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="border-black text-black bg-white hover:bg-gray-100"
                  onClick={toggleAll}
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="outline"
                  className="border-black text-black bg-white hover:bg-gray-100"
                  onClick={() => setViewMode(viewMode === "tiles" ? "table" : "tiles")}
                >
                  {viewMode === "tiles" ? "Table View" : "Tile View"}
                </Button>
              </div>
            )}
          </div>

          {/* Table or Tiles View */}
          {viewMode === "table" && (
            <div className="overflow-x-auto mt-4">
              <table className="w-full table-auto border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-2 w-12"></th>
                    <th className="border p-2 text-left">Company</th>
                    <th className="border p-2 text-left">Description</th>
                    <th className="border p-2 text-left">Category</th>
                    <th className="border p-2 text-left">Why</th>
                    <th className="border p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {companiesList.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="border p-2 text-center">
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
                      <td className="border p-2">{company.name}</td>
                      <td className="border p-2">{company.description || "—"}</td>
                      <td className="border p-2">{company.relationship_category || "—"}</td>
                      <td className="border p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveCompany(company)}
                        >
                          Why
                        </Button>
                      </td>
                      <td className="border p-2">
                        <Button
                          variant="outline"
                          size="sm"
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
              <div key={category} className="space-y-4 mt-4">
                <h2 className="text-xl font-bold text-gray-700">{category}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="relative flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => setCompanyToDelete(company)}
                      >
                        <Trash2 size={16} />
                      </Button>
                      <div className="flex items-start space-x-4">
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
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{company.name}</p>
                          {company.description && (
                            <p className="mt-1 text-sm text-gray-500">{company.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() => setActiveCompany(company)}
                      >
                        Why
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Delete & Side Panel modals (same as before) */}
      {/* ... your existing AnimatePresence code here ... */}
    </div>
  );
}
