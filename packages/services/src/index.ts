/**
 * @human-os/services
 *
 * Shared service layer for Human OS.
 * Used by both MCP tools and REST API to ensure single implementation.
 *
 * Adding a new capability:
 * 1. Add method to appropriate service
 * 2. MCP tool calls the service
 * 3. REST endpoint calls the same service
 * 4. Both stay in sync automatically
 */

export { QueueService } from './queue-service.js';
export { TaskService } from './task-service.js';
export { AliasService } from './alias-service.js';
export { TranscriptService } from './transcript-service.js';
export { ActivationKeyService } from './activation-service.js';
export { getIdentityProfile, updateIdentityProfile } from './identity-service.js';
export { ContactService } from './contact-service.js';

export type { ServiceContext, ServiceResult } from './types.js';
export type {
  IdentityProfile,
  IdentityProfileUpdate,
  ThemeEntry,
} from './identity-service.js';
export type {
  ActivationKeyResult,
  ValidationResult,
  ClaimResult,
  CreateActivationKeyOptions,
} from './activation-service.js';
export type { QueueItem, QueueItemInput, QueueItemUpdate, QueueResult, ProcessResult } from './queue-service.js';
export type { Task, TaskInput, TaskUpdateInput, TaskResult, TaskListResult } from './task-service.js';
export type { Alias, AliasInput, AliasUpdateInput, AliasResult, AliasListResult } from './alias-service.js';
export type {
  UnifiedContact,
  UnifiedCompany,
  UpsertContactInput,
  UpsertCompanyInput,
  SearchContactsInput,
} from './contact-service.js';
export type {
  Participant,
  ActionItem,
  NotableQuote,
  CallType,
  TranscriptSource,
  TranscriptInput,
  TranscriptRow,
  TranscriptSummary,
  TranscriptSearchResult,
  TranscriptDetail,
  IngestResult,
  ListResult as TranscriptListResult,
  SearchResult as TranscriptSearchResults,
  ListParams as TranscriptListParams,
  SearchParams as TranscriptSearchParams,
} from './transcript-service.js';
