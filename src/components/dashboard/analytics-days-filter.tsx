"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AnalyticsDaysFilterProps {
  currentDays: number;
}

const OPTIONS = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "Last 60 days", value: "60" },
  { label: "Last 90 days", value: "90" },
  { label: "Last 6 months", value: "180" },
  { label: "Last year", value: "365" },
];

export function AnalyticsDaysFilter({ currentDays }: AnalyticsDaysFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("days", value);
    router.push(`/dashboard/analytics?${params.toString()}`);
  }

  return (
    <Select value={String(currentDays)} onValueChange={handleChange}>
      <SelectTrigger className='w-40'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
