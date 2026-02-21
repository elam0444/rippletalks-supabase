interface StepIndicatorProps {
  step: number;
  label: string;
}

/**
 * Displays a circular step indicator with number and label
 */
export function StepIndicator({ step, label }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
        {step}
      </span>
      <span className="text-gray-600">{label}</span>
    </div>
  );
}
