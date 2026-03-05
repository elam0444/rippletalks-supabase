"use client";

import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmationStepProps {
  onBack: () => void;
  selectedDate: string | null;
}

/**
 * Step 3: Confirmation screen
 */
export function ConfirmationStep({ onBack, selectedDate }: ConfirmationStepProps) {
  return (
    <motion.div
      key='step3'
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className='bg-white border rounded-lg p-8 md:p-12 shadow-sm text-center space-y-6'
    >
      <div className='flex justify-center'>
        <div className='flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600'>
          <CheckCircle2 className='h-12 w-12' />
        </div>
      </div>
      <div className='space-y-2'>
        <h2 className='text-2xl md:text-3xl font-bold text-gray-900'>
          All set!
        </h2>
        {selectedDate && (
          <p className='text-gray-600'>
            See you on {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>
      <Button variant='outline' onClick={onBack} className='mt-4'>
        <ArrowLeft className='h-4 w-4 mr-2' />
        Back to edit choices
      </Button>
    </motion.div>
  );
}
