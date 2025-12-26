# ⚠️ DANGEROUS DATABASE OPERATIONS

## 🚨 READ THIS BEFORE MAKING ANY DATABASE CHANGES 🚨

This document lists operations that can **PERMANENTLY DELETE USER DATA**. The database protection system is designed to prevent these, but human error can still occur.

## 🛡️ PROTECTION SYSTEM OVERVIEW

- **Database Protection Guard**: Automatically creates snapshots before risky operations
- **Version Manager**: Uses safe upgrade paths with rollback protection  
- **Explicit Confirmation**: Destructive operations require typed confirmation phrases
- **Data Validation**: Pre/post operation checks ensure data integrity

## ❌ NEVER RUN THESE COMMANDS WITHOUT PROTECTION

### Prisma Commands (EXTREMELY DANGEROUS)
```bash
npx prisma migrate reset           # ❌ DELETES ALL DATA
npx prisma migrate dev --reset     # ❌ DELETES ALL DATA  
npx prisma db push --reset         # ❌ DELETES ALL DATA
npx prisma generate --reset        # ❌ May delete data
```

### Direct SQL Commands (DANGEROUS)
```sql
DROP TABLE user_moods;             -- ❌ Deletes custom moods
DROP TABLE mood;                   -- ❌ Deletes all 457 emotions
DELETE FROM entry WHERE 1=1;      -- ❌ Deletes all journal entries
TRUNCATE TABLE mood;               -- ❌ Deletes all emotions
```

### Version Manager (USE WITH CAUTION)
```bash
# Without protection system:
node scripts/db-version-manager.js upgrade v1.0.0  # ❌ Could downgrade/reset
```

## ✅ SAFE ALTERNATIVES

### For Database Changes
```bash
# ✅ SAFE: Create protection snapshot first
npm run db:protection-snapshot

# ✅ SAFE: Use protected version manager
npm run db:upgrade-to-v1.4.0

# ✅ SAFE: Execute SQL with protection
npm run db:safe-execute database-versions/v1.4.0.sql

# ✅ SAFE: Validate before proceeding
npm run db:protection-validate
```

### For Migrations
```bash
# ✅ SAFE: Standard migration (additive only)
npx prisma migrate dev --name add_new_field

# ✅ SAFE: Generate client after schema changes
npx prisma generate
```

### For Seeding (Only for New Databases)
```bash
# ⚠️  CAUTION: Only run on empty databases
npm run db:seed

# ✅ SAFER: Use version manager instead
npm run db:ensure-emotions
```

## 🔍 HOW TO CHECK BEFORE PROCEEDING

### 1. Check Current Data
```bash
npm run db:protection-stats
```

### 2. Validate Database
```bash
npm run db:protection-validate
```

### 3. Check Version
```bash
npm run db:version-current
```

### 4. Create Snapshot
```bash
npm run db:protection-snapshot
```

## 🚨 IF YOU ACCIDENTALLY DELETE DATA

### Immediate Steps
1. **DO NOT PANIC** - Backups exist
2. **STOP ALL OPERATIONS** - Don't make it worse
3. **CHECK BACKUPS**: `ls -la backups/`
4. **RESTORE LATEST**: `cp backups/[latest]/dev.db prisma/dev.db`
5. **VALIDATE**: `npm run db:health`

### Backup Locations
- **Recent backups**: `/backups/backup_YYYY-MM-DD*/`
- **Protection snapshots**: `/backups/protection-snapshot-*/`
- **Version snapshots**: `/database-versions/`

## 🛠️ FOR DEVELOPERS

### When Adding New Features
1. **ALWAYS** create a new version (v1.5.0, etc.)
2. **ALWAYS** use `CREATE TABLE IF NOT EXISTS`
3. **NEVER** use `DROP TABLE` or `DELETE FROM`
4. **TEST** on a copy of the database first
5. **USE** the protection system

### Safe SQL Practices
```sql
-- ✅ SAFE: Additive operations
CREATE TABLE IF NOT EXISTS new_table (...);
ALTER TABLE existing_table ADD COLUMN new_field TEXT;
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- ❌ DANGEROUS: Destructive operations  
DROP TABLE anything;
DELETE FROM table WHERE condition;
TRUNCATE TABLE anything;
ALTER TABLE table DROP COLUMN field;
```

### Code Review Checklist
- [ ] Does this modify existing tables?
- [ ] Does this delete any data?
- [ ] Are backups created before changes?
- [ ] Is the operation reversible?
- [ ] Have you tested on a copy first?

## 📞 EMERGENCY CONTACTS

### Database Issues
1. **Check documentation**: Read `DATABASE_PROTECTION.md`
2. **Review backups**: Check `/backups/` directory
3. **Use health check**: `npm run db:health`
4. **Emergency restore**: Use latest backup

### Version Issues
1. **Check current version**: `npm run db:version-current`
2. **Validate integrity**: `npm run db:protection-validate`
3. **Safe upgrade**: `npm run db:upgrade-to-v1.4.0`

## 🎯 REMEMBER

> **Every journal entry represents someone's personal thoughts and memories.**
> 
> **Every emotion represents months of work building the comprehensive system.**
> 
> **Treat the database with the respect it deserves.**

### The Golden Rules
1. **BACKUP FIRST** - Always create a snapshot
2. **VALIDATE AFTER** - Check that data is preserved  
3. **USE PROTECTION** - Let the guard system help you
4. **ASK FOR HELP** - When in doubt, don't proceed alone
5. **DOCUMENT CHANGES** - Update version files properly

---

*This document was created after experiencing data loss during development. Learn from our mistakes.* 