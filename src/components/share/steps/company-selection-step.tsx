"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { CompanyTile } from "../company/company-tile";
import { useCompanyColumns } from "../company/company-table-columns";
import type { Company } from "@/types/share";

interface CompanySelectionStepProps {
  companies: Company[];
  selected: Record<string, boolean>;
  viewMode: "tiles" | "table";
  token?: string;
  isMobile?: boolean;
  onToggleCompany: (id: string) => void;
  onToggleAll: () => void;
  onEditWhy: (company: Company) => void;
  onDelete: (company: Company) => void;
  onViewModeChange: (mode: "tiles" | "table") => void;
  onBrowseClick: () => void;
  onAddClick: () => void;
  onBack: () => void;
  onNext: () => void;
}

/**
 * Step 2: Company selection screen
 */
export function CompanySelectionStep({
  companies,
  selected,
  viewMode,
  token,
  isMobile = false,
  onToggleCompany,
  onToggleAll,
  onEditWhy,
  onDelete,
  onViewModeChange,
  onBrowseClick,
  onAddClick,
  onBack,
  onNext,
}: CompanySelectionStepProps) {
  const allSelected = companies.every((c) => selected[c.id]);

  const columns = useCompanyColumns({
    selected,
    allSelected,
    onToggleCompany,
    onToggleAll,
    onEditWhy,
    onDelete,
  });

  const groupedCompanies = useMemo(() => {
    const groups: Record<string, Company[]> = {};
    companies.forEach((c) => {
      const cat = c.relationship_category ?? "";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [companies]);

  // Responsive column visibility
  const tableColumnVisibility = useMemo(
    (): Record<string, boolean> =>
      isMobile ? { description: false, category: false } : {},
    [isMobile]
  );

  const toolbarButtons = (
    <>
      {companies.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModeChange(viewMode === "tiles" ? "table" : "tiles")}
        >
          {viewMode === "tiles" ? "Table View" : "Tile View"}
        </Button>
      )}
      {token && (
        <>
          <Button variant="outline" size="sm" onClick={onBrowseClick}>
            <Search className="h-4 w-4 mr-2" />
            Browse Companies
          </Button>
          <Button variant="outline" size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company (not in list)
          </Button>
        </>
      )}
    </>
  );

  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="space-y-0">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl text-gray-900">
            Key Stakeholder Opportunities
          </CardTitle>
          <CardDescription className="text-base text-gray-600">
            Uncheck companies you&apos;d rather pass on, or add new companies
            you want to connect with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Table View */}
          {viewMode === "table" && (
            <div className="-mx-2 sm:mx-0 overflow-x-auto">
              <DataTable<Company, unknown>
                columns={columns}
                data={companies}
                defaultPageSize={10}
                pageSizeOptions={[5, 10, 25, 50]}
                columnVisibility={tableColumnVisibility}
                toolbarExtra={
                  <div className="flex flex-wrap items-center gap-2">
                    {toolbarButtons}
                  </div>
                }
                hideViewButton
              />
            </div>
          )}

          {/* Tile View */}
          {viewMode === "tiles" && (
            <>
              <div className="flex flex-wrap gap-2">{toolbarButtons}</div>
              {Object.entries(groupedCompanies).map(([category, categoryCompanies]) => (
                <div key={category || "__no_category__"} className="space-y-4 mt-4">
                  {category ? (
                    <h2 className="text-xl font-bold text-gray-700">{category}</h2>
                  ) : (
                    <div className="h-7" aria-hidden />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryCompanies.map((company) => (
                      <CompanyTile
                        key={company.id}
                        company={company}
                        isSelected={selected[company.id]}
                        onToggle={() => onToggleCompany(company.id)}
                        onDelete={() => onDelete(company)}
                        onEditWhy={() => onEditWhy(company)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Footer Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to dates
            </Button>
            <Button onClick={onNext} className="bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Done!
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
