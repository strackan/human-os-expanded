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
 * - crm: Opportunities, pipelines, and deal tracking
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

// CRM tools
export {
  // Pipeline
  getPipelineStages,
  initializePipeline,
  getPipelineSummary,
  // Opportunities
  createOpportunity,
  updateOpportunity,
  getOpportunity,
  searchOpportunities,
  getContactOpportunities,
  // Activities
  addOpportunityActivity,
  // Products
  createProduct,
  searchProducts,
  // Line items
  addLineItem,
  // Account context
  upsertAccountContext,
  getAccountContext,
} from './crm-tools.js';

// Campaign tools
export {
  // Campaigns
  createCampaign,
  updateCampaign,
  getCampaign,
  searchCampaigns,
  // Members
  addCampaignMembers,
  updateMemberStatus,
  getCampaignMembers,
  getMembersToContact,
  removeCampaignMember,
  // Activities
  logCampaignActivity,
  // Conversion
  convertMemberToOpportunity,
} from './campaign-tools.js';
