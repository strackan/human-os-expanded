const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

let totalFixed = 0;

files.forEach(file => {
  const filePath = path.join(migrationsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  // Fix CREATE TABLE (case insensitive)
  content = content.replace(/CREATE TABLE (?!IF NOT EXISTS)/gi, 'CREATE TABLE IF NOT EXISTS ');

  // Fix CREATE INDEX (case insensitive)
  content = content.replace(/CREATE INDEX (?!IF NOT EXISTS)/gi, 'CREATE INDEX IF NOT EXISTS ');

  // Fix CREATE UNIQUE INDEX (case insensitive)
  content = content.replace(/CREATE UNIQUE INDEX (?!IF NOT EXISTS)/gi, 'CREATE UNIQUE INDEX IF NOT EXISTS ');

  // Fix CREATE SCHEMA (case insensitive)
  content = content.replace(/CREATE SCHEMA (?!IF NOT EXISTS)/gi, 'CREATE SCHEMA IF NOT EXISTS ');

  // Fix ALTER TABLE ADD COLUMN - need IF NOT EXISTS
  content = content.replace(/ADD COLUMN (?!IF NOT EXISTS)/gi, 'ADD COLUMN IF NOT EXISTS ');

  // Fix CREATE TRIGGER - add DROP TRIGGER IF EXISTS before each CREATE TRIGGER (case insensitive)
  content = content.replace(
    /(?<!DROP TRIGGER IF EXISTS \S+ ON [^;]+;\s*)CREATE TRIGGER (\w+)\s+([\s\S]*?)\s+ON\s+(\S+)/gi,
    (match, triggerName, middle, tableName) => {
      return `DROP TRIGGER IF EXISTS ${triggerName} ON ${tableName};\nCREATE TRIGGER ${triggerName} ${middle} ON ${tableName}`;
    }
  );

  // Fix CREATE POLICY - add DROP POLICY IF EXISTS before each CREATE POLICY (case insensitive)
  content = content.replace(
    /(?<!DROP POLICY IF EXISTS "[^"]+" ON [^;]+;\s*)CREATE POLICY "([^"]+)" ON (\S+)/gi,
    (match, policyName, tableName) => {
      return `DROP POLICY IF EXISTS "${policyName}" ON ${tableName};\nCREATE POLICY "${policyName}" ON ${tableName}`;
    }
  );

  // Also handle policies without quotes (case insensitive)
  content = content.replace(
    /(?<!DROP POLICY IF EXISTS \S+ ON [^;]+;\s*)CREATE POLICY (\w+) ON (\S+)/gi,
    (match, policyName, tableName) => {
      return `DROP POLICY IF EXISTS ${policyName} ON ${tableName};\nCREATE POLICY ${policyName} ON ${tableName}`;
    }
  );

  // Fix double DO blocks that may have been created
  content = content.replace(/DO \$\$ BEGIN\s+DO \$\$ BEGIN/g, 'DO $$ BEGIN');

  // Fix nested DO $ BEGIN CREATE (should just be CREATE inside the outer DO block)
  content = content.replace(/DO \$ BEGIN (CREATE )/gi, '$1');

  // Fix standalone DO $ BEGIN that should be DO $$ BEGIN (use split/join for reliable matching)
  content = content.split('DO $ BEGIN').join('DO $$ BEGIN');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\nTotal files fixed: ${totalFixed}`);
