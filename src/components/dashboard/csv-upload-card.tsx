'use client'

import { useCallback, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CSVDropzone } from './csv-dropzone'
import { CSVPreviewModal } from './csv-preview-modal'
import { CSVResultsModal } from './csv-results-modal'
import {
  readCSVFile,
  validateTargetCompanyCSV,
  type CSVParseResult,
  type TargetCompanyCSVRow,
} from '@/lib/csv-parser'
import { importTargetCompaniesFromCSV, type BatchImportResult } from '@/lib/actions/csv-import'
import { toast } from 'sonner'

interface Company {
  id: string
  name: string
  logo_url?: string | null
}

interface CSVUploadCardProps {
  companies: Company[]
}

export function CSVUploadCard({ companies }: CSVUploadCardProps) {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  const [parseResult, setParseResult] = useState<CSVParseResult<TargetCompanyCSVRow> | null>(null)
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [resetDropzone, setResetDropzone] = useState(0)

  const handleFileSelect = useCallback(async (file: File) => {
    try {
      // Check if company is selected
      if (!selectedCompanyId) {
        toast.error('Please select a company before uploading a CSV file.')
        return
      }

      // Read and parse CSV file
      const csvText = await readCSVFile(file)
      const result = validateTargetCompanyCSV(csvText)

      // Show preview modal
      setParseResult(result)
      setShowPreviewModal(true)

      toast.success(`Found ${result.totalRows} rows: ${result.valid.length} valid, ${result.invalid.length} invalid`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to parse CSV file')
    }
  }, [selectedCompanyId])

  const handleConfirmImport = async () => {
    if (!parseResult || !selectedCompanyId) return

    setIsImporting(true)

    try {
      // Prepare data for import
      const rowsToImport = parseResult.valid.map((row) => ({
        rowNumber: row.rowNumber,
        data: row.data,
      }))

      // Import to database
      const result = await importTargetCompaniesFromCSV(selectedCompanyId, rowsToImport)

      // Close preview modal, show results modal
      setShowPreviewModal(false)
      setImportResult(result)
      setShowResultsModal(true)

      // Show toast
      if (result.success) {
        toast.success(`Successfully imported ${result.successCount} target compan${result.successCount !== 1 ? 'ies' : 'y'}`)
      } else {
        toast.error(result.error || `${result.failureCount} row(s) failed to import`)
      }

      // Clear parse result after successful import
      if (result.success) {
        setParseResult(null)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import CSV data')
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const csvContent = `Target Company,Category,Why
BlueRiver Analytics,Channel Partner,Potential for co-selling opportunities.
BrightWave Media,Influencer,Large industry following and brand influence.
Skyline Ventures,Prospect,High growth potential and strategic fit.
TechNext Solutions,Channel Partner,Complementary services offering.
Insight Leaders,Influencer,Can drive awareness through thought leadership.
FusionWorks,Prospect,Matches our ideal customer profile.`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'target-companies-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('CSV template downloaded successfully')
  }

  const handleDownloadErrorReport = () => {
    if (!importResult) return

    const failedRows = importResult.results.filter((r) => !r.success)
    const csvContent = [
      'Row,Target Company,Error',
      ...failedRows.map((row) =>
        `${row.rowNumber},"${row.targetCompanyName}","${row.error || 'Unknown error'}"`
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'import-errors.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success('Error report downloaded successfully')
  }

  const handleResultsModalClose = (open: boolean) => {
    setShowResultsModal(open)

    // When closing the results modal after a successful import, reset everything
    if (!open && importResult?.success) {
      setSelectedCompanyId('')
      setImportResult(null)
      setResetDropzone(prev => prev + 1) // Trigger dropzone reset
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            Import target companies from a CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Company Selection */}
          <div className="space-y-2">
            <Label htmlFor="company-select">Select Company</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger id="company-select">
                <SelectValue placeholder="Choose a company..." />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              CSV rows will be imported as target companies for this company
            </p>
          </div>

          {/* CSV Dropzone */}
          <CSVDropzone
            key={resetDropzone}
            onFileSelect={handleFileSelect}
            disabled={!selectedCompanyId}
            onDownloadTemplate={handleDownloadTemplate}
          />
        </CardContent>
      </Card>

      {/* Preview Modal */}
      <CSVPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
        parseResult={parseResult}
        onConfirmImport={handleConfirmImport}
        isImporting={isImporting}
      />

      {/* Results Modal */}
      <CSVResultsModal
        open={showResultsModal}
        onOpenChange={handleResultsModalClose}
        importResult={importResult}
        onDownloadReport={handleDownloadErrorReport}
      />
    </>
  )
}
