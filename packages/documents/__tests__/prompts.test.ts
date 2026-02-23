import { describe, it, expect } from 'vitest';
import { parsePromptTemplate } from '../src/prompts.js';

describe('parsePromptTemplate', () => {
  it('extracts simple variables', () => {
    const info = parsePromptTemplate('Hello {{name}}, welcome to {{place}}!');
    expect(info.variables).toContain('name');
    expect(info.variables).toContain('place');
    expect(info.usesDocs).toBe(false);
    expect(info.usesHistory).toBe(false);
  });

  it('detects docs usage', () => {
    const info = parsePromptTemplate('Context: {{#each docs}}{{this}}{{/each}}');
    expect(info.usesDocs).toBe(true);
  });

  it('detects history usage', () => {
    const info = parsePromptTemplate('{{#each history}}{{actor}}: {{message}}{{/each}}');
    expect(info.usesHistory).toBe(true);
  });

  it('filters out built-in helpers', () => {
    const info = parsePromptTemplate('{{#if active}}Yes{{/if}} {{name}}');
    expect(info.variables).toContain('active');
    expect(info.variables).toContain('name');
    expect(info.variables).not.toContain('if');
  });

  it('handles empty template', () => {
    const info = parsePromptTemplate('No variables here');
    expect(info.variables).toEqual([]);
    expect(info.usesDocs).toBe(false);
    expect(info.usesHistory).toBe(false);
  });

  it('handles block with params', () => {
    const info = parsePromptTemplate('{{#each items}}{{this.name}}{{/each}}');
    expect(info.variables).toContain('items');
  });

  it('handles nested blocks', () => {
    const info = parsePromptTemplate(
      '{{#each docs}}{{#if this.title}}{{this.content}}{{/if}}{{/each}}',
    );
    expect(info.usesDocs).toBe(true);
  });

  it('parses the default QA prompt pattern', () => {
    const template = `Use the following context to answer.

{{#history}}
{{actor}}: {{message}}
{{/history}}

Question: {{question}}`;
    const info = parsePromptTemplate(template);
    expect(info.variables).toContain('history');
    expect(info.variables).toContain('question');
    expect(info.usesHistory).toBe(true);
  });
});
