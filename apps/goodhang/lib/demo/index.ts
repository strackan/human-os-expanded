/**
 * Good Hang Demo Library
 *
 * Multi-mode semantic search across a trusted 100-person network.
 */

// Search engine
export {
  NetworkSearchEngine,
  createSearchEngine,
  type SearchMode,
  type SearchFilters,
  type SearchRequest,
  type SearchResult,
  type SearchAction,
  type SearchResponse,
} from './search';

// Action engine
export {
  ActionEngine,
  createActionEngine,
  type ActionContext,
  type DraftIntroRequest,
  type DraftIntroResponse,
  type ScheduleMeetingRequest,
  type ScheduleMeetingResponse,
  type SaveToListRequest,
  type SaveToListResponse,
  type RequestIntroRequest,
  type RequestIntroResponse,
} from './actions';
