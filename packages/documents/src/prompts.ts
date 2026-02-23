/**
 * Handlebars prompt template parsing and variable extraction.
 * Merged from:
 *   - fancyrobot-cloud/backend/fancyrobot_backend/llm/prompts.py (Prompt.from_mustache)
 *   - fancyrobot/chatbot-ui/utils/app/promptParsing.ts (getVariables)
 *
 * Parses a Handlebars template and extracts variable names,
 * plus detects special variables like `docs` and `history`.
 */

import Handlebars from 'handlebars';

export interface PromptInfo {
  /** All top-level variable names referenced in the template */
  variables: string[];
  /** Whether the template references any `docs*` variable */
  usesDocs: boolean;
  /** Whether the template references any `history*` variable */
  usesHistory: boolean;
}

// Handlebars AST node types (not fully exported by the package)
interface HbsPathExpression {
  type: 'PathExpression';
  original: string;
}

interface HbsMustacheStatement {
  type: 'MustacheStatement';
  path?: HbsPathExpression;
}

interface HbsBlockStatement {
  type: 'BlockStatement';
  path?: HbsPathExpression;
  params: HbsPathExpression[];
  program: { body: HbsNode[] };
  inverse?: { body: HbsNode[] } | null;
}

interface HbsContentStatement {
  type: 'ContentStatement';
}

type HbsNode = HbsMustacheStatement | HbsBlockStatement | HbsContentStatement | { type: string; [key: string]: unknown };

/**
 * Parse a Handlebars template and extract variable information.
 *
 * @example
 * ```ts
 * const info = parsePromptTemplate('Hello {{name}}, {{#each docs}}...{{/each}}');
 * // => { variables: ['name', 'docs'], usesDocs: true, usesHistory: false }
 * ```
 */
export function parsePromptTemplate(template: string): PromptInfo {
  const ast = Handlebars.parse(template);
  const variables = new Set<string>();

  function walk(node: HbsNode): void {
    switch (node.type) {
      case 'MustacheStatement': {
        const stmt = node as HbsMustacheStatement;
        if (stmt.path?.type === 'PathExpression') {
          variables.add(stmt.path.original);
        }
        break;
      }
      case 'BlockStatement': {
        const block = node as HbsBlockStatement;
        if (block.path?.type === 'PathExpression') {
          variables.add(block.path.original);
        }
        for (const param of block.params ?? []) {
          if (param.type === 'PathExpression') {
            variables.add(param.original);
          }
        }
        if (block.program?.body) {
          for (const child of block.program.body) {
            walk(child as HbsNode);
          }
        }
        if (block.inverse?.body) {
          for (const child of block.inverse.body) {
            walk(child as HbsNode);
          }
        }
        break;
      }
      case 'ContentStatement':
        // Plain text — nothing to extract
        break;
      default:
        // SubExpression, CommentStatement, etc. — skip
        break;
    }
  }

  for (const node of ast.body) {
    walk(node as HbsNode);
  }

  // Filter out Handlebars built-in helpers
  const builtins = new Set(['if', 'unless', 'each', 'with', 'lookup', 'log']);
  const userVars = [...variables].filter((v) => !builtins.has(v));

  return {
    variables: userVars,
    usesDocs: userVars.some((v) => v.startsWith('docs')),
    usesHistory: userVars.some((v) => v.startsWith('history')),
  };
}
