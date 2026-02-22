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

interface ContactDatesModalProps {
  contactId: string;
  companyId: string;
}

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, "0");
  const m = i % 2 === 0 ? "00" : "30";
  return `${h}:${m}`;
});

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
          setSelectedDates(data.map((d) => new Date(d.available_date)));
        }
      } catch (err) {
        console.error("Error fetching dates:", err);
      }
    }

    fetchDates();
  }, [open, contactId, supabase]);

  const handleTimeChange = (index: number, time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    const newDates = [...selectedDates];
    const date = new Date(newDates[index]);
    date.setHours(hours, minutes, 0, 0);
    newDates[index] = date;
    setSelectedDates(newDates);
  };

  const isTimeDisabled = (date: Date, time: string) => {
    if (!isToday(date)) return false;

    const [h, m] = time.split(":").map(Number);
    const slot = new Date(date);
    slot.setHours(h, m, 0, 0);

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
                if (Array.isArray(dates)) setSelectedDates(dates);
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

            {selectedDates.map((date, index) => {
              const selectedTime = format(date, "HH:mm");
              const isEditing = activeIndex === index;

              return (
                <div key={date.toISOString()} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {format(date, "PPP")}
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveIndex(index)}
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
                            className={`w-full px-3 py-2 rounded-lg text-left text-sm transition
                  ${
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted"
                  }
                  ${disabled ? "opacity-40 cursor-not-allowed" : ""}
                `}
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
