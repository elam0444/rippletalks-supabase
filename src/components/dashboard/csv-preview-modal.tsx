"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, FileText } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { CSVParseResult, TargetCompanyCSVRow } from "@/lib/csv-parser"

interface CSVPreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  parseResult: CSVParseResult<TargetCompanyCSVRow> | null
  onConfirmImport: () => void
  isImporting: boolean
}

export function CSVPreviewModal({
  open,
  onOpenChange,
  parseResult,
  onConfirmImport,
  isImporting,
}: CSVPreviewModalProps) {
  if (!parseResult) return null

  const { valid, invalid, totalRows } = parseResult
  const hasErrors = invalid.length > 0
  const allRowsInvalid = valid.length === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            CSV Import Preview
          </DialogTitle>
          <DialogDescription>
            Review the data before importing to your database
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted rounded-lg p-4">
              <div className="text-sm text-muted-foreground">Total Rows</div>
              <div className="text-2xl font-bold">{totalRows}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4">
              <div className="text-sm text-green-700 dark:text-green-300">
                Valid Rows
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {valid.length}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                Invalid Rows
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {invalid.length}
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {hasErrors && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {allRowsInvalid
                  ? "All rows have errors. Please fix the issues in your CSV file and try again."
                  : `${invalid.length} row${invalid.length > 1 ? "s" : ""} contain errors and will be skipped during import.`}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          <ScrollArea className="flex-1 border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Row</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Company</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Why</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Valid rows */}
                {valid.map((row) => (
                  <TableRow key={row.rowNumber}>
                    <TableCell className="font-medium">
                      {row.rowNumber}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Valid
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {row.data.targetCompanyName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.data.category}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {row.data.why || "-"}
                    </TableCell>
                    <TableCell>-</TableCell>
                  </TableRow>
                ))}

                {/* Invalid rows */}
                {invalid.map((error, index) => {
                  // Group errors by row number
                  const rowErrors = invalid.filter(
                    (e) => e.rowNumber === error.rowNumber
                  )
                  const isFirstErrorForRow =
                    invalid.findIndex((e) => e.rowNumber === error.rowNumber) ===
                    index

                  if (!isFirstErrorForRow) return null

                  return (
                    <TableRow key={`error-${error.rowNumber}`}>
                      <TableCell className="font-medium">
                        {error.rowNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Error
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">
                        {error.data.targetCompanyName ||
                          error.data["Target Company"] ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {error.data.category ||
                          error.data["Category"] ||
                          "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {error.data.why || error.data["Why"] || "-"}
                      </TableCell>
                      <TableCell className="text-red-600 dark:text-red-400">
                        <div className="space-y-1 text-sm">
                          {rowErrors.map((e, i) => (
                            <div key={i}>
                              {e.field && (
                                <span className="font-medium">{e.field}: </span>
                              )}
                              {e.message}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirmImport}
            disabled={allRowsInvalid || isImporting}
          >
            {isImporting
              ? "Importing..."
              : `Import ${valid.length} Valid Row${valid.length !== 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
