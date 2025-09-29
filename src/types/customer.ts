// Customer types for the MVP schema
// These types match the database structure defined in the migrations

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  title?: string;
  customer_id: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  domain?: string;
  industry: string;
  health_score: number;
  current_arr: number;
  renewal_date: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerWithContact extends Customer {
  primary_contact?: Contact;
}

export interface Renewal {
  id: string;
  customer_id: string;
  renewal_date: string;
  current_arr: number;
  proposed_arr?: number;
  probability: number;
  stage: string;
  risk_level: string;
  assigned_to?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  renewal_id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  customer_id: string;
  user_id?: string;
  event_date: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  customer_id: string;
  renewal_id?: string;
  user_id?: string;
  content: string;
  note_type: 'general' | 'meeting' | 'call' | 'email' | 'risk';
  created_at: string;
  updated_at: string;
}

// API response types
export interface CustomerListResponse {
  customers: CustomerWithContact[];
  total: number;
  page: number;
  limit: number;
}

export interface CustomerResponse {
  customer: CustomerWithContact;
  renewals: Renewal[];
  tasks: Task[];
  events: Event[];
  notes: Note[];
}

// Filter and search types
export interface CustomerFilters {
  industry?: string;
  health_score_min?: number;
  health_score_max?: number;
  current_arr_min?: number;
  renewal_date_from?: string;
  renewal_date_to?: string;
  search?: string;
}

export interface CustomerSortOptions {
  field: keyof Customer;
  direction: 'asc' | 'desc';
} 