import { describe, it, expect } from '@jest/globals';
import { classifyWorkflow, getCategoryConfig } from '../category-classification';

describe('classifyWorkflow', () => {
  it('classifies renewal as data-based', () => {
    expect(classifyWorkflow('renewal')).toBe('data-based');
  });

  it('classifies strategic as data-based', () => {
    expect(classifyWorkflow('strategic')).toBe('data-based');
  });

  it('classifies opportunity as opportunity-based', () => {
    expect(classifyWorkflow('opportunity')).toBe('opportunity-based');
  });

  it('classifies risk as risk-based', () => {
    expect(classifyWorkflow('risk')).toBe('risk-based');
  });

  it('defaults unknown types to data-based', () => {
    expect(classifyWorkflow('unknown')).toBe('data-based');
  });
});

describe('getCategoryConfig', () => {
  it('returns blue styling for renewal with DATE label', () => {
    const config = getCategoryConfig('renewal');
    expect(config.label).toBe('Date-Based');
    expect(config.shortLabel).toBe('DATE');
    expect(config.bgColor).toBe('bg-blue-50');
    expect(config.textColor).toBe('text-blue-700');
    expect(config.borderColor).toBe('border-blue-200');
    expect(config.accentColor).toBe('border-t-blue-500');
    expect(config.heroTagBg).toBe('bg-blue-500/20');
    expect(config.heroTagText).toBe('text-blue-300');
  });

  it('returns emerald styling for opportunity', () => {
    const config = getCategoryConfig('opportunity');
    expect(config.label).toBe('Opportunity-Based');
    expect(config.shortLabel).toBe('OPPORTUNITY');
    expect(config.bgColor).toBe('bg-emerald-50');
    expect(config.accentColor).toBe('border-t-emerald-500');
  });

  it('returns red styling for risk', () => {
    const config = getCategoryConfig('risk');
    expect(config.label).toBe('Risk-Based');
    expect(config.shortLabel).toBe('RISK');
    expect(config.bgColor).toBe('bg-red-50');
    expect(config.textColor).toBe('text-red-600');
    expect(config.accentColor).toBe('border-t-red-500');
  });

  it('returns default config for unknown types', () => {
    const config = getCategoryConfig('nonexistent');
    expect(config.category).toBe('data-based');
    expect(config.shortLabel).toBe('DATE');
    expect(config.accentColor).toBe('border-t-blue-500');
  });
});
