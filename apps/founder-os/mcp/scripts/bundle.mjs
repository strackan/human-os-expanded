#!/usr/bin/env node
/**
 * Bundle script for creating standalone executable
 *
 * Uses esbuild to bundle all dependencies into a single CommonJS file
 * that can then be packaged with pkg into a standalone executable.
 *
 * Embeds version info and git commit hash for traceability.
 */

import { build } from 'esbuild';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Get version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

// Get git commit hash
let gitHash = 'unknown';
let gitBranch = 'unknown';
try {
  gitHash = execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
} catch (e) {
  console.warn('Could not get git info:', e.message);
}

const buildTime = new Date().toISOString();

console.log(`Building version ${version} (${gitHash}) on branch ${gitBranch}`);

// Ensure standalone directory exists
const standaloneDir = join(rootDir, 'standalone');
if (!existsSync(standaloneDir)) {
  mkdirSync(standaloneDir, { recursive: true });
}

// Read INSTRUCTIONS.md and embed it
const instructionsPath = join(rootDir, 'INSTRUCTIONS.md');
const instructions = readFileSync(instructionsPath, 'utf-8');

// Create build info object
const buildInfo = {
  version,
  gitHash,
  gitBranch,
  buildTime,
};

// Create a banner that embeds INSTRUCTIONS.md and build info as globals
const banner = `
// Embedded build info for standalone executable
globalThis.__BUILD_INFO__ = ${JSON.stringify(buildInfo)};
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
  console.log(`\nVersion: ${version} (${gitHash})`);
  console.log('\nNext step: run "pnpm pkg:win" to create the executable');

  // Write version to a file for pkg script to use
  const versionInfo = `${version}\n`;
  const fs = await import('fs');
  fs.writeFileSync(join(standaloneDir, 'VERSION'), versionInfo);

} catch (error) {
  console.error('Bundle failed:', error);
  process.exit(1);
}
