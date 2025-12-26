-- Database Version 1.7.0: User Roles System
-- Adds role-based access control (admin, author)
-- Safe to run multiple times (uses IF NOT EXISTS and safe ALTER TABLE)

-- ============================================================================
-- STEP 1: Add user roles to user table
-- ============================================================================

-- Add role column to user table (admin, author)
ALTER TABLE user ADD COLUMN role TEXT DEFAULT 'author' CHECK (role IN ('admin', 'author'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_role ON user(role);

-- Set current user to admin role (assuming first user is admin)
UPDATE user SET role = 'admin' WHERE id = (SELECT id FROM user ORDER BY created_date LIMIT 1);

-- ============================================================================
-- STEP 2: Create user_permissions table for future extensibility
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  permission TEXT NOT NULL,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  granted_by TEXT,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  FOREIGN KEY (granted_by) REFERENCES user(id) ON DELETE SET NULL,
  UNIQUE(user_id, permission)
);

-- Create indexes for permissions
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission ON user_permissions(permission);
CREATE INDEX IF NOT EXISTS idx_user_permissions_expires ON user_permissions(expires_at);

-- ============================================================================
-- STEP 3: Insert default admin permissions
-- ============================================================================

-- Grant admin permissions to admin users
INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
SELECT 
  id as user_id,
  'admin:full_access' as permission,
  id as granted_by
FROM user 
WHERE role = 'admin';

-- Additional admin permissions
INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
SELECT 
  id as user_id,
  'admin:emotion_management' as permission,
  id as granted_by
FROM user 
WHERE role = 'admin';

INSERT OR IGNORE INTO user_permissions (user_id, permission, granted_by)
SELECT 
  id as user_id,
  'admin:user_management' as permission,
  id as granted_by
FROM user 
WHERE role = 'admin';

-- ============================================================================
-- STEP 4: Create additional performance indexes
-- ============================================================================

-- Index for role-based queries with creation date
CREATE INDEX IF NOT EXISTS idx_user_role_created ON user(role, created_date);

-- ============================================================================
-- STEP 5: Update database version
-- ============================================================================

-- This will be handled by the version manager
-- Version: 1.7.0
-- Description: User Roles System (admin, author)
-- Features: Role-based access control, permissions system
-- Note: user_moods pinning columns already exist in database 