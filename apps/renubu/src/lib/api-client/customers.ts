/**
 * Customers API Client
 *
 * Operations for customer management.
 */

import { apiFetch } from './index';
import { API_ROUTES } from '@/lib/constants/api-routes';
import type {
  Customer,
  CustomerFilters,
  CustomerSortOptions,
  PaginatedResponse,
  ApiResponse,
} from './types';

// =====================================================
// Response Types
// =====================================================

interface CustomersListResponse {
  customers: Customer[];
  page: number;
  pageSize: number;
  count: number;
  totalPages: number;
}

interface CustomerDetailResponse {
  customer: Customer;
}

// =====================================================
// Customers API
// =====================================================

export const customersApi = {
  /**
   * List customers with filters and pagination
   */
  async list(
    filters: CustomerFilters = {},
    sort: CustomerSortOptions = { field: 'name', direction: 'asc' },
    page = 1,
    pageSize = 25
  ): Promise<ApiResponse<CustomersListResponse>> {
    return apiFetch<CustomersListResponse>(API_ROUTES.CUSTOMERS.LIST, {
      params: {
        ...filters,
        sort: sort.field,
        order: sort.direction,
        page,
        pageSize,
      },
    });
  },

  /**
   * Get customer by ID
   */
  async getById(id: string): Promise<ApiResponse<CustomerDetailResponse>> {
    return apiFetch<CustomerDetailResponse>(API_ROUTES.CUSTOMERS.BY_ID(id));
  },

  /**
   * Get customer contacts
   */
  async getContacts(customerId: string): Promise<ApiResponse<unknown[]>> {
    return apiFetch<unknown[]>(API_ROUTES.CUSTOMERS.CONTACTS(customerId));
  },

  /**
   * Get customer metrics
   */
  async getMetrics(customerId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.CUSTOMERS.METRICS(customerId));
  },

  /**
   * Get customer properties
   */
  async getProperties(customerId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.CUSTOMERS.PROPERTIES(customerId));
  },

  /**
   * Get customer account plan
   */
  async getAccountPlan(customerId: string): Promise<ApiResponse<Record<string, unknown>>> {
    return apiFetch<Record<string, unknown>>(API_ROUTES.CUSTOMERS.ACCOUNT_PLAN(customerId));
  },

  /**
   * Create a new customer
   */
  async create(customer: Partial<Customer>): Promise<ApiResponse<CustomerDetailResponse>> {
    return apiFetch<CustomerDetailResponse>(API_ROUTES.CUSTOMERS.LIST, {
      method: 'POST',
      body: customer,
    });
  },

  /**
   * Update a customer
   */
  async update(
    id: string,
    updates: Partial<Customer>
  ): Promise<ApiResponse<CustomerDetailResponse>> {
    return apiFetch<CustomerDetailResponse>(API_ROUTES.CUSTOMERS.BY_ID(id), {
      method: 'PATCH',
      body: updates,
    });
  },
};
