'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CSVDropzoneProps {
  onFileSelect: (file: File) => void
  className?: string
  disabled?: boolean
  onDownloadTemplate?: () => void
}

export function CSVDropzone({ onFileSelect, className, disabled = false, onDownloadTemplate }: CSVDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file)
        onFileSelect(file)
      } else {
        alert('Please select a CSV file')
      }
    },
    [onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile]
  )

  const handleClick = useCallback(() => {
    if (disabled) return
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFile(file)
      }
    }
    input.click()
  }, [handleFile, disabled])

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors',
        isDragging && !disabled
          ? 'border-primary bg-primary/5'
          : 'border-muted-foreground/25 hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      onDragOver={disabled ? undefined : handleDragOver}
      onDragLeave={disabled ? undefined : handleDragLeave}
      onDrop={disabled ? undefined : handleDrop}
    >
      {onDownloadTemplate && (
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="text-xs text-primary hover:underline"
          >
            Download template.csv
          </button>
        </div>
      )}

      <svg
        className="mb-4 h-10 w-10 text-muted-foreground"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>

      {selectedFile ? (
        <div className="text-center">
          <p className="text-sm font-medium">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(2)} KB
          </p>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Drag and drop your CSV file here, or
          </p>
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={handleClick}
        disabled={disabled}
      >
        {selectedFile ? 'Choose Different File' : 'Browse Files'}
      </Button>
    </div>
  )
}
