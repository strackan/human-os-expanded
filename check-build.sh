#!/bin/bash

# Pre-push build check script
# Runs the same checks that Vercel runs

echo "🔍 Running pre-push checks..."
echo ""

echo "1️⃣  TypeScript type checking..."
npm run type-check
TYPE_CHECK=$?

echo ""
echo "2️⃣  ESLint checking..."
npm run lint
LINT_CHECK=$?

echo ""
echo "3️⃣  Production build..."
npm run build
BUILD_CHECK=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $TYPE_CHECK -eq 0 ] && [ $LINT_CHECK -eq 0 ] && [ $BUILD_CHECK -eq 0 ]; then
    echo "✅ All checks passed! Safe to push to Vercel."
    exit 0
else
    echo "❌ Some checks failed:"
    [ $TYPE_CHECK -ne 0 ] && echo "  - TypeScript errors"
    [ $LINT_CHECK -ne 0 ] && echo "  - ESLint errors"
    [ $BUILD_CHECK -ne 0 ] && echo "  - Build errors"
    echo ""
    echo "Fix errors before pushing to Vercel."
    exit 1
fi
