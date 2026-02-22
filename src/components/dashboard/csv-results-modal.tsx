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
import { AlertCircle, CheckCircle2, Download, PartyPopper } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { BatchImportResult } from "@/lib/actions/csv-import"

interface CSVResultsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importResult: BatchImportResult | null
  onDownloadReport?: () => void
}

export function CSVResultsModal({
  open,
  onOpenChange,
  importResult,
  onDownloadReport,
}: CSVResultsModalProps) {
  if (!importResult) return null

  const { totalRows, successCount, failureCount, results, error } = importResult
  const hasErrors = failureCount > 0
  const allFailed = successCount === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {allFailed ? (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                Import Failed
              </>
            ) : (
              <>
                <PartyPopper className="h-5 w-5 text-green-500" />
                Import Complete
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {allFailed
              ? "No rows were imported. Please review the errors below."
              : hasErrors
                ? `${successCount} row${successCount !== 1 ? "s" : ""} imported successfully, ${failureCount} failed.`
                : `All ${successCount} row${successCount !== 1 ? "s were" : " was"} imported successfully!`}
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
                Imported
              </div>
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {successCount}
              </div>
            </div>
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4">
              <div className="text-sm text-red-700 dark:text-red-300">
                Failed
              </div>
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {failureCount}
              </div>
            </div>
          </div>

          {/* Global Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Alert */}
          {!allFailed && !hasErrors && (
            <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                Success!
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                All target companies have been imported successfully.
              </AlertDescription>
            </Alert>
          )}

          {/* Results Table */}
          {results.length > 0 && (
            <ScrollArea className="flex-1 border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Row</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Company</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result.rowNumber}>
                      <TableCell className="font-medium">
                        {result.rowNumber}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800"
                          >
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {result.targetCompanyName}
                      </TableCell>
                      <TableCell>
                        {result.success ? (
                          <span className="text-green-600 dark:text-green-400 text-sm">
                            Successfully imported
                          </span>
                        ) : (
                          <span className="text-red-600 dark:text-red-400 text-sm">
                            {result.error}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className="gap-2">
          {hasErrors && onDownloadReport && (
            <Button variant="outline" onClick={onDownloadReport}>
              <Download className="h-4 w-4 mr-2" />
              Download Error Report
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
