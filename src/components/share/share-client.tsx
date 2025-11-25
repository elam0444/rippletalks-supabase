'use client';

import { useState, useMemo } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion';

interface Company {
  id: string;
  name: string;
  description?: string;
  why?: string;
  note?: string;
  selected?: boolean;
  relationship_category?: string;
}

interface Properties {
  companies: Company[];
  clientCompanyId?: string;
}

export function ShareClient({ companies = [], clientCompanyId }: Properties) {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.id, c.selected ?? true])),
  );
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [companiesList, setCompaniesList] = useState(companies);
  const [viewMode, setViewMode] = useState<'tiles' | 'table'>('table');
  const allSelected = companiesList.every((c) => selected[c.id]);

  // --- Group companies by category ---
  const groupedCompanies = useMemo(() => {
    const groups: Record<string, Company[]> = {};
    for (const c of companiesList) {
      const cat = c.relationship_category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    }
    return groups;
  }, [companiesList]);

  // --- Toggle selected ---
  const toggle = (id: string) => {
    const newValue = !selected[id];
    setSelected((previous) => ({ ...previous, [id]: newValue }));
    updateSelectedInDB(id, newValue);
  };

  const toggleAll = () => {
    const newValue = !allSelected;
    const newSelected: Record<string, boolean> = {};
    for (const c of companiesList) {
      newSelected[c.id] = newValue;
      updateSelectedInDB(c.id, newValue);
    }
    setSelected(newSelected);
  };

  const updateSelectedInDB = async (companyId: string, value: boolean) => {
    try {
      const res = await fetch('/api/target-company/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCompanyId, companyId, selected: value }),
      });
      const data = await res.json();
      if (!res.ok) console.error('API error:', data.error);
    } catch (error) {
      console.error('Unexpected API error:', error);
    }
  };

  const deleteCompanyInDB = async (companyId: string) => {
    try {
      const res = await fetch('/api/target-company/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientCompanyId, companyId }),
      });
      const data = await res.json();
      if (res.ok) {
        // Remove company locally to refresh UI
        setCompaniesList((previous) => previous.filter((c) => c.id !== companyId));
        setCompanyToDelete(null);
      } else {
        console.error('API error:', data.error);
      }
    } catch (error) {
      console.error('Unexpected API error:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Key Stakeholder Opportunities</h1>
        <p className="mt-2 text-gray-600">
          We uncovered 200 companies across 11 strategic stakeholder categories from Super Set
          portfolio. Ripple enables direct CEO introductions - uncheck any you'd rather pass on, or
          add new companies you want to connect with.
        </p>

        {companiesList.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-black text-black bg-white hover:bg-gray-100"
              onClick={toggleAll}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            <Button
              variant="outline"
              className="border-black text-black bg-white hover:bg-gray-100"
              onClick={() => setViewMode(viewMode === 'tiles' ? 'table' : 'tiles')}
            >
              {viewMode === 'tiles' ? 'Table View' : 'Tile View'}
            </Button>
          </div>
        )}
      </div>

      {/* Table view */}
      {viewMode === 'table' && (
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
                      onClick={() => toggle(company.id)}
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center mx-auto ${
                        selected[company.id]
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      }`}
                    >
                      {selected[company.id] && <Check size={12} />}
                    </button>
                  </td>
                  <td className="border p-2">{company.name}</td>
                  <td className="border p-2">{company.description || '—'}</td>
                  <td className="border p-2">{company.relationship_category || '—'}</td>
                  <td className="border p-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveCompany(company)}>
                      Why
                    </Button>
                  </td>
                  <td className="border p-2">
                    <Button variant="outline" size="sm" onClick={() => setCompanyToDelete(company)}>
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tiles view */}
      {viewMode === 'tiles' &&
        Object.entries(groupedCompanies).map(([category, companies]) => (
          <div key={category} className="space-y-4 mt-4">
            <h2 className="text-xl font-bold text-gray-700">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="relative flex flex-col p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  {/* Trash button top-right */}
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
                      onClick={() => toggle(company.id)}
                      className={`w-5 h-5 rounded-sm border flex items-center justify-center mt-1 ${
                        selected[company.id]
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
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

      {/* Delete modal */}
      <AnimatePresence>
        {companyToDelete && (
          <motion.div
            className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white p-6 rounded-lg shadow-xl w-96"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
              <p>
                Are you sure you want to delete <strong>{companyToDelete.name}</strong>?
              </p>
              <div className="mt-6 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setCompanyToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={() => deleteCompanyInDB(companyToDelete.id)}>
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side panel */}
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{activeCompany.name}</h2>
                <Button variant="ghost" onClick={() => setActiveCompany(null)}>
                  Close
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Why</h3>
                  <p>{activeCompany.why || '—'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Note</h3>
                  <p>{activeCompany.note || '—'}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
