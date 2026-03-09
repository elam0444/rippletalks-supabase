import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  ariaLabel?: string;
  variant?: "default" | "header";
}

export function CompanyCheckbox({
  checked,
  onToggle,
  ariaLabel,
  variant = "default",
}: CompanyCheckboxProps) {
  const isHeader = variant === "header";
  const tooltip = checked ? "Remove from list" : "Add to list";

  return (
    <div className="relative inline-flex group/tooltip">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group/checkbox flex h-5 w-5 items-center justify-center rounded-sm border",
          "cursor-pointer transition-all duration-150 ease-out active:scale-90",
          checked
            ? "border-emerald-400 bg-emerald-500 hover:bg-emerald-600 hover:border-emerald-600"
            : "border-gray-300 bg-white hover:bg-emerald-50 hover:border-emerald-400",
          isHeader && "mx-auto"
        )}
        aria-label={ariaLabel || tooltip}
      >
        {checked ? (
          <Check
            size={13}
            strokeWidth={2.5}
            className="text-white transition-transform duration-150 group-hover/checkbox:scale-110"
          />
        ) : (
          <Plus
            size={13}
            strokeWidth={2.5}
            className="text-gray-400 transition-all duration-150 group-hover/checkbox:text-emerald-500 group-hover/checkbox:scale-110"
          />
        )}
      </button>

      {/* Tooltip */}
      <div
        className={cn(
          "pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2",
          "z-[9999]",
          "opacity-0 scale-95 transition-all duration-150",
          "group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100"
        )}
      >
        <div className="relative whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
          {tooltip}
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900" />
        </div>
      </div>
    </div>
  );
}