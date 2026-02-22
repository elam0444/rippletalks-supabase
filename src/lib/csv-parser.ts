import { z } from "zod";

// Types for CSV parsing results
export interface CSVRow {
  rowNumber: number;
  data: Record<string, string>;
}

export interface ValidationError {
  rowNumber: number;
  field?: string;
  message: string;
  data: Record<string, string>;
}

export interface ValidatedRow<T> {
  rowNumber: number;
  data: T;
  originalData: Record<string, string>;
}

export interface CSVParseResult<T> {
  valid: ValidatedRow<T>[];
  invalid: ValidationError[];
  totalRows: number;
}

// Schema for target company CSV rows
export const targetCompanyCSVSchema = z.object({
  targetCompanyName: z.string().min(1, "Target company name is required"),
  category: z.enum(["Channel Partner", "Influencer", "Prospect"], {
    message: "Category must be 'Channel Partner', 'Influencer', or 'Prospect'"
  }),
  why: z.string().optional(),
});

export type TargetCompanyCSVRow = z.infer<typeof targetCompanyCSVSchema>;

/**
 * Parse CSV text into rows
 */
export function parseCSVText(csvText: string): CSVRow[] {
  const lines = csvText.split('\n').filter(line => line.trim());

  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  if (headers.length === 0) {
    throw new Error("CSV file has no headers");
  }

  // Parse data rows
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Skip empty rows
    if (values.every(v => !v.trim())) {
      continue;
    }

    const data: Record<string, string> = {};
    headers.forEach((header, index) => {
      data[header.trim()] = values[index]?.trim() || '';
    });

    rows.push({
      rowNumber: i + 1, // +1 because row 1 is headers
      data,
    });
  }

  return rows;
}

/**
 * Parse a single CSV line, handling quoted values with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current);

  return result;
}

/**
 * Map CSV headers to expected field names
 */
function mapTargetCompanyHeaders(data: Record<string, string>): Record<string, string> {
  const headerMap: Record<string, string> = {
    'Target Company': 'targetCompanyName',
    'target company': 'targetCompanyName',
    'company': 'targetCompanyName',
    'Company': 'targetCompanyName',
    'name': 'targetCompanyName',
    'Name': 'targetCompanyName',

    'Category': 'category',
    'category': 'category',
    'type': 'category',
    'Type': 'category',

    'Why': 'why',
    'why': 'why',
    'reason': 'why',
    'Reason': 'why',
    'notes': 'why',
    'Notes': 'why',
  };

  const mapped: Record<string, string> = {};

  for (const [key, value] of Object.entries(data)) {
    const mappedKey = headerMap[key] || key;
    mapped[mappedKey] = value;
  }

  return mapped;
}

/**
 * Validate target company CSV rows
 */
export function validateTargetCompanyCSV(csvText: string): CSVParseResult<TargetCompanyCSVRow> {
  try {
    const rows = parseCSVText(csvText);
    const valid: ValidatedRow<TargetCompanyCSVRow>[] = [];
    const invalid: ValidationError[] = [];

    for (const row of rows) {
      // Map headers to expected field names
      const mappedData = mapTargetCompanyHeaders(row.data);

      // Validate with Zod schema
      const result = targetCompanyCSVSchema.safeParse(mappedData);

      if (result.success) {
        valid.push({
          rowNumber: row.rowNumber,
          data: result.data,
          originalData: row.data,
        });
      } else {
        // Collect all validation errors for this row
        const errors = result.error.issues;
        errors.forEach((error) => {
          invalid.push({
            rowNumber: row.rowNumber,
            field: error.path.map(String).join('.'),
            message: error.message,
            data: row.data,
          });
        });
      }
    }

    return {
      valid,
      invalid,
      totalRows: rows.length,
    };
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Read CSV file and return text content
 */
export async function readCSVFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        resolve(text);
      } else {
        reject(new Error('Failed to read file as text'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}
