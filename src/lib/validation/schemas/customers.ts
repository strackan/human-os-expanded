/**
 * Customer Validation Schemas
 *
 * Zod schemas for customer-related API endpoints.
 */

import { z } from 'zod';
import { CommonValidators } from '../helpers';

/**
 * Schema for creating a new customer
 * POST /api/customers
 */
export const CreateCustomerSchema = z.object({
  name: CommonValidators.nonEmptyString(),
  domain: z.string().optional(),
  industry: CommonValidators.nonEmptyString().optional(),
  healthScore: z.number().int().min(0).max(100).optional(),
  renewalDate: CommonValidators.isoDate().optional(),
  currentArr: z.number().nonnegative().optional(),
  assignedTo: CommonValidators.uuid().optional(),
});

/**
 * Schema for updating a customer
 * PATCH /api/customers/[id]
 */
export const UpdateCustomerSchema = z.object({
  name: CommonValidators.nonEmptyString().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  healthScore: z.number().int().min(0).max(100).optional(),
  renewalDate: CommonValidators.isoDate().optional(),
  currentArr: z.number().nonnegative().optional(),
  assignedTo: CommonValidators.uuid().optional(),
});

/**
 * Schema for customer query parameters
 * GET /api/customers
 */
export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  healthScoreMin: z.string().regex(/^\d+$/).transform(Number).optional(),
  healthScoreMax: z.string().regex(/^\d+$/).transform(Number).optional(),
  minARR: z.string().regex(/^\d+$/).transform(Number).optional(),
  assignedTo: CommonValidators.uuid().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

/**
 * Schema for adding customer contact
 * POST /api/customers/[id]/contacts
 */
export const AddCustomerContactSchema = z.object({
  name: CommonValidators.nonEmptyString(),
  email: CommonValidators.email(),
  role: CommonValidators.nonEmptyString().optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});
