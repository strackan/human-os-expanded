import { createClient } from '@/lib/supabase';
import { Customer, CustomerWithContact, Contact, CustomerFilters, CustomerSortOptions } from '../../types/customer';
import type { SupabaseClient } from '@supabase/supabase-js';

export class CustomerService {
  /**
   * Get all customers with optional filtering and pagination
   */
  static async getCustomers(
    filters: CustomerFilters = {},
    sort: CustomerSortOptions = { field: 'name', direction: 'asc' },
    page: number = 1,
    limit: number = 50,
    supabaseClient?: SupabaseClient
  ): Promise<{ customers: CustomerWithContact[]; total: number }> {
    try {
      // Use provided client or create a new one
      const supabase = supabaseClient || createClient();
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          primary_contact:contacts!primary_contact_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            title,
            company_id,
            is_primary,
            created_at,
            updated_at
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.industry) {
        query = query.eq('industry', filters.industry);
      }
      if (filters.health_score_min !== undefined) {
        query = query.gte('health_score', filters.health_score_min);
      }
      if (filters.health_score_max !== undefined) {
        query = query.lte('health_score', filters.health_score_max);
      }
      if (filters.current_arr_min !== undefined) {
        query = query.gte('current_arr', filters.current_arr_min);
      }
      if (filters.renewal_date_from) {
        query = query.gte('renewal_date', filters.renewal_date_from);
      }
      if (filters.renewal_date_to) {
        query = query.lte('renewal_date', filters.renewal_date_to);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,industry.ilike.%${filters.search}%`);
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' });

      // Apply pagination and get count
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching customers:', error);
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }

      // Transform data to match CustomerWithContact interface
      const customersWithContact: CustomerWithContact[] = (data || []).map(customer => ({
        ...customer,
        primary_contact: customer.primary_contact || undefined
      }));

      return {
        customers: customersWithContact,
        total: count || 0
      };
    } catch (error) {
      console.error('CustomerService.getCustomers error:', error);
      throw error;
    }
  }

  /**
   * Get a single customer by ID with related data
   */
  static async getCustomerById(id: string): Promise<CustomerWithContact | null> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          primary_contact:contacts!primary_contact_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            title,
            company_id,
            is_primary,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Customer not found
        }
        console.error('Error fetching customer:', error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      // Transform data to match CustomerWithContact interface
      const customerWithContact: CustomerWithContact = {
        ...data,
        primary_contact: data.primary_contact || undefined
      };

      return customerWithContact;
    } catch (error) {
      console.error('CustomerService.getCustomerById error:', error);
      throw error;
    }
  }

  /**
   * Get a customer by customer key (URL-friendly name)
   */
  static async getCustomerByKey(customerKey: string, supabaseClient?: SupabaseClient): Promise<CustomerWithContact | null> {
    try {
      // Use provided client or create a new one
      const supabase = supabaseClient || createClient();
      
      // First, try to find by exact name match (for backward compatibility)
      let { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          primary_contact:contacts!primary_contact_id (
            id,
            first_name,
            last_name,
            email,
            phone,
            title,
            company_id,
            is_primary,
            created_at,
            updated_at
          )
        `)
        .eq('name', customerKey)
        .single();

      // If not found by exact match, try case-insensitive match for common variations
      if (error && error.code === 'PGRST116') {
        // Try case-insensitive exact match first
        const { data: caseInsensitiveData, error: caseInsensitiveError } = await supabase
          .from('customers')
          .select(`
            *,
            primary_contact:contacts!primary_contact_id (
              id,
              first_name,
              last_name,
              email,
              phone,
              title,
              company_id,
              is_primary,
              created_at,
              updated_at
            )
          `)
          .ilike('name', customerKey)
          .single();

        if (!caseInsensitiveError && caseInsensitiveData) {
          data = caseInsensitiveData;
          error = null;
        } else {
          // Last resort: get only names and IDs to find by slug match (much more efficient)
          const { data: customerNames, error: namesError } = await supabase
            .from('customers')
            .select('id, name');

          if (!namesError && customerNames) {
            const foundCustomer = customerNames.find(customer => 
              this.createSlug(customer.name) === customerKey.toLowerCase()
            );

            if (foundCustomer) {
              // Now get the full customer data for the found customer
              const { data: fullCustomerData, error: fullCustomerError } = await supabase
                .from('customers')
                .select(`
                  *,
                  primary_contact:contacts!primary_contact_id (
                    id,
                    first_name,
                    last_name,
                    email,
                    phone,
                    title,
                    company_id,
                    is_primary,
                    created_at,
                    updated_at
                  )
                `)
                .eq('id', foundCustomer.id)
                .single();

              if (!fullCustomerError && fullCustomerData) {
                data = fullCustomerData;
                error = null;
              }
            }
          }
        }
      }

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Customer not found
        }
        console.error('Error fetching customer by key:', error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      if (!data) {
        return null;
      }

      // Transform data to match CustomerWithContact interface
      const customerWithContact: CustomerWithContact = {
        ...data,
        primary_contact: data.primary_contact || undefined
      };

      return customerWithContact;
    } catch (error) {
      console.error('CustomerService.getCustomerByKey error:', error);
      throw error;
    }
  }

  /**
   * Create a URL-friendly slug from a customer name
   */
  private static createSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check if a customer name/slug conflicts with existing customers
   */
  static async checkSlugConflict(name: string, excludeId?: string, supabaseClient?: SupabaseClient): Promise<boolean> {
    try {
      const slug = this.createSlug(name);
      const existingCustomer = await this.getCustomerByKey(slug, supabaseClient);
      
      // If no existing customer found, no conflict
      if (!existingCustomer) {
        return false;
      }
      
      // If we're excluding a specific ID (for updates), check if it's the same customer
      if (excludeId && existingCustomer.id === excludeId) {
        return false;
      }
      
      return true; // Conflict found
    } catch (error) {
      console.error('CustomerService.checkSlugConflict error:', error);
      throw error;
    }
  }

  /**
   * Generate alternative customer names when conflicts occur
   */
  static async generateAlternativeName(baseName: string, excludeId?: string, supabaseClient?: SupabaseClient): Promise<string> {
    try {
      let counter = 1;
      let alternativeName = baseName;
      
      // Keep trying until we find a non-conflicting name
      while (await this.checkSlugConflict(alternativeName, excludeId, supabaseClient)) {
        counter++;
        alternativeName = `${baseName} ${counter}`;
        
        // Prevent infinite loops
        if (counter > 100) {
          throw new Error('Unable to generate a unique customer name after 100 attempts');
        }
      }
      
      return alternativeName;
    } catch (error) {
      console.error('CustomerService.generateAlternativeName error:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: Partial<Customer>, supabaseClient?: SupabaseClient): Promise<Customer> {
    try {
      // Use provided client or create a new one
      const supabase = supabaseClient || createClient();
      
      // Validate that customer name is provided
      if (!customerData.name) {
        throw new Error('Customer name is required');
      }
      
      // Check for slug uniqueness before creating
      const hasConflict = await this.checkSlugConflict(customerData.name, undefined, supabase);
      
      if (hasConflict) {
        const slug = this.createSlug(customerData.name);
        const suggestedName = await this.generateAlternativeName(customerData.name, undefined, supabase);
        throw new Error(`A customer with a similar name already exists. The URL slug "${slug}" is already taken. Suggested alternative: "${suggestedName}"`);
      }
      
      const { data, error } = await supabase
        .from('customers')
        .insert(customerData)
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        throw new Error(`Failed to create customer: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CustomerService.createCustomer error:', error);
      throw error;
    }
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      // If name is being updated, check for slug conflicts
      if (updates.name) {
        const hasConflict = await this.checkSlugConflict(updates.name, id);
        
        if (hasConflict) {
          const slug = this.createSlug(updates.name);
          const suggestedName = await this.generateAlternativeName(updates.name, id);
          throw new Error(`A customer with a similar name already exists. The URL slug "${slug}" is already taken. Suggested alternative: "${suggestedName}"`);
        }
      }
      
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating customer:', error);
        throw new Error(`Failed to update customer: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('CustomerService.updateCustomer error:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: string): Promise<void> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting customer:', error);
        throw new Error(`Failed to delete customer: ${error.message}`);
      }
    } catch (error) {
      console.error('CustomerService.deleteCustomer error:', error);
      throw error;
    }
  }

  /**
   * Get customer statistics
   */
  static async getCustomerStats(): Promise<{
    total: number;
    byIndustry: Record<string, number>;
    averageHealthScore: number;
    totalARR: number;
  }> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('customers')
        .select('industry, health_score, current_arr');

      if (error) {
        console.error('Error fetching customer stats:', error);
        throw new Error(`Failed to fetch customer stats: ${error.message}`);
      }

      const customers = data || [];
      const total = customers.length;
      
      const byIndustry: Record<string, number> = {};
      let totalHealthScore = 0;
      let totalARR = 0;

      customers.forEach(customer => {
        // Count by industry
        if (customer.industry) {
          byIndustry[customer.industry] = (byIndustry[customer.industry] || 0) + 1;
        }
        
        // Sum health scores
        if (customer.health_score) {
          totalHealthScore += customer.health_score;
        }
        
        // Sum ARR
        if (customer.current_arr) {
          totalARR += Number(customer.current_arr);
        }
      });

      return {
        total,
        byIndustry,
        averageHealthScore: total > 0 ? Math.round(totalHealthScore / total) : 0,
        totalARR
      };
    } catch (error) {
      console.error('CustomerService.getCustomerStats error:', error);
      throw error;
    }
  }
}
