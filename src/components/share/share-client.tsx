'use client';

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

interface Company {
    id: string;
    name: string;
    description?: string;
    why?: string;
    note?: string;
    selected?: boolean;
    relationship_category?: string;
}

interface Props {
    companies: Company[];
    clientCompanyId?: string;
}

export function ShareClient({ companies = [], clientCompanyId }: Props) {
    const [selected, setSelected] = useState<Record<string, boolean>>(
        Object.fromEntries(companies.map((c) => [c.id, c.selected ?? true]))
    );
    const [activeCompany, setActiveCompany] = useState<Company | null>(null);

    const toggle = (id: string) =>
        setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

    const allSelected = companies.every((c) => selected[c.id]);
    const toggleAll = () => {
        const newSelected: Record<string, boolean> = {};
        companies.forEach((c) => {
            newSelected[c.id] = !allSelected;
        });
        setSelected(newSelected);
    };

    // Group companies by relationship_category
    const groupedCompanies: Record<string, Company[]> = {};
    companies.forEach(c => {
        const category = c.relationship_category || "Uncategorized";
        if (!groupedCompanies[category]) groupedCompanies[category] = [];
        groupedCompanies[category].push(c);
    });

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Key Stakeholder Opportunities</h1>
                <p className="mt-2 text-gray-600">
                    We uncovered 200 companies across 11 strategic stakeholder categories from Super Set portfolio. Ripple enables direct CEO introductions - uncheck any you'd rather pass on, or add new companies you want to connect with.
                </p>

                {companies.length > 0 && (
                    <div className="mt-4">
                        <Button
                            variant="outline"
                            className="border-black text-black bg-white hover:bg-gray-100"
                            onClick={toggleAll}
                        >
                            {allSelected ? "Deselect All" : "Select All"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Company cards grouped by relationship category */}
            {Object.entries(groupedCompanies).map(([category, companies]) => (
                <div key={category} className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-700">{category}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {companies.map(company => (
                            <div
                                key={company.id}
                                className="flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                            >
                                {/* Card content split into 2 columns */}
                                <div className="flex items-start space-x-4">
                                    {/* Left column: small square check */}
                                    <button
                                        onClick={() => toggle(company.id)}
                                        className={`w-5 h-5 rounded-sm border flex items-center justify-center mt-1 ${selected[company.id]
                                            ? "bg-green-500 border-green-500 text-white"
                                            : "bg-white border-gray-300 text-gray-400"
                                            }`}
                                    >
                                        {selected[company.id] && <Check size={12} />}
                                    </button>

                                    {/* Right column: text */}
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-800">{company.name}</p>
                                        {company.description && (
                                            <p className="mt-1 text-sm text-gray-500">{company.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Full width Why button */}
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

            {companies.length === 0 && (
                <div className="mt-6 text-center text-gray-500">
                    No companies available to share.
                </div>
            )}

            {/* Side panel with animation */}
            <AnimatePresence>
                {activeCompany && (
                    <motion.div
                        className="fixed inset-0 bg-black/30 flex justify-end z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setActiveCompany(null)}
                    >
                        <motion.div
                            className="w-96 bg-white h-full p-6 flex flex-col shadow-xl"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside panel
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold">{activeCompany.name}</h2>
                                <Button variant="ghost" onClick={() => setActiveCompany(null)}>Close</Button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold">Why</h3>
                                    <p>{activeCompany.why || "—"}</p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">Note</h3>
                                    <p>{activeCompany.note || "—"}</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
