/**
 * GuyForThat Tools
 *
 * CRM and contact/company management tools.
 * These tools are part of the GuyForThat platform under Human-OS.
 *
 * Categories:
 * - contacts: Contact context and profile management
 * - companies: Company context and profile management
 * - storage: Expert corpus management in Supabase Storage
 * - engagement: Post engagement tracking and analytics
 */

// Contact tools
export {
  getContactContext,
  storeContactContext,
  getFullContactProfile,
  searchContacts,
} from './contacts.js';

// Company tools
export {
  getCompanyContext,
  storeCompanyContext,
  getFullCompanyProfile,
  searchCompanies,
} from './companies.js';

// Storage tools
export {
  listExperts,
  listSources,
  readSource,
  readFile,
  writeFile,
  getSourcesIndex,
  searchKnowledge,
} from './storage.js';

// Engagement tools
export {
  savePostEngagers,
  getTopPostEngagers,
  getPostEngagementStats,
  listTrackedPosts,
} from './engagement.js';
