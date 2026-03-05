"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { Calendar as CalendarIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { format, isToday, isBefore, startOfMinute } from "date-fns";
import { revalidateCompanyPage } from "@/lib/actions/company";

interface ContactDatesModalProps {
  contactId: string;
  companyId: string;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60 === 0 ? "00" : "30";
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12.toString().padStart(2, "0")}:${m} ${period}`;
});

// Parse "hh:mm AM/PM" into { h24, minutes }
function parseTime(time: string): { h24: number; minutes: number } {
  const [timePart, period] = time.split(" ");
  const [h12, minutes] = timePart.split(":").map(Number);
  let h24 = h12 % 12; // 12 AM -> 0, 12 PM -> 12
  if (period === "PM") h24 += 12;
  return { h24, minutes };
}

export default function ContactDatesModal({
  contactId,
  companyId,
}: ContactDatesModalProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [month, setMonth] = useState(new Date());

  useEffect(() => {
    if (!open) return;

    async function fetchDates() {
      try {
        const { data, error } = await supabase
          .from("contact_available_dates")
          .select("available_date")
          .eq("contact_id", contactId)
          .order("available_date", { ascending: true });

        if (error) throw error;

        if (data) {
          setSelectedDates(
            data
              .map((d) => new Date(d.available_date))
              .filter((d) => !isNaN(d.getTime())), // guard invalid dates
          );
        }
      } catch (err) {
        console.error("Error fetching dates:", err);
      }
    }

    fetchDates();
  }, [open, contactId, supabase]);

  const handleTimeChange = (index: number, time: string) => {
    const { h24, minutes } = parseTime(time);
    const newDates = [...selectedDates];
    const date = new Date(newDates[index]);
    date.setHours(h24, minutes, 0, 0);
    newDates[index] = date;
    setSelectedDates(newDates);
  };

  const isTimeDisabled = (date: Date, time: string) => {
    if (!isToday(date)) return false;
    const { h24, minutes } = parseTime(time);
    const slot = new Date(date);
    slot.setHours(h24, minutes, 0, 0);
    return isBefore(slot, startOfMinute(new Date()));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await supabase
        .from("contact_available_dates")
        .delete()
        .eq("contact_id", contactId);

      const inserts = selectedDates.map((date) => ({
        contact_id: contactId,
        company_id: companyId,
        available_date: date.toISOString(),
      }));

      const { error } = await supabase
        .from("contact_available_dates")
        .insert(inserts);

      if (error) throw error;
      await revalidateCompanyPage(companyId);
    } catch (err) {
      console.error("Error saving dates:", err);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <CalendarIcon className="h-4 w-4 mr-1" />
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Available Dates & Times</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_240px] gap-6 py-4">
          <div className="space-y-2">
            <DayPicker
              mode="multiple"
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              selected={selectedDates}
              onSelect={(dates) => {
                if (Array.isArray(dates))
                  setSelectedDates(dates.filter((d) => !isNaN(d.getTime())));
              }}
              hideNavigation
            />
          </div>

          <div className="space-y-4 max-h-[330px] overflow-y-auto pr-2">
            {selectedDates.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Select a date to see time slots
              </p>
            )}

            {selectedDates
              .filter((d) => !isNaN(d.getTime()))
              .map((date, index) => {
                const selectedTime = format(date, "hh:mm aa");
                const isEditing = activeIndex === index;

                return (
                  <div key={date.toISOString()} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {format(date, "PPP")}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveIndex(isEditing ? null : index)
                        }
                        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                      >
                        🕘 {selectedTime}
                      </button>
                    </div>

                    {isEditing && (
                      <div className="max-h-64 overflow-y-auto border rounded-xl p-2 space-y-1">
                        {TIME_SLOTS.map((time) => {
                          const selected = selectedTime === time;
                          const disabled = isTimeDisabled(date, time);

                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                handleTimeChange(index, time);
                                setActiveIndex(null);
                              }}
                              className={`w-full px-3 py-2 rounded-lg text-left text-sm transition ${
                                selected
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Dates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}