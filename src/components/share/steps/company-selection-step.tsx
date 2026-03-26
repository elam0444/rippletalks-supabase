"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  LayoutGrid /*, Search*/,
} from "lucide-react";
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
  onEditWhy: (company: Company, anchor: HTMLElement) => void;
  onCloseWhy: () => void;
  activeCompanyId?: string | null;
  onDelete: (company: Company) => void;
  onViewModeChange: (mode: "tiles" | "table") => void;
  // onBrowseClick: () => void;
  onAddClick: () => void;
  onBack: () => void;
  onNext: () => void;
  companyName?: string | null;
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
  onCloseWhy,
  activeCompanyId,
  onDelete,
  onViewModeChange,
  // onBrowseClick,
  onAddClick,
  onBack,
  onNext,
  companyName,
}: CompanySelectionStepProps) {
  const allSelected = companies.every((c) => selected[c.id]);

  const columns = useCompanyColumns({
    selected,
    allSelected,
    onToggleCompany,
    onToggleAll,
    onEditWhy,
    onCloseWhy: () => onEditWhy(null as any, null as any),
    onDelete,
    isGuestView: !!token,
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
    [isMobile],
  );

  const toolbarButtons = (
    <>
      {token && (
        <div className="hidden">
          {/* <Button variant="outline" size="sm" onClick={onBrowseClick}>
            <Search className="h-4 w-4 mr-2" />
            Browse Companies
          </Button> */}
          <Button variant="outline" size="sm" onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>
      )}
      {companies.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            onViewModeChange(viewMode === "tiles" ? "table" : "tiles")
          }
          title={viewMode === "tiles" ? "Table View" : "Tile View"}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
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
          <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">
            Step 2: Choose which CEOs you would like to attend this fireside
          </CardTitle>
          <CardDescription className="text-base text-gray-900 space-y-3">
            <p>
              We have thousands of CEOs in our Ripple Talks network and we can
              invite them to join your fireside chat as VIP guests.{" "}
            </p>
            <p>
              We’ve generated a strategic guest list of 10 CEOs of companies who
              could be great prospective customers for{" "}
              {companyName || "you company"}.
            </p>
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
                toolbarRight={
                  <div className="flex flex-wrap items-center gap-2">
                    {toolbarButtons}
                  </div>
                }
                hideViewButton
                rowIsActive={(company) => !!selected[company.id]}
              />
            </div>
          )}

          {/* Tile View */}
          {viewMode === "tiles" && (
            <>
              <div className="flex flex-wrap gap-2 justify-end">
                {toolbarButtons}
              </div>
              {Object.entries(groupedCompanies).map(
                ([category, categoryCompanies]) => (
                  <div
                    key={category || "__no_category__"}
                    className="space-y-4 mt-4"
                  >
                    {category ? (
                      <h2 className="text-xl font-bold text-gray-700">
                        {category}
                      </h2>
                    ) : (
                      <div className="h-7" aria-hidden />
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryCompanies.map((company) => (
                        <CompanyTile
                          key={company.id}
                          company={company}
                          isSelected={selected[company.id]}
                          isWhyOpen={activeCompanyId === company.id}
                          onToggle={() => onToggleCompany(company.id)}
                          onDelete={() => onDelete(company)}
                          onEditWhy={(e) => onEditWhy(company, e.currentTarget)}
                          onCloseWhy={onCloseWhy}
                        />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </>
          )}

          {/* Footer Navigation */}
          {/*<div className='fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center'>
            <Button
              variant='outline'
              onClick={onBack}
              className='border-gray-300'
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to dates
            </Button>
            <Button
              onClick={onNext}
              className='bg-green-600 hover:bg-green-700'
            >
              <CheckCircle2 className='h-4 w-4 mr-2' />
              Done!
            </Button>
          </div>*/}
        </CardContent>
      </Card>

      {/* Done button */}
      <div className="hidden space-y-6 text-center pt-6">
        <Button
          onClick={onNext}
          className="bg-green-600 hover:bg-green-700 h-14 px-8 text-lg font-semibold cursor-pointer"
        >
          <CheckCircle2 className="h-5 w-5 mr-2" />
          Done!
        </Button>
      </div>
    </motion.div>
  );
}
