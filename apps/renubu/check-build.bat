@echo off
REM Pre-push build check script for Windows
REM Runs the same checks that Vercel runs

echo.
echo 🔍 Running pre-push checks...
echo.

echo 1️⃣  TypeScript type checking...
call npm run type-check
set TYPE_CHECK=%ERRORLEVEL%

echo.
echo 2️⃣  ESLint checking...
call npm run lint
set LINT_CHECK=%ERRORLEVEL%

echo.
echo 3️⃣  Production build...
call npm run build
set BUILD_CHECK=%ERRORLEVEL%

echo.
echo ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if %TYPE_CHECK%==0 if %LINT_CHECK%==0 if %BUILD_CHECK%==0 (
    echo ✅ All checks passed! Safe to push to Vercel.
    exit /b 0
) else (
    echo ❌ Some checks failed:
    if not %TYPE_CHECK%==0 echo   - TypeScript errors
    if not %LINT_CHECK%==0 echo   - ESLint errors
    if not %BUILD_CHECK%==0 echo   - Build errors
    echo.
    echo Fix errors before pushing to Vercel.
    exit /b 1
)
