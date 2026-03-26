"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { ContactWelcomeCard } from "./shared/contact-welcome-card";
import { DateSelectionStep } from "./steps/date-selection-step";
import { CompanySelectionStep } from "./steps/company-selection-step";
import { GuestListStep } from "./steps/guest-list-step";
import { TermsStep } from "./steps/terms-step";
import { ConfirmationStep } from "./steps/confirmation-step";
import { WhyNotePopup } from "./company/why-note-popup";
import { DeleteCompanyDialog } from "./company/delete-company-dialog";
import { BrowseCompaniesDialog } from "./company/browse-companies-dialog";
import { AddCompanyDialog } from "./company/add-company-dialog";
import type { Company, Contact, ContactDate } from "@/types/share";

interface Props {
  companies: Company[];
  clientCompanyId?: string;
  sharedContact?: Contact | null;
  sharedCompany?: {
    id: string;
    name: string;
    logo_url?: string;
    website?: string;
    description?: string;
  } | null;
  contactDates?: ContactDate[];
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
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [alwaysVisible, setAlwaysVisible] = useState(true);
  const step2Ref = useRef<HTMLDivElement | null>(null);

  const [timeZone] = useState<string>(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  // --- Step 1: Contact Dates ---
  const [dates, setDates] = useState(initialDates);

  const toggleDate = useCallback(
    async (date: string) => {
      const current = dates.find((d) => d.available_date === date);
      if (!current) return;
      const newValue = !current.is_selected;

      const prevDates = dates;
      setDates((prev) =>
        prev.map((d) => ({
          ...d,
          is_selected: d.available_date === date ? newValue : false,
        })),
      );

      if (newValue) {
        setTimeout(() => {
          const el = step2Ref.current;
          if (!el) return;
          const top = el.getBoundingClientRect().top + window.scrollY - 24;
          window.scrollTo({ top, behavior: "smooth" });
        }, 300);
      }

      if (token) {
        try {
          const deselects = prevDates
            .filter((d) => d.available_date !== date && d.is_selected)
            .map((d) =>
              fetch("/api/share/update-date", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token,
                  availableDate: d.available_date,
                  isSelected: false,
                }),
              }),
            );

          const toggle = fetch("/api/share/update-date", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              availableDate: date,
              isSelected: newValue,
            }),
          });

          const results = await Promise.all([...deselects, toggle]);
          for (const res of results) {
            if (!res.ok) {
              const data = await res.json();
              console.error("API error:", data.error);
              setDates(prevDates);
              return;
            }
          }
        } catch (err) {
          console.error("Unexpected API error:", err);
          setDates(prevDates);
        }
      }
    },
    [dates, token],
  );

  // --- Step 2: Companies ---
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(companies.map((c) => [c.id, c.selected ?? true])),
  );
  const [companiesList, setCompaniesList] = useState(companies);
  const [activeCompany, setActiveCompany] = useState<{
    company: Company;
    anchor: HTMLElement;
  } | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"tiles" | "table">("table");

  // Mobile breakpoint
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(max-width: 768px)");
    setIsMobile(m.matches);
    const listener = () => setIsMobile(m.matches);
    m.addEventListener("change", listener);
    return () => m.removeEventListener("change", listener);
  }, []);

  // --- Browse Companies Dialog ---
  const [browseOpen, setBrowseOpen] = useState(false);

  // --- Add Company Dialog ---
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);

  // --- API: Update Selected Status ---
  const updateSelectedInDB = useCallback(
    async (companyId: string, value: boolean) => {
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
                companyId: companyId,
                selected: value,
              }),
            });
        const data = await res.json();
        if (!res.ok) console.error("API error:", data.error);
      } catch (err) {
        console.error("Unexpected API error:", err);
      }
    },
    [token, clientCompanyId],
  );

  const toggleCompany = useCallback(
    (id: string) => {
      const newValue = !selected[id];
      setSelected((prev) => ({ ...prev, [id]: newValue }));
      updateSelectedInDB(id, newValue);
    },
    [selected, updateSelectedInDB],
  );

  const toggleAll = useCallback(() => {
    const allSelected = companiesList.every((c) => selected[c.id]);
    const newValue = !allSelected;
    const newSelected: Record<string, boolean> = {};
    companiesList.forEach((c) => {
      newSelected[c.id] = newValue;
      updateSelectedInDB(c.id, newValue);
    });
    setSelected(newSelected);
  }, [companiesList, selected, updateSelectedInDB]);

  // --- API: Add Company from Browse ---
  const handleAddCompanyFromBrowse = async (companyId: string) => {
    if (!token) return;
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
          logo_url: data.company.logo_url ?? null,
          website: data.company.website ?? null,
          selected: true,
        };
        setCompaniesList((prev) => [...prev, newCompany]);
        setSelected((prev) => ({ ...prev, [data.company.id]: true }));
      }
    } catch (err) {
      console.error("Error adding company:", err);
    }
  };

  // --- API: Add Custom Company ---
  const handleAddCustomCompany = (company: Company) => {
    setCompaniesList((prev) => [...prev, company]);
    setSelected((prev) => ({ ...prev, [company.id]: true }));
  };

  // --- API: Delete Company ---
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

  // --- API: Save Why and Note ---
  const saveWhyAndNote = async (why: string, note: string) => {
    if (!activeCompany) return;
    try {
      const res = token
        ? await fetch("/api/share/update-target", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token,
              targetCompanyId: activeCompany.company.id,
              why,
              note,
            }),
          })
        : await fetch("/api/target-company/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientCompanyId,
              companyId: activeCompany.company.id,
              why,
              note,
            }),
          });
      const data = await res.json();
      if (res.ok) {
        setCompaniesList((prev) =>
          prev.map((c) =>
            c.id === activeCompany.company.id ? { ...c, why, note } : c,
          ),
        );
      } else {
        console.error("API error:", data.error);
      }
    } catch (err) {
      console.error("Unexpected API error:", err);
    }
  };

  return (
    <div className='max-w-6xl mx-auto p-6 space-y-6'>
      {/* --- Step 1: Date Selection --- */}
      {(step === 1 || (alwaysVisible && step < 5)) && (
        <>
          {sharedContact && (
            <ContactWelcomeCard
              contact={sharedContact}
              company={sharedCompany}
            />
          )}
          <video
            src='/Ripple Talks Credibility Video (home page main video) - March 2026 version.mov'
            controls
            className='w-full rounded-lg'
          />
          <DateSelectionStep
            dates={dates}
            onToggleDate={toggleDate}
            onNext={() => setStep(2)}
            panelistType={sharedContact?.panelist_type || null}
            timeZone={timeZone}
          />
        </>
      )}

      {/* --- Step 2: Company Selection --- */}
      <div ref={step2Ref}>
        {(step === 2 || (alwaysVisible && step < 5)) && (
          <CompanySelectionStep
            key='company-selection'
            companies={companiesList}
            selected={selected}
            viewMode={viewMode}
            token={token}
            isMobile={isMobile}
            onToggleCompany={toggleCompany}
            onToggleAll={toggleAll}
            onEditWhy={(company, anchor) =>
              setActiveCompany({ company, anchor })
            }
            onCloseWhy={() => setActiveCompany(null)}
            activeCompanyId={activeCompany?.company?.id ?? null}
            onDelete={setCompanyToDelete}
            onViewModeChange={setViewMode}
            onAddClick={() => setAddCompanyOpen(true)}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
            companyName={sharedCompany?.name || null}
          />
        )}
      </div>

      {/* --- Step 3: Guest List --- */}
      {(step === 3 || (alwaysVisible && step < 5)) && (
        <GuestListStep
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          addedByProfileId={sharedContact?.id}
          clientCompanyId={sharedCompany?.id}
        />
      )}

      {/* --- Step 4: Terms --- */}
      {(step === 4 || (alwaysVisible && step < 5)) && (
        <TermsStep onBack={() => setStep(3)} onNext={() => setStep(5)} />
      )}

      <AnimatePresence mode='wait'>
        {/* --- Step 5: Confirmation --- */}
        {step === 5 && (
          <ConfirmationStep
            key='confirmation'
            onBack={() => setStep(4)}
            selectedDate={
              dates.find((d) => d.is_selected)?.available_date ?? null
            }
            timeZone={timeZone}
          />
        )}
      </AnimatePresence>

      {/* --- Dialogs --- */}
      <WhyNotePopup
        active={activeCompany}
        onClose={() => setActiveCompany(null)}
        onSave={saveWhyAndNote}
      />
      <DeleteCompanyDialog
        company={companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onDelete={deleteCompanyInDB}
        isDeleting={deleting}
      />
      <BrowseCompaniesDialog
        open={browseOpen}
        onOpenChange={setBrowseOpen}
        token={token}
        onAddCompany={handleAddCompanyFromBrowse}
      />
      <AddCompanyDialog
        open={addCompanyOpen}
        onOpenChange={setAddCompanyOpen}
        token={token}
        onAddCompany={handleAddCustomCompany}
      />
    </div>
  );
}
