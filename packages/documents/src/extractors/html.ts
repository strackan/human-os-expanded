/**
 * HTML content extraction with cascading selector strategy.
 * Ported from fancyrobot-cloud/backend/fancyrobot_backend/scraper/html.py
 *
 * Tries progressively broader selectors to find the "main content" area,
 * falling back to full body text.
 */

import * as cheerio from 'cheerio';
import type { TextChunk } from '../types.js';

export interface HtmlChunkMetadata {
  title: string;
}

export type HtmlChunk = TextChunk<HtmlChunkMetadata>;

/**
 * Extract the main text content from an HTML string.
 * Uses a cascading selector strategy:
 *   1. [role="main"]
 *   2. <article>
 *   3. #main / #main-content / #content
 *   4. .main / .main-content / .content / .content-body / .news-article
 *   5. Fallback: full body text
 */
export function extractHtml(htmlContent: string): HtmlChunk {
  const $ = cheerio.load(htmlContent);
  const title = $('title').text() || 'N/A';
  const metadata: HtmlChunkMetadata = { title };

  // 1. role="main"
  const byRole = $('[role="main"]');
  if (byRole.length) {
    return { text: byRole.text(), metadata };
  }

  // 2. <article>
  const article = $('article');
  if (article.length) {
    return { text: article.text(), metadata };
  }

  // 3. ID selectors
  for (const id of ['main', 'main-content', 'content']) {
    const el = $(`#${id}`);
    if (el.length) {
      return { text: el.text(), metadata };
    }
  }

  // 4. Class selectors
  for (const cls of ['main', 'main-content', 'content', 'content-body', 'news-article']) {
    const el = $(`.${cls}`);
    if (el.length) {
      return { text: el.text(), metadata };
    }
  }

  // 5. Fallback
  return { text: $.text(), metadata };
}
