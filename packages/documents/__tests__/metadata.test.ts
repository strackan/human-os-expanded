import { describe, it, expect } from 'vitest';
import { scanMetadata } from '../src/metadata.js';

describe('scanMetadata', () => {
  it('extracts a currency amount', () => {
    const schema = {
      properties: {
        amount: {
          type: 'number',
          aux_data: {
            scan_regex: '\\$(\\d[\\d,]*\\.\\d{2})',
            scan_replace: '$1',
          },
        },
      },
    };
    const result = scanMetadata('The total is $1,234.56 per year.', schema);
    expect(result.amount).toBeCloseTo(1234.56);
  });

  it('extracts a date string', () => {
    const schema = {
      properties: {
        renewalDate: {
          type: 'string',
          aux_data: {
            scan_regex: '(\\d{4}-\\d{2}-\\d{2})',
          },
        },
      },
    };
    const result = scanMetadata('Renewal date: 2025-06-15', schema);
    expect(result.renewalDate).toBe('2025-06-15');
  });

  it('extracts a percentage as number', () => {
    const schema = {
      properties: {
        discount: {
          type: 'number',
          aux_data: {
            scan_regex: '(\\d+(?:\\.\\d+)?)%',
            scan_replace: '$1',
          },
        },
      },
    };
    const result = scanMetadata('You get a 15.5% discount', schema);
    expect(result.discount).toBeCloseTo(15.5);
  });

  it('extracts boolean from text', () => {
    const schema = {
      properties: {
        autoRenew: {
          type: 'boolean',
          aux_data: {
            scan_regex: '[Aa]uto[- ]?[Rr]enew(?:al)?:\\s*([Yy]es|[Nn]o|[Tt]rue|[Ff]alse)',
            scan_replace: '$1',
          },
        },
      },
    };
    const result = scanMetadata('Auto-renewal: Yes', schema);
    expect(result.autoRenew).toBe(true);
  });

  it('extracts integer', () => {
    const schema = {
      properties: {
        seats: {
          type: 'integer',
          aux_data: {
            scan_regex: '(\\d+)\\s+seats?',
            scan_replace: '$1',
          },
        },
      },
    };
    const result = scanMetadata('License for 50 seats', schema);
    expect(result.seats).toBe(50);
  });

  it('skips properties without scan_regex', () => {
    const schema = {
      properties: {
        name: { type: 'string', description: 'Customer name' },
        amount: {
          type: 'number',
          aux_data: {
            scan_regex: '\\$(\\d+)',
            scan_replace: '$1',
          },
        },
      },
    };
    const result = scanMetadata('Pay $500', schema);
    expect(result).not.toHaveProperty('name');
    expect(result.amount).toBe(500);
  });

  it('returns empty object when no matches', () => {
    const schema = {
      properties: {
        email: {
          type: 'string',
          aux_data: {
            scan_regex: '[\\w.]+@[\\w.]+',
          },
        },
      },
    };
    const result = scanMetadata('No email here', schema);
    expect(Object.keys(result)).toHaveLength(0);
  });

  it('handles empty schema', () => {
    const result = scanMetadata('Some text', {});
    expect(result).toEqual({});
  });
});
