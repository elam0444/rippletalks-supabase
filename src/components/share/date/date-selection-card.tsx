import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils/text-utils";

interface DateSelectionCardProps {
  date: string;
  isSelected: boolean;
  onToggle: () => void;
}

/**
 * Card component for selecting available dates
 */
export function DateSelectionCard({
  date,
  isSelected,
  onToggle,
}: DateSelectionCardProps) {
  return (
    <motion.label
      className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
        isSelected ? "border-green-500 bg-green-50" : "border-gray-300"
      }`}
      whileHover={{ scale: 1.02 }}
    >
      <span>{formatDate(date)}</span>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-5 h-5 accent-green-600"
      />
    </motion.label>
  );
}
