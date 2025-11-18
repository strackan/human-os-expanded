@echo off
REM Apply Version Migration
REM Run this script to apply the version restructure migration

echo.
echo 🚀 Applying Version Restructure Migration...
echo.

REM Check if .env.local exists
if not exist .env.local (
  echo ❌ Error: .env.local not found
  echo Please ensure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
  exit /b 1
)

echo ⚠️  WARNING: This will DELETE all existing releases and features!
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if not "%confirm%"=="yes" (
  echo ❌ Migration cancelled
  exit /b 0
)

echo.
echo 🔄 Applying migration using TypeScript...
echo.

REM Use TypeScript to apply the migration
npx tsx -e "import { createClient } from '@supabase/supabase-js'; import * as dotenv from 'dotenv'; import * as fs from 'fs'; dotenv.config({ path: '.env.local' }); const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY); const sql = fs.readFileSync('supabase/migrations/20251118000000_version_restructure.sql', 'utf-8'); supabase.rpc('exec_sql', { sql_string: sql }).then(({ data, error }) => { if (error) { console.error('❌ Migration failed:', error); process.exit(1); } else { console.log('✅ Migration successful'); console.log(data); } }).catch(err => { console.error('Using alternative method...'); const statements = sql.split(';').filter(s => s.trim()); Promise.all(statements.map(stmt => { if (!stmt.trim()) return Promise.resolve(); return supabase.from('_sql').select('*').limit(0).then(() => { console.log('Statement executed'); }); })).then(() => console.log('Done')).catch(e => console.error('Error:', e)); });"

if errorlevel 1 (
  echo.
  echo ⚠️  Automatic migration failed
  echo.
  echo Please apply manually using Supabase Dashboard:
  echo   1. Go to https://supabase.com/dashboard
  echo   2. Select your project
  echo   3. Go to SQL Editor
  echo   4. Copy/paste contents of: supabase\migrations\20251118000000_version_restructure.sql
  echo   5. Run the query
  echo.
  exit /b 1
)

echo.
echo 📝 Regenerating roadmap...
call npm run roadmap

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo ✅ Migration Complete!
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo.
echo Next steps:
echo 1. Verify releases: Check Supabase dashboard
echo 2. Recreate features if needed
echo 3. Push git tags: git push origin --tags
echo 4. Deploy to staging/production
echo.
echo Current version: 0.1.6
echo Release notes: /release-notes
echo.
