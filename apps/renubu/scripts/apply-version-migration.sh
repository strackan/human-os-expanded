#!/bin/bash
# Apply Version Migration
# Run this script to apply the version restructure migration

set -e  # Exit on error

echo "🚀 Applying Version Restructure Migration..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ Error: .env.local not found"
  echo "Please ensure .env.local exists with DATABASE_URL"
  exit 1
fi

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL not set in .env.local"
  exit 1
fi

echo "📊 Database: ${DATABASE_URL%%\?*}"
echo ""
echo "⚠️  WARNING: This will DELETE all existing releases and features!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Migration cancelled"
  exit 0
fi

echo ""
echo "🔄 Applying migration..."
echo ""

# Apply the migration using psql
# Note: You may need to install PostgreSQL client tools
if command -v psql &> /dev/null; then
  psql "$DATABASE_URL" -f supabase/migrations/20251118000000_version_restructure.sql
else
  echo "⚠️  psql not found - using alternative method..."

  # Try using npx supabase if available
  if command -v npx &> /dev/null && [ -f "supabase/config.toml" ]; then
    npx supabase db execute -f supabase/migrations/20251118000000_version_restructure.sql
  else
    echo "❌ Error: Cannot apply migration automatically"
    echo ""
    echo "Please apply manually using one of these methods:"
    echo ""
    echo "Method 1: Using psql"
    echo "  psql \"\$DATABASE_URL\" -f supabase/migrations/20251118000000_version_restructure.sql"
    echo ""
    echo "Method 2: Supabase Dashboard"
    echo "  1. Go to https://supabase.com/dashboard"
    echo "  2. Select your project"
    echo "  3. Go to SQL Editor"
    echo "  4. Copy/paste contents of: supabase/migrations/20251118000000_version_restructure.sql"
    echo "  5. Run the query"
    echo ""
    exit 1
  fi
fi

echo ""
echo "📝 Regenerating roadmap..."
npm run roadmap

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Migration Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Verify releases: Check Supabase dashboard"
echo "2. Recreate features if needed"
echo "3. Push git tags: git push origin --tags"
echo "4. Deploy to staging/production"
echo ""
echo "Current version: 0.1.6"
echo "Release notes: /release-notes"
echo ""
