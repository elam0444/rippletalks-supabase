"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { DateSelectionCard } from "../date/date-selection-card";
import { StepIndicator } from "../shared/step-indicator";
import type { ContactDate } from "@/types/share";

interface DateSelectionStepProps {
  dates: ContactDate[];
  onToggleDate: (date: string) => void;
  onNext: () => void;
  panelistType: string | null;
  timeZone?: string;
}

/**
 * Step 1: Date selection screen
 */
export function DateSelectionStep({
  dates,
  onToggleDate,
  onNext,
  panelistType,
  timeZone,
}: DateSelectionStepProps) {
  const hasSelectedDates = dates.some((d) => d.is_selected);

  return (
    <motion.div
      className="bg-white border rounded-lg p-4 sm:p-6 shadow-sm space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
        Step 1: Select the date that works best to join us as our {panelistType || 'guest'}
      </h2>
      {dates.length === 0 ? (
        <p className="text-gray-500">No available dates for this contact.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {dates.map((d) => (
            <DateSelectionCard
              key={d.available_date}
              date={d.available_date}
              isSelected={d.is_selected}
              onToggle={() => onToggleDate(d.available_date)}
              timeZone={timeZone}
            />
          ))}
        </div>
      )}

      {/*<div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center">
        <StepIndicator step={1} label="Select Dates" />
        <Button onClick={onNext} disabled={!hasSelectedDates}>
          Next: Select Opportunities →
        </Button>
      </div>*/}
    </motion.div>
  );
}
