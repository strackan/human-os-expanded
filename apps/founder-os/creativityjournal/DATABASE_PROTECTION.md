# Database Protection System

## Overview

This document outlines the database protection and recovery system for the Creativity Journal application, including recent fixes and preventative measures.

## Recent Issues and Fixes (January 2025)

### Issue: Mood Data Loss
- **Problem**: Database contained only 10 basic moods instead of the expected 457 emotions
- **Root Cause**: Database was reset to a basic state while versioning system claimed version 1.1.0
- **Impact**: Users could only select from 10 basic moods instead of the full emotion vocabulary
- **Resolution**: Restored from backup with full 457-emotion system

### Issue: Authentication JWE Errors
- **Problem**: "Invalid Compact JWE" errors preventing proper authentication
- **Root Cause**: Inconsistent session handling between NextAuth and custom authentication
- **Impact**: Unauthenticated users could access protected pages
- **Resolution**: Implemented proper middleware with database session validation

## Current Database State

✅ **Verified Healthy** (as of restoration):
- **Moods**: 457 emotions with full Plutchik mappings
- **Mood Properties**: 457 emotion properties 
- **Categories**: 57 emotional categories
- **Mood-Category Links**: 649 category relationships
- **Core Moods**: 52 core emotions for primary UI
- **Schema Version**: 0.3.1

## Protection Systems

### 1. Automated Health Checks

Run database health checks with:
```bash
npm run db:health
```

Or directly:
```bash
node scripts/db-health-check.js
```

**What it checks:**
- Database file existence
- Critical table counts meet minimums
- Data consistency between related tables
- Core mood system integrity
- Suggests recovery options if issues found

**Expected minimums:**
- Moods: 400+
- Mood Properties: 400+ 
- Categories: 50+
- Mood-Category Links: 600+
- Core Moods: 40+

### 2. Automated Backups

**Manual backup:**
```bash
npm run db:backup
```

**Automated backup with description:**
```bash
npm run db:backup:auto
```

**List all backups:**
```bash
npm run db:backup:list
```

### 3. Version Management

**Create new version:**
```bash
npm run db:version        # patch version
npm run db:version:minor  # minor version
npm run db:version:major  # major version
```

**Check current version:**
```bash
npm run db:version:current
```

**List all versions:**
```bash
npm run db:version:list
```

### 4. Emergency Recovery

**Quick restore from v1.0.0 snapshot:**
```bash
npm run db:restore:v1
```

**Manual emergency backup:**
```bash
npm run db:emergency-backup
```

### 5. Authentication Protection

**Middleware Protection:**
- All protected routes require valid database session
- Automatic cleanup of expired/invalid sessions
- Redirect unauthenticated users to login page
- Protection against JWE/JWT session errors

**Protected routes:**
- `/entry/*` - Journal entry pages
- `/dashboard` - User dashboard
- `/moods` - Mood management
- `/settings/*` - User settings
- `/tasks` - Task management
- `/snippets` - Text snippets

**Public routes:**
- `/` - Login page
- `/api/auth/*` - Authentication endpoints

## Recovery Procedures

### Automatic Recovery
1. Run health check to identify issues:
   ```bash
   npm run db:health
   ```

2. If issues found, the script will suggest recovery options with commands

### Manual Recovery

**From recent backup:**
```bash
cd backups/[backup-name]
node restore.js
```

**From version snapshot:**
```bash
cp database-versions/v1.0.0-snapshot.db prisma/dev.db
npx prisma generate
```

**Verify recovery:**
```bash
npm run db:health
```

## Backup Locations

- **Recent backups**: `/backups/backup_YYYY-MM-DDTHH-MM-SS/`
- **Version snapshots**: `/database-versions/`
- **Emergency backups**: `/prisma/dev.db.emergency-*`

## Backup Contents

Each backup includes:
- Complete SQLite database file
- Prisma schema at time of backup
- SQL dump export
- Emotion data export
- Automated restore script
- Metadata and statistics

## Preventative Measures

### 1. Pre-deployment Protection
```bash
npm run db:protect
```
Automatically runs before deployments to:
- Create backup
- Version current state
- Validate data integrity

### 2. Pre-migration Protection
```bash
npm run premigrate
```
Automatically runs before migrations to create safety backup.

### 3. Regular Health Monitoring
Add to your development workflow:
```bash
npm run db:health && npm run dev
```

### 4. Automated Checks
The health check script can be integrated into CI/CD pipelines or scheduled jobs.

## Best Practices

1. **Always backup before major changes**
2. **Run health checks after deployments**
3. **Verify mood count after any database operations**
4. **Test authentication after any auth changes**
5. **Keep multiple backup generations**
6. **Document any manual database modifications**

## Support Commands

**Full system check:**
```bash
npm run db:health && npm run db:version:current
```

**Complete protection workflow:**
```bash
npm run db:protect && npm run db:health
```

**Development startup with checks:**
```bash
npm run db:health && npm run dev
```

## Warning Signs

Watch for these indicators of potential issues:
- Mood dropdown showing fewer than 400 options
- "Invalid Compact JWE" authentication errors
- Users accessing protected pages without login
- Database size significantly smaller than expected (~300KB+)
- Missing mood categories or properties

## Emergency Contacts

If you encounter persistent database issues:
1. Run health check for diagnosis
2. Use automated recovery if available
3. Contact system administrator with health check output
4. Preserve current state with emergency backup before manual intervention
