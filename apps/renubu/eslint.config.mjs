import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // QA Infrastructure: Upgraded rules from warn to error (Day 2)
      "@typescript-eslint/no-unused-vars": "error", // Upgraded: no unused variables allowed
      "react/no-unescaped-entities": "error", // Upgraded: no unescaped quotes/chars

      // TODO: Upgrade to error once existing violations are fixed (50+ instances)
      "@typescript-eslint/no-explicit-any": "warn", // Keep as warn for gradual migration
    },
  },
];

export default eslintConfig;
