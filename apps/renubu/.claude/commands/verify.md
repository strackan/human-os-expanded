# Verify Code Quality

Run comprehensive code quality checks before committing:

1. Run `npm run type-check` to verify TypeScript types
2. Run `npm run lint` to check ESLint rules
3. Report all errors found with file paths and line numbers
4. If all checks pass, confirm "✅ All quality checks passed"

**Important:** Actually execute the commands using the Bash tool. Don't skip them.

**Expected output format:**
```
Running TypeScript type check...
✅ Type check passed (0 errors)

Running ESLint...
✅ ESLint passed (0 errors)

✅ All quality checks passed - ready to commit
```

If errors are found, show them clearly with file paths and line numbers so they can be fixed.
