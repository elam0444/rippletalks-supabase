'use client';

import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CSVDropzone } from './csv-dropzone';

export function CSVUploadCard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback((file: File) => {
    setUploadedFile(file);
    // TODO: Process the CSV file here
    console.log('CSV file selected:', file.name);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV</CardTitle>
        <CardDescription>Import data by uploading a CSV file</CardDescription>
      </CardHeader>
      <CardContent>
        <CSVDropzone onFileSelect={handleFileSelect} />
        {uploadedFile && (
          <p className="mt-4 text-sm text-muted-foreground">
            Ready to process: {uploadedFile.name}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
