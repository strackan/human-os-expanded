#!/usr/bin/env node
/**
 * Package script for creating versioned standalone executable
 */

import { execSync } from 'child_process';
import { readFileSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const standaloneDir = join(rootDir, 'standalone');

// Read version from VERSION file (written by bundle script)
const versionFile = join(standaloneDir, 'VERSION');
if (!existsSync(versionFile)) {
  console.error('VERSION file not found. Run "pnpm bundle" first.');
  process.exit(1);
}

const version = readFileSync(versionFile, 'utf-8').trim();
const versionedName = `founder-os-mcp-${version}.exe`;
const latestName = 'founder-os-mcp.exe';

console.log(`Creating executable for version ${version}...`);

// Run pkg
const inputFile = join(standaloneDir, 'index.cjs');
const outputFile = join(standaloneDir, versionedName);

try {
  execSync(
    `npx pkg "${inputFile}" --target node20-win-x64 --output "${outputFile}" --config pkg.json`,
    { cwd: rootDir, stdio: 'inherit' }
  );

  // Also copy to non-versioned name for convenience
  const latestFile = join(standaloneDir, latestName);
  copyFileSync(outputFile, latestFile);

  console.log(`\nCreated:`);
  console.log(`  ${versionedName} (versioned)`);
  console.log(`  ${latestName} (latest)`);
} catch (error) {
  console.error('Packaging failed:', error.message);
  process.exit(1);
}
