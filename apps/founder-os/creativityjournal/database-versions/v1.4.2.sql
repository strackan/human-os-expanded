-- Database Version 1.4.2: Entry Privacy Protection System
-- Creates dedicated entry_security table for privacy and security features

-- Create entry_security table for privacy features
CREATE TABLE IF NOT EXISTS entry_security (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entry_id INTEGER UNIQUE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE,
    password_hash TEXT,
    break_glass_code TEXT,
    break_glass_expires DATETIME,
    created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES entry(id) ON DELETE CASCADE
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_entry_security_entry_id ON entry_security(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_security_is_private ON entry_security(is_private);
CREATE INDEX IF NOT EXISTS idx_entry_security_break_glass_expires ON entry_security(break_glass_expires);

-- Create default entry_security records for existing entries
INSERT INTO entry_security (entry_id, is_private) 
SELECT id, FALSE FROM entry 
WHERE id NOT IN (SELECT entry_id FROM entry_security WHERE entry_id IS NOT NULL);

-- Log the upgrade
INSERT OR REPLACE INTO user_props (user_id, key, value) 
SELECT id, 'db_version_1.4.2_upgrade', datetime('now') 
FROM user 
WHERE id = (SELECT id FROM user LIMIT 1);

-- Privacy system ready 