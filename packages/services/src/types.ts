/**
 * Shared types for service layer
 */

import type { OperationContext } from '@human-os/core';

/**
 * Context passed to all service methods.
 * Alias for OperationContext for backwards compatibility.
 */
export type ServiceContext = OperationContext;

// Re-export for consumers that import from services
export type { OperationContext } from '@human-os/core';

/**
 * Standard service result wrapper
 */
export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}
