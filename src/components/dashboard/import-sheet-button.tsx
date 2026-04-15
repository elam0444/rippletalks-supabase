"use client";

import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importPipelineFromXlsx } from "@/lib/actions/import-sheet";
import { useRef, useTransition } from "react";

export function ImportSheetButton({ companyId }: { companyId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  /**
   * Handles the file upload process.
   * Converts the file to an ArrayBuffer to pass to the server action.
   */
  const handleFile = async (file: File) => {
    // DON'T convert to arrayBuffer anymore
    // const buffer = await file.arrayBuffer();

    startTransition(async () => {
      try {
        // Package the raw File object into FormData
        const formData = new FormData();
        formData.append("file", file);

        // Pass the formData to the server action
        const res = await importPipelineFromXlsx(companyId, formData);

        if (res.success) {
          alert(`Success! Processed ${res.count} items.`);
        } else {
          alert(`Error: ${res.error}`);
        }
      } catch (e) {
        console.error("Import Error:", e);
        alert("An unexpected error occurred.");
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <div className="flex justify-end gap-2 pt-4">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <Button
        variant="outline"
        size="sm"
        className="cursor-pointer"
        onClick={() => inputRef.current?.click()}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Upload className="h-4 w-4 mr-2 text-green-600" />
        )}
        {isPending ? "Importing..." : "Import"}
      </Button>
    </div>
  );
}
