#!/usr/bin/env node
/**
 * Bundle script for creating standalone executable
 *
 * Uses esbuild to bundle all dependencies into a single CommonJS file
 * that can then be packaged with pkg into a standalone executable.
 */

import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Ensure standalone directory exists
const standaloneDir = join(rootDir, 'standalone');
if (!existsSync(standaloneDir)) {
  mkdirSync(standaloneDir, { recursive: true });
}

// Read INSTRUCTIONS.md and embed it
const instructionsPath = join(rootDir, 'INSTRUCTIONS.md');
const instructions = readFileSync(instructionsPath, 'utf-8');

// Create a banner that embeds INSTRUCTIONS.md as a global
const banner = `
// Embedded INSTRUCTIONS.md for standalone executable
globalThis.__EMBEDDED_INSTRUCTIONS__ = ${JSON.stringify(instructions)};
`;

console.log('Bundling MCP server...');

try {
  await build({
    entryPoints: [join(rootDir, 'src', 'index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outfile: join(standaloneDir, 'index.cjs'),
    banner: {
      js: banner,
    },
    // Don't bundle native Node.js modules
    external: [],
    // Handle the .js extensions in imports
    resolveExtensions: ['.ts', '.js', '.mjs', '.cjs'],
    // Minify for smaller file size
    minify: false, // Keep readable for debugging
    sourcemap: false,
    // Handle workspace dependencies
    alias: {
      '@human-os/core': join(rootDir, '..', '..', '..', 'packages', 'core', 'src', 'index.ts'),
    },
    logLevel: 'info',
  });

  console.log('Bundle created at standalone/index.cjs');
  console.log('\nNext step: run "pnpm pkg:win" to create the executable');
} catch (error) {
  console.error('Bundle failed:', error);
  process.exit(1);
}
