"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TermsStepProps {
  onBack: () => void;
  onNext: () => void;
}

export function TermsStep({ onBack, onNext }: TermsStepProps) {
  const [agreed, setAgreed] = useState(false);

  return (
    <motion.div
      key='step4'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <Card>
        <CardHeader>
          {/* <CardTitle className='text-xl sm:text-2xl font-semibold text-gray-900'>
            Step 4: Accept the terms
          </CardTitle> */}
          <CardTitle className='text-xl sm:text-2xl font-semibold text-gray-900'>
            Step 3: Accept the terms
          </CardTitle>
          <CardDescription className='text-base text-gray-900'>
            Review and accept the Ripple Talks terms to confirm your fireside
            chat.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-6'>
          {/* Terms box */}
          <div className='rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 space-y-3 text-sm text-gray-600 leading-relaxed'>
            <div className='flex items-center gap-2 text-gray-800 font-medium'>
              <FileText className='h-4 w-4 shrink-0' />
              Ripple Talks – Fireside Chat Terms
            </div>
            <p>
              By participating in this Ripple Talks fireside chat, you agree to
              the following:
            </p>
            <ul className='list-disc pl-5 space-y-1.5'>
              {/* <li>
                You agree to Ripple Talks&apos;{" "}
                <a href="#" className="underline text-blue-600 hover:text-blue-800">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline text-blue-600 hover:text-blue-800">
                  Privacy Policy
                </a>.
              </li> */}
              <li>
                You consent to Ripple Talks recording and producing a highlight
                video from the fireside chat session.
              </li>
              <li>
                You agree to Ripple Talks posting the highlight video on its
                platforms, championing you and your company as a thought leader.
              </li>
              <li>
                You understand that invited CEOs are guests of Ripple Talks and
                attendance is not guaranteed.
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <button
            type='button'
            onClick={() => setAgreed((v) => !v)}
            className='flex items-start gap-3 text-left group'
          >
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all",
                agreed
                  ? "bg-green-500 border-green-500"
                  : "bg-white border-gray-300 group-hover:border-green-400",
              )}
            >
              {agreed && (
                <CheckCircle2
                  className='h-3.5 w-3.5 text-white'
                  strokeWidth={3}
                />
              )}
            </div>
            <span className='text-sm text-gray-700'>
              I agree to Ripple Talks terms.
            </span>
          </button>

          {/* Navigation */}
          <div className='flex justify-between pt-2'>
            <Button
              onClick={onNext}
              disabled={!agreed}
              className='bg-green-600 hover:bg-green-700 disabled:opacity-40'
            >
              <CheckCircle2 className='h-4 w-4 mr-2' />
              Confirm &amp; Submit
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
