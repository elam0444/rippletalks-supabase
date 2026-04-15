// components/dashboard/export-sheet-button.tsx
"use client";

import { useState } from "react";
import { FileSpreadsheet, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportPipelineToXlsx } from "@/lib/actions/export-sheet";
import { toast } from "sonner";

interface Props {
  companyId: string;
  companyName: string;
}

export function ExportSheetButton({ companyId, companyName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    const result = await exportPipelineToXlsx(companyId, companyName);

    if (result.success) {
      // Reconstruct the buffer client-side and trigger download
      const blob = new Blob([new Uint8Array(result.buffer)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `${companyName.replace(/\s+/g, "_")}_pipeline_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export ready", {
        description: `${companyName} pipeline downloaded.`,
      });
    } else {
      toast.error("Export failed", { description: result.error });
    }

    setLoading(false);
  }

  return (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 cursor-pointer"
        onClick={handleExport}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
        )}
        {loading ? "Exporting…" : "Export Sheet"}
      </Button>
    </div>
  );
}
