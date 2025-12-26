# Database Version Management System

This system ensures that your comprehensive emotion data (457 emotions) is preserved during database migrations and updates.

## The Problem This Solves

Previously, every time you ran migrations or seeded the database, you would lose your comprehensive emotion data and revert back to just 10 basic emotions. This version management system prevents that from happening.

## How It Works

1. **Version Tracking**: Tracks your current database version in `database-versions/current.json`
2. **Smart Seeding**: The seed script now checks if comprehensive emotion data exists before deleting moods
3. **Sequential Upgrades**: Runs migrations and SQL files in the correct order
4. **Data Preservation**: Automatically restores comprehensive emotion data if it's missing

## Available Commands

### NPM Scripts (Recommended)

```bash
# Check current database version
npm run db:version-current

# Validate database integrity 
npm run db:version-validate

# List all available versions
npm run db:version-list

# Ensure comprehensive emotion data exists
npm run db:ensure-emotions

# Upgrade to latest version (v1.3.1)
npm run db:upgrade-to-v1.3.1

# General upgrade command
npm run db:version-upgrade v1.3.1
```

### Direct Node Commands

```bash
# Check current version
node scripts/db-version-manager.js current

# Upgrade to specific version
node scripts/db-version-manager.js upgrade v1.3.1

# Validate database
node scripts/db-version-manager.js validate

# Restore emotions if missing
node scripts/db-version-manager.js ensure-emotions

# List available versions
node scripts/db-version-manager.js list
```

## Version Progression

- **v1.0.0**: Complete implementation of 457-emotion system with Plutchik mappings
- **v1.1.0**: User mood preferences and enhanced analytics
- **v1.2.0**: Enhanced emotion categorization and search
- **v1.3.0**: Advanced mood analytics and insights  
- **v1.3.1**: Bug fixes and data restoration (current)

## Automatic Protection

### During Install
- `npm install` now automatically runs `npm run db:ensure-emotions`
- This ensures emotion data is restored if missing

### During Seeding
- The seed script checks emotion count before deleting
- Only deletes if you have < 400 emotions
- Preserves comprehensive data when it exists

### During Migrations
- Pre-migration backup is created automatically
- Version manager can restore data if needed

## Common Workflows

### After Migration Issues
```bash
# Check if emotion data was lost
npm run db:version-validate

# Restore emotions if needed
npm run db:ensure-emotions

# Upgrade to latest version
npm run db:upgrade-to-v1.3.1
```

### Setting Up New Environment
```bash
# Install dependencies (auto-restores emotions)
npm install

# Validate everything is working
npm run db:version-validate

# Check current version
npm run db:version-current
```

### Manual Data Restoration
```bash
# If you lose emotion data, restore it
npm run db:ensure-emotions

# Or restore from v1.0.0 snapshot
npm run db:restore:v1

# Then upgrade to latest
npm run db:upgrade-to-v1.3.1
```

## Database Status Validation

The validation command checks:
- **Emotions**: Should have 457 emotions
- **Categories**: Should have mood categories
- **Mood Properties**: Should have Plutchik mappings
- **User Preferences Table**: Should exist for user mood preferences

Example output:
```
📊 Database Status:
  - Emotions: 457
  - Categories: 39
  - Mood Properties: 457
  - User Mood Preferences Table: EXISTS

✅ Database is VALID
```

## Files and Structure

- `scripts/db-version-manager.js` - Main version management script
- `database-versions/current.json` - Current version tracking
- `database-versions/v1.0.0-snapshot.db` - Backup with 457 emotions
- `prisma/seed-emotions.sql` - Comprehensive emotion data
- `prisma/seed.ts` - Smart seeding script (preserves data)

## Troubleshooting

### Problem: Only 10 emotions after migration
**Solution**: 
```bash
npm run db:ensure-emotions
```

### Problem: Authentication middleware errors  
**Solution**: Already fixed in v1.3.1 - upgrade:
```bash
npm run db:upgrade-to-v1.3.1
```

### Problem: Database seems corrupted
**Solution**: Restore and upgrade:
```bash
npm run db:restore:v1
npm run db:upgrade-to-v1.3.1
npm run db:version-validate
```

### Problem: Version manager not working
**Solution**: Check Node.js version and run manually:
```bash
node scripts/db-version-manager.js validate
```

## Benefits

1. **No More Data Loss**: Emotion data is automatically preserved
2. **Sequential Upgrades**: Run SQL files and migrations in correct order
3. **Automatic Restoration**: Missing emotion data is automatically restored
4. **Version Tracking**: Always know what version you're running
5. **Validation**: Verify database integrity at any time
6. **Rollback Safety**: Backups are created before major changes

## Best Practices

1. Always run `npm run db:version-validate` after migrations
2. Use `npm run db:ensure-emotions` if you suspect data loss
3. Check `npm run db:version-current` to know your version
4. Run `npm run db:upgrade-to-v1.3.1` to get latest fixes
5. Use version manager commands instead of manual SQL execution 