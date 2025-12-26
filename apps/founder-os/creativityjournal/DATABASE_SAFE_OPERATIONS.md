# Database Safe Operations Guide

## 🚨 Critical Issue Resolved

**PROBLEM**: The old `npm run db:restore:v1` command was **destructive** and completely overwrote the database, permanently deleting all user entries, published content, and personal data.

**SOLUTION**: Replaced with safe operations that preserve user data while updating reference data only.

## 🛡️ New Safe Commands

### Core Safe Operations

```bash
# ✅ SAFE: Restore moods/categories while preserving ALL user data
npm run db:safe-restore

# ✅ SAFE: Check current database status
npm run db:safety-check

# ✅ SAFE: Audit recent changes and entries
npm run db:audit

# ✅ SAFE: Create emergency backup
npm run db:emergency-backup

# ✅ SAFE: Verify current data integrity
npm run db:verify-data

# ✅ SAFE: Create backup without making changes
npm run db:backup-only
```

### What These Commands Do

#### `npm run db:safe-restore`
- ✅ **Preserves**: All user entries, published content, accounts, sessions
- 🔄 **Updates**: Moods, categories, statuses, labels (reference data only)
- 🛡️ **Safety**: Automatic backup before any changes
- 📊 **Verification**: Confirms restore success and data preservation

#### `npm run db:safety-check`
- 📊 Shows current data status (entries, published content, users)
- 🔍 Identifies if user data exists
- ⚠️ Warns about published entries that need protection
- 🛡️ Validates operation safety

#### `npm run db:audit`
- 📝 Lists recent entries and changes
- 📊 Shows database table count
- 🔍 Helps identify what data exists

## 🚫 Deprecated/Dangerous Commands

```bash
# ❌ PERMANENTLY DISABLED - Would delete all user data
# npm run db:restore:v1  

# Now shows error and exits:
npm run DEPRECATED:db:restore:v1
```

## 🔧 How It Works

### Safe Restore Process

1. **Backup Creation**: Automatic backup of current database
2. **Data Analysis**: Scans for user content and published entries
3. **Selective Clearing**: Only clears reference data tables
4. **Safe Restoration**: Uses `INSERT OR REPLACE` for conflict-free updates
5. **Verification**: Confirms emotions restored and user data preserved

### Data Classification

**User Data (ALWAYS PRESERVED)**:
- `entry` - User journal entries
- `entry_props` - Entry content, titles, word counts
- `entry_moods` - User mood selections
- `entry_labels` - User-applied labels
- `entry_snippets` - User highlights and notes
- `user` - User accounts
- `user_props` - User preferences
- `user_mood_preferences` - Personal mood settings
- `account` - Authentication data
- `session` - User sessions
- `task` - User tasks
- `project` - User projects

**Reference Data (SAFELY UPDATED)**:
- `mood` - Emotion definitions
- `mood_props` - Emotion properties
- `categories` - Emotion categories
- `mood_categories` - Category mappings
- `entry_status` - Status types (Draft/Published/Archived)
- `task_status` - Task status types
- `task_priority` - Priority levels
- `project_status` - Project status types
- `label` - Predefined label types

## 🆘 Emergency Recovery

If you ever lose data:

1. **Check backups**:
   ```bash
   ls -la backups/
   ls -la backups/safe-restore-backup-*/
   ```

2. **Restore from backup**:
   ```bash
   cp backups/[latest-backup]/dev.db prisma/dev.db
   ```

3. **Verify recovery**:
   ```bash
   npm run db:audit
   ```

## 🔍 Data Verification

After any operation, verify your data:

```bash
# Check what data exists
npm run db:safety-check

# See recent entries
npm run db:audit

# Verify emotions restored
npm run db:verify-data
```

## 💡 Best Practices

### Before Any Database Operation

1. **Always backup first**:
   ```bash
   npm run db:backup
   ```

2. **Check what data exists**:
   ```bash
   npm run db:safety-check
   ```

3. **Use safe operations**:
   ```bash
   npm run db:safe-restore  # Not the old destructive command
   ```

### Regular Maintenance

```bash
# Weekly: Create backup
npm run db:backup

# Before updates: Safety check
npm run db:safety-check

# After changes: Verify data
npm run db:audit
```

## 🚨 Warning Signs

**RED FLAGS** - Stop immediately if you see:
- "Deleting all entries"
- "Truncating user data" 
- "Restoring from clean snapshot"
- Any command that mentions overwriting `prisma/dev.db`

**GREEN FLAGS** - Safe to proceed:
- "Preserving user data"
- "Updating reference data only"
- "Backup created"
- "INSERT OR REPLACE"

## 📋 Migration Guide

### From Old Dangerous System

**OLD (DANGEROUS)**:
```bash
npm run db:restore:v1  # ❌ DELETED ALL USER DATA
```

**NEW (SAFE)**:
```bash
npm run db:safe-restore  # ✅ PRESERVES ALL USER DATA
```

### Key Differences

| Aspect | Old System | New System |
|--------|------------|------------|
| User Data | **DELETED** | **PRESERVED** |
| Published Entries | **LOST FOREVER** | **PROTECTED** |
| Backup | Manual only | Automatic |
| Safety Checks | None | Built-in |
| Recovery | Impossible | Multiple backups |

## 🔒 Data Protection Guarantees

With the new safe system:

- ✅ **Published entries are NEVER deleted**
- ✅ **User content is ALWAYS preserved**
- ✅ **Automatic backups before changes**
- ✅ **Multiple recovery options**
- ✅ **Clear warnings about data risks**
- ✅ **Safe-by-default operations**

## 🐛 Troubleshooting

### "No emotions found"
```bash
npm run db:safe-restore
```

### "Database seems empty"
```bash
npm run db:audit
# Check if data exists in backups
ls -la backups/*/
```

### "Infinite mood API calls"
Fixed in latest update - the emotion selector no longer loops.

---

## 📞 Support

If you experience data loss or have concerns:

1. **Stop all operations immediately**
2. **Don't run any more database commands**
3. **Check backup directories**: `backups/`
4. **Run safety check**: `npm run db:safety-check`

The new system prevents the data loss that occurred before. Your published entries and user content will be protected. 