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
}

export interface Contact {
  id: string;
  name: string;
  email?: string;
  title?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ContactDate {
  available_date: string;
  is_selected: boolean;
}

export interface BrowseCompany {
  id: string;
  name: string;
  description?: string;
}

export interface Industry {
  id: string;
  name: string;
}
