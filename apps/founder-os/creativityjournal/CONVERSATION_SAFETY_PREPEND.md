# 🚨 DATABASE SAFETY - REQUIRED READING 🚨

**Before any database modifications, you MUST understand this project has critical data protection requirements:**

## 🔒 PROTECTED DATA
- **457 emotions** + **649 mood categories** (comprehensive emotion system)
- **User journal entries** (personal content that cannot be lost)
- **Published entries** + **User accounts**

## ✅ SAFE OPERATIONS ONLY
```bash
# ALWAYS use these safe commands:
npm run db:health                    # Check current state
npm run db:protection-snapshot       # Create backup first
npm run db:safe-execute [file.sql]   # Execute with protection
npm run db:upgrade-to-v1.4.1        # Safe version upgrades

# NEVER use these dangerous commands:
npx prisma migrate reset            # ❌ DELETES ALL DATA
npx prisma migrate dev --reset      # ❌ DELETES ALL DATA  
npx prisma db push --reset          # ❌ DELETES ALL DATA
```

## 🛡️ REQUIRED WORKFLOW
1. **Check**: `npm run db:health` (verify 457+ moods, 649+ categories)
2. **Backup**: `npm run db:protection-snapshot` (always backup first)
3. **Modify**: Use versioned SQL files + protection system
4. **Verify**: `npm run db:health` (confirm data preserved)

## 🚨 RED FLAGS - STOP IMMEDIATELY
- Any command with "reset", "clean", or "delete all"
- Direct database file replacement
- Operations without backup creation
- Missing protection system usage

**Database Version: v1.4.1 | Protection System: ACTIVE**

*See `DATABASE_SAFETY_NOTE_FOR_CONVERSATIONS.md` for complete details.*

--- 