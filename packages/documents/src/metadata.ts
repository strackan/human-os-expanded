/**
 * Regex-based metadata extraction from text.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/llm/convo_metadata.py
 *
 * Takes text + a JSON Schema with `aux_data.scan_regex` / `scan_replace`
 * properties, runs regex, transforms matches, returns extracted key-value pairs.
 */

export interface AuxData {
  /** Regex pattern to scan text with */
  scan_regex?: string;
  /** Replacement pattern to extract value. Default: "$&" (full match) */
  scan_replace?: string;
  /** Whether to overwrite existing values. Default: true */
  scan_overwrite?: boolean;
}

export interface SchemaProperty {
  type?: string;
  description?: string;
  default?: unknown;
  aux_data?: AuxData;
}

export interface MetadataSchema {
  properties?: Record<string, SchemaProperty>;
  [key: string]: unknown;
}

/**
 * Parse a match value according to the property's declared type.
 */
function selectValue(
  matches: string[],
  type: string | undefined,
): unknown | null {
  if (matches.length === 0) return null;

  const first = matches[0]!;
  switch (type) {
    case 'string':
      return first;
    case 'integer':
      return parseInt(first.replace(/,/g, ''), 10) || null;
    case 'number':
      return parseFloat(first.replace(/,/g, '')) || null;
    case 'boolean':
      return ['true', 'yes', 'y', '1'].includes(first.toLowerCase());
    default:
      return null;
  }
}

/**
 * Scan text for metadata using regex patterns defined in a JSON Schema.
 *
 * Each property in the schema can have `aux_data.scan_regex` — if present,
 * the text is searched with that regex. Matches are transformed via
 * `aux_data.scan_replace` and parsed according to the property's `type`.
 *
 * @example
 * ```ts
 * const schema = {
 *   properties: {
 *     amount: {
 *       type: 'number',
 *       aux_data: {
 *         scan_regex: '\\$([\\d,]+\\.\\d{2})',
 *         scan_replace: '$1',
 *       },
 *     },
 *   },
 * };
 * scanMetadata('Total: $1,234.56', schema);
 * // => { amount: 1234.56 }
 * ```
 */
export function scanMetadata(
  text: string,
  schema: MetadataSchema,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const properties = schema.properties ?? {};
  for (const [name, prop] of Object.entries(properties)) {
    const auxData = prop.aux_data;
    if (!auxData?.scan_regex) continue;

    const regex = new RegExp(auxData.scan_regex, 'g');
    const rawMatches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      rawMatches.push(match[0]);
    }

    const replacePattern = auxData.scan_replace ?? '$&';
    const transformed = rawMatches.map((m) =>
      m.replace(new RegExp(auxData.scan_regex!), replacePattern),
    );

    const value = selectValue(transformed, prop.type);
    if (value != null) {
      result[name] = value;
    }
  }

  return result;
}
