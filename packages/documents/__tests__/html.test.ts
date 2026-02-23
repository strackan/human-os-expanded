import { describe, it, expect } from 'vitest';
import { extractHtml } from '../src/extractors/html.js';

describe('extractHtml', () => {
  it('extracts text from role="main"', () => {
    const html = `
      <html><head><title>Test Page</title></head>
      <body>
        <nav>Navigation</nav>
        <div role="main">Main content here</div>
        <footer>Footer</footer>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toBe('Main content here');
    expect(result.metadata.title).toBe('Test Page');
  });

  it('extracts text from <article>', () => {
    const html = `
      <html><head><title>Article Page</title></head>
      <body>
        <header>Header</header>
        <article>Article content</article>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toBe('Article content');
  });

  it('extracts text from #content', () => {
    const html = `
      <html><head><title>ID Page</title></head>
      <body>
        <div id="sidebar">Sidebar</div>
        <div id="content">Content by ID</div>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toBe('Content by ID');
  });

  it('extracts text from .content class', () => {
    const html = `
      <html><head><title>Class Page</title></head>
      <body>
        <div class="sidebar">Sidebar</div>
        <div class="content">Content by class</div>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toBe('Content by class');
  });

  it('falls back to full text', () => {
    const html = `
      <html><head><title>Plain</title></head>
      <body>
        <div>Just some text</div>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toContain('Just some text');
  });

  it('handles missing title', () => {
    const html = '<html><body>No title</body></html>';
    const result = extractHtml(html);
    expect(result.metadata.title).toBe('N/A');
  });

  it('respects selector priority (role > article)', () => {
    const html = `
      <html><head><title>Priority</title></head>
      <body>
        <div role="main">Role main content</div>
        <article>Article content</article>
      </body></html>
    `;
    const result = extractHtml(html);
    expect(result.text).toBe('Role main content');
  });
});
