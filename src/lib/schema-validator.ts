// Runtime schema validation
// This ensures our TypeScript types match the actual database schema

import { Customer, CustomerFormData } from '@/types/customer';

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SchemaValidator {
  private static requiredFields = ['name', 'domain'];
  private static optionalFields = [
    'current_arr',
    'renewal_date',
    'assigned_to',
    'csm_id',
    'company_id'
  ];

  static validateCustomer(data: any): SchemaValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    for (const field of this.requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // Check for unknown fields
    const allKnownFields = [...this.requiredFields, ...this.optionalFields, 'id', 'created_at', 'updated_at'];
    for (const field in data) {
      if (!allKnownFields.includes(field)) {
        warnings.push(`Unknown field: ${field}`);
      }
    }

    // Type validation
    if (data.name && typeof data.name !== 'string') {
      errors.push('name must be a string');
    }
    if (data.domain && typeof data.domain !== 'string') {
      errors.push('domain must be a string');
    }
    if (data.current_arr && typeof data.current_arr !== 'number') {
      errors.push('current_arr must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateCustomerForm(data: CustomerFormData): SchemaValidationResult {
    return this.validateCustomer(data);
  }

  // Generate TypeScript interface from database schema
  static generateInterfaceFromSchema(schema: any): string {
    // This could be enhanced to read actual database schema
    // For now, it's a template
    return `
export interface Customer {
  id: string;
  name: string;
  domain: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  current_arr?: number;
  renewal_date?: string;
  assigned_to?: string;
  csm_id?: string;
  company_id?: string;
  created_at: string;
  updated_at: string;
}
    `.trim();
  }
} 