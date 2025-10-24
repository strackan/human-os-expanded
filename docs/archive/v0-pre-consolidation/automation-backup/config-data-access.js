/**
 * Configuration Data Access Layer
 *
 * Provides functions to read/write workflow configuration from database
 * Includes caching strategy to minimize database queries
 */

const Database = require('better-sqlite3');
const path = require('path');
const { randomUUID } = require('crypto');

// Database connection
const dbPath = path.join(__dirname, 'renubu-test.db');
const db = new Database(dbPath);

// ============================================================================
// Caching Strategy
// ============================================================================
// Cache configuration for 5 minutes to reduce database load
// Use getAllConfig() to load entire config into memory at startup

const CONFIG_CACHE = {
  data: null,
  lastLoaded: null,
  ttl: 5 * 60 * 1000 // 5 minutes in milliseconds
};

function isCacheValid() {
  if (!CONFIG_CACHE.data || !CONFIG_CACHE.lastLoaded) {
    return false;
  }
  const now = Date.now();
  return (now - CONFIG_CACHE.lastLoaded) < CONFIG_CACHE.ttl;
}

function invalidateCache() {
  CONFIG_CACHE.data = null;
  CONFIG_CACHE.lastLoaded = null;
}

// ============================================================================
// Plans - Get plan types
// ============================================================================

/**
 * Get all active plan types
 * @returns {Array} Array of plan objects
 */
function getAllPlans() {
  const stmt = db.prepare(`
    SELECT * FROM plans
    WHERE active = 1
    ORDER BY display_order
  `);
  return stmt.all();
}

/**
 * Get a specific plan by key
 * @param {string} planKey - Plan key (renewal, strategic, risk, opportunity)
 * @returns {Object|null} Plan object or null if not found
 */
function getPlanByKey(planKey) {
  const stmt = db.prepare(`
    SELECT * FROM plans
    WHERE plan_key = ? AND active = 1
  `);
  return stmt.get(planKey);
}

/**
 * Get a plan by ID
 * @param {string} planId - Plan ID
 * @returns {Object|null} Plan object or null if not found
 */
function getPlanById(planId) {
  const stmt = db.prepare(`
    SELECT * FROM plans
    WHERE id = ?
  `);
  return stmt.get(planId);
}

// ============================================================================
// Workflows - Get workflow definitions
// ============================================================================

/**
 * Get all workflows for a specific plan
 * @param {string} planId - Plan ID
 * @returns {Array} Array of workflow objects
 */
function getWorkflowsByPlan(planId) {
  const stmt = db.prepare(`
    SELECT * FROM workflows
    WHERE plan_id = ? AND active = 1
    ORDER BY sequence_order
  `);
  return stmt.all(planId);
}

/**
 * Get a specific workflow by key
 * @param {string} planId - Plan ID
 * @param {string} workflowKey - Workflow key
 * @returns {Object|null} Workflow object or null if not found
 */
function getWorkflowByKey(planId, workflowKey) {
  const stmt = db.prepare(`
    SELECT * FROM workflows
    WHERE plan_id = ? AND workflow_key = ? AND active = 1
  `);
  return stmt.get(planId, workflowKey);
}

/**
 * Get a workflow by ID
 * @param {string} workflowId - Workflow ID
 * @returns {Object|null} Workflow object or null if not found
 */
function getWorkflowById(workflowId) {
  const stmt = db.prepare(`
    SELECT * FROM workflows
    WHERE id = ?
  `);
  return stmt.get(workflowId);
}

/**
 * Get active workflow for renewal based on days until renewal
 * @param {number} daysUntilRenewal - Days until renewal date
 * @returns {Object|null} Workflow object or null if not found
 */
function getRenewalWorkflowByDays(daysUntilRenewal) {
  // Handle overdue case (days < 0)
  if (daysUntilRenewal < 0) {
    return getWorkflowByKey('plan-renewal', 'overdue');
  }

  // Query for workflow where days falls within range
  const stmt = db.prepare(`
    SELECT * FROM workflows
    WHERE plan_id = 'plan-renewal'
      AND active = 1
      AND trigger_type = 'days_based'
      AND (
        json_extract(trigger_config, '$.days_min') IS NULL
        OR json_extract(trigger_config, '$.days_min') <= ?
      )
      AND (
        json_extract(trigger_config, '$.days_max') IS NULL
        OR json_extract(trigger_config, '$.days_max') >= ?
      )
    LIMIT 1
  `);

  return stmt.get(daysUntilRenewal, daysUntilRenewal);
}

// ============================================================================
// Scoring Properties - Priority calculation configuration
// ============================================================================

/**
 * Get all scoring properties
 * @returns {Object} Object with property keys as keys and parsed values
 */
function getAllScoringProperties() {
  const stmt = db.prepare('SELECT * FROM scoring_properties');
  const rows = stmt.all();

  const config = {};
  rows.forEach(row => {
    // Parse JSON values based on type
    if (row.property_type === 'object' || row.property_type === 'array') {
      config[row.property_key] = JSON.parse(row.property_value);
    } else if (row.property_type === 'number') {
      config[row.property_key] = parseFloat(row.property_value);
    } else {
      config[row.property_key] = row.property_value;
    }
  });

  return config;
}

/**
 * Get a specific scoring property
 * @param {string} propertyKey - Property key
 * @returns {any} Parsed property value
 */
function getScoringProperty(propertyKey) {
  const stmt = db.prepare(`
    SELECT * FROM scoring_properties
    WHERE property_key = ?
  `);
  const row = stmt.get(propertyKey);

  if (!row) return null;

  // Parse based on type
  if (row.property_type === 'object' || row.property_type === 'array') {
    return JSON.parse(row.property_value);
  } else if (row.property_type === 'number') {
    return parseFloat(row.property_value);
  } else {
    return row.property_value;
  }
}

/**
 * Update a scoring property
 * @param {string} propertyKey - Property key
 * @param {any} value - New value (will be JSON-encoded if object/array)
 * @param {string} userId - User ID making the change
 */
function updateScoringProperty(propertyKey, value, userId = 'system') {
  // Get current value for audit log
  const oldRow = db.prepare('SELECT * FROM scoring_properties WHERE property_key = ?').get(propertyKey);

  if (!oldRow) {
    throw new Error(`Scoring property '${propertyKey}' not found`);
  }

  // Encode value based on type
  let encodedValue;
  if (oldRow.property_type === 'object' || oldRow.property_type === 'array') {
    encodedValue = JSON.stringify(value);
  } else {
    encodedValue = String(value);
  }

  // Update property
  const stmt = db.prepare(`
    UPDATE scoring_properties
    SET property_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE property_key = ?
  `);
  stmt.run(encodedValue, propertyKey);

  // Log change
  logAdminEvent({
    event_type: 'config_change',
    event_category: 'scoring_config',
    action: 'edit',
    table_name: 'scoring_properties',
    record_key: propertyKey,
    old_value: oldRow.property_value,
    new_value: encodedValue,
    user_id: userId
  });

  // Invalidate cache
  invalidateCache();
}

// ============================================================================
// Workflow Properties - General settings
// ============================================================================

/**
 * Get all workflow properties
 * @returns {Object} Object with property keys as keys and parsed values
 */
function getAllWorkflowProperties() {
  const stmt = db.prepare('SELECT * FROM workflow_properties');
  const rows = stmt.all();

  const config = {};
  rows.forEach(row => {
    // Parse based on type
    if (row.property_type === 'object' || row.property_type === 'array') {
      config[row.property_key] = JSON.parse(row.property_value);
    } else if (row.property_type === 'number') {
      config[row.property_key] = parseFloat(row.property_value);
    } else if (row.property_type === 'boolean') {
      config[row.property_key] = row.property_value === 'true' || row.property_value === '1';
    } else {
      config[row.property_key] = row.property_value;
    }
  });

  return config;
}

/**
 * Get a specific workflow property
 * @param {string} propertyKey - Property key
 * @returns {any} Parsed property value
 */
function getWorkflowProperty(propertyKey) {
  const stmt = db.prepare(`
    SELECT * FROM workflow_properties
    WHERE property_key = ?
  `);
  const row = stmt.get(propertyKey);

  if (!row) return null;

  // Parse based on type
  if (row.property_type === 'object' || row.property_type === 'array') {
    return JSON.parse(row.property_value);
  } else if (row.property_type === 'number') {
    return parseFloat(row.property_value);
  } else if (row.property_type === 'boolean') {
    return row.property_value === 'true' || row.property_value === '1';
  } else {
    return row.property_value;
  }
}

/**
 * Update a workflow property
 * @param {string} propertyKey - Property key
 * @param {any} value - New value
 * @param {string} userId - User ID making the change
 */
function updateWorkflowProperty(propertyKey, value, userId = 'system') {
  // Get current value for audit log
  const oldRow = db.prepare('SELECT * FROM workflow_properties WHERE property_key = ?').get(propertyKey);

  if (!oldRow) {
    throw new Error(`Workflow property '${propertyKey}' not found`);
  }

  // Encode value based on type
  let encodedValue;
  if (oldRow.property_type === 'object' || oldRow.property_type === 'array') {
    encodedValue = JSON.stringify(value);
  } else {
    encodedValue = String(value);
  }

  // Update property
  const stmt = db.prepare(`
    UPDATE workflow_properties
    SET property_value = ?, updated_at = CURRENT_TIMESTAMP
    WHERE property_key = ?
  `);
  stmt.run(encodedValue, propertyKey);

  // Log change
  logAdminEvent({
    event_type: 'config_change',
    event_category: 'workflow_config',
    action: 'edit',
    table_name: 'workflow_properties',
    record_key: propertyKey,
    old_value: oldRow.property_value,
    new_value: encodedValue,
    user_id: userId
  });

  // Invalidate cache
  invalidateCache();
}

// ============================================================================
// Unified Configuration Loader (with caching)
// ============================================================================

/**
 * Load all configuration into memory (cached)
 * Use this at application startup or when cache expires
 * @param {boolean} forceRefresh - Force cache refresh
 * @returns {Object} Complete configuration object
 */
function getAllConfig(forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    return CONFIG_CACHE.data;
  }

  const config = {
    plans: getAllPlans(),
    // workflows: loaded on-demand per plan
    scoring: getAllScoringProperties(),
    workflow: getAllWorkflowProperties(),
    loaded_at: new Date().toISOString()
  };

  // Cache it
  CONFIG_CACHE.data = config;
  CONFIG_CACHE.lastLoaded = Date.now();

  return config;
}

/**
 * Get configuration synchronously (uses cache)
 * Call getAllConfig() first to populate cache
 * @returns {Object} Cached configuration or null if not loaded
 */
function getConfigSync() {
  return CONFIG_CACHE.data;
}

// ============================================================================
// Admin Log - Audit trail
// ============================================================================

/**
 * Log an event to admin_log
 * @param {Object} event - Event details
 */
function logAdminEvent(event) {
  const stmt = db.prepare(`
    INSERT INTO admin_log (
      id, event_type, event_category, action,
      page_name, page_url,
      table_name, record_key, old_value, new_value,
      metadata, user_id, session_id, ip_address, user_agent,
      created_at, duration_ms
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    event.id || randomUUID(),
    event.event_type,
    event.event_category,
    event.action,
    event.page_name || null,
    event.page_url || null,
    event.table_name || null,
    event.record_key || null,
    event.old_value || null,
    event.new_value || null,
    event.metadata || null,
    event.user_id || null,
    event.session_id || null,
    event.ip_address || null,
    event.user_agent || null,
    event.created_at || new Date().toISOString(),
    event.duration_ms || null
  );
}

/**
 * Get admin log events
 * @param {Object} filters - Filter options
 * @param {number} limit - Max number of events to return
 * @returns {Array} Array of log events
 */
function getAdminLog(filters = {}, limit = 100) {
  let query = 'SELECT * FROM admin_log WHERE 1=1';
  const params = [];

  if (filters.event_type) {
    query += ' AND event_type = ?';
    params.push(filters.event_type);
  }

  if (filters.user_id) {
    query += ' AND user_id = ?';
    params.push(filters.user_id);
  }

  if (filters.table_name) {
    query += ' AND table_name = ?';
    params.push(filters.table_name);
  }

  if (filters.record_key) {
    query += ' AND record_key = ?';
    params.push(filters.record_key);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const stmt = db.prepare(query);
  return stmt.all(...params);
}

// ============================================================================
// Exports
// ============================================================================

module.exports = {
  // Plans
  getAllPlans,
  getPlanByKey,
  getPlanById,

  // Workflows
  getWorkflowsByPlan,
  getWorkflowByKey,
  getWorkflowById,
  getRenewalWorkflowByDays,

  // Scoring configuration
  getAllScoringProperties,
  getScoringProperty,
  updateScoringProperty,

  // Workflow configuration
  getAllWorkflowProperties,
  getWorkflowProperty,
  updateWorkflowProperty,

  // Unified config
  getAllConfig,
  getConfigSync,
  invalidateCache,

  // Admin log
  logAdminEvent,
  getAdminLog,

  // Database connection (for advanced use)
  db
};
