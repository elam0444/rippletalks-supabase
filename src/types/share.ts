/**
 * Shared type definitions for the share feature
 */

export interface Company {
  id: string;
  name: string;
  description?: string;
  why?: string;
  note?: string;
  selected?: boolean;
  relationship_category?: string;
  logo_url?: string | null;
  website?: string | null;
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  title?: string;
  phone?: string;
  avatar_url?: string;
  panelist_type?: string;
}

export interface ContactDate {
  available_date: string;
  is_selected: boolean;
}

export interface BrowseCompany {
  id: string;
  name: string;
  description?: string;
  logo_url?: string | null;
  website?: string | null;
}

export interface Industry {
  id: string;
  name: string;
}
