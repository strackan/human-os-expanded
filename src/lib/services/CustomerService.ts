import { createClient } from '@/lib/supabase';
import { Customer, CustomerWithContact, Contact, CustomerFilters, CustomerSortOptions } from '../../types/customer';

export class CustomerService {
  /**
   * Get all customers with optional filtering and pagination
   */
  static async getCustomers(
    filters: CustomerFilters = {},
    sort: CustomerSortOptions = { field: 'name', direction: 'asc' },
    page: number = 1,
    limit: number = 50
  ): Promise<{ customers: CustomerWithContact[]; total: number }> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      let query = supabase
        .from('customers')
        .select(`
          *,
          contacts:primary_contact_id (
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
        `);

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

      // Apply pagination
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
        primary_contact: customer.contacts || undefined
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
          contacts:primary_contact_id (
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
        primary_contact: data.contacts || undefined
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
  static async getCustomerByKey(customerKey: string): Promise<CustomerWithContact | null> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('customers')
        .select(`
          *,
          contacts:primary_contact_id (
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

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Customer not found
        }
        console.error('Error fetching customer by key:', error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }

      // Transform data to match CustomerWithContact interface
      const customerWithContact: CustomerWithContact = {
        ...data,
        primary_contact: data.contacts || undefined
      };

      return customerWithContact;
    } catch (error) {
      console.error('CustomerService.getCustomerByKey error:', error);
      throw error;
    }
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      // Use the authenticated client from the AuthProvider
      const supabase = createClient();
      
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
