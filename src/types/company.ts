// types/company.ts
export interface Company {
  id: string; // UUID string
  name: string;
  description?: string;
  logo_url?: string;
  industry_id?: string;
  website?: string;
}
