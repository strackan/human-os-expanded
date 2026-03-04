import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  testTimeout: 30000,
  testMatch: ['<rootDir>/**/*.test.ts'],
  setupFiles: ['./setup.ts'],
};

export default config;
