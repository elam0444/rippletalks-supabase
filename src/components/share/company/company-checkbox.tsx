import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompanyCheckboxProps {
  checked: boolean; // TRUE = active
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

  const tooltip = checked ? "Remove from the list" : "Add to the list";

  return (
    <div className="relative inline-flex group/tooltip">
      {/* BUTTON */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group/checkbox flex h-5 w-5 items-center justify-center rounded-sm border",
          "cursor-pointer",
          "transition-all duration-150 ease-out active:scale-90",
          checked
            ? "border-red-200 bg-white hover:bg-red-50 hover:border-red-400"
            : "border-gray-300 bg-white hover:bg-emerald-50 hover:border-emerald-400",
          isHeader && "mx-auto"
        )}
        aria-label={ariaLabel || tooltip}
      >
        {checked ? (
          <X
            size={14}
            className="text-red-500 transition-transform duration-150 group-hover/checkbox:scale-110"
          />
        ) : (
          <RotateCcw
            size={14}
            className="text-gray-400 transition-all duration-150 group-hover/checkbox:text-emerald-500 group-hover/checkbox:scale-110"
          />
        )}
      </button>

      {/* TOOLTIP (RIGHT SIDE) */}
      <div
        className={cn(
          "pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2",
          "z-[9999]", // ✅ overlaps EVERYTHING
          "opacity-0 scale-95 transition-all duration-150",
          "group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100"
        )}
      >
        <div className="relative whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white shadow-lg">
          {tooltip}

          {/* arrow */}
          <div className="absolute left-0 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gray-900" />
        </div>
      </div>
    </div>
  );
}