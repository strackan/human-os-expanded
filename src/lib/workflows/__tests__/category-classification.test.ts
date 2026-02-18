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
  it('returns blue styling for renewal', () => {
    const config = getCategoryConfig('renewal');
    expect(config.label).toBe('Data-Based');
    expect(config.bgColor).toBe('bg-blue-50');
    expect(config.textColor).toBe('text-blue-700');
    expect(config.borderColor).toBe('border-blue-200');
  });

  it('returns emerald styling for opportunity', () => {
    const config = getCategoryConfig('opportunity');
    expect(config.label).toBe('Opportunity-Based');
    expect(config.bgColor).toBe('bg-emerald-50');
  });

  it('returns amber styling for risk', () => {
    const config = getCategoryConfig('risk');
    expect(config.label).toBe('Risk-Based');
    expect(config.bgColor).toBe('bg-amber-50');
  });
});
