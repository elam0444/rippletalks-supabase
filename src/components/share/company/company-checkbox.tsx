import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  variant?: "default" | "header";
}

/**
 * Custom styled checkbox for company selection
 */
export function CompanyCheckbox({
  checked,
  onToggle,
  ariaLabel,
  variant = "default",
}: CompanyCheckboxProps) {
  const isHeader = variant === "header";

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex h-5 w-5 items-center justify-center rounded-sm border",
        checked
          ? "border-green-500 bg-green-500 text-white"
          : "border-gray-300 bg-white text-gray-400",
        isHeader && "mx-auto"
      )}
      aria-label={ariaLabel || (checked ? "Deselect" : "Select")}
    >
      {checked && <Check size={12} />}
    </button>
  );
}
