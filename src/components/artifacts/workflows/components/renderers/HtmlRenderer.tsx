import React, { useMemo } from 'react';
import DOMPurify from 'dompurify';

interface HtmlRendererProps {
  section: {
    htmlContent?: string;
    styles?: string;
  };
}

/**
 * HtmlRenderer Component
 *
 * Renders sanitized HTML content with optional custom styles.
 * Uses DOMPurify to prevent XSS attacks.
 */
export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ section }) => {
  // Sanitize HTML content to prevent XSS
  const sanitizedHtml = useMemo(() => {
    if (!section.htmlContent) return '';

    return DOMPurify.sanitize(section.htmlContent, {
      ALLOWED_TAGS: [
        'p', 'div', 'span', 'b', 'i', 'u', 'strong', 'em',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'br', 'hr', 'blockquote', 'pre', 'code',
        'img', 'figure', 'figcaption'
      ],
      ALLOWED_ATTR: ['class', 'id', 'style', 'href', 'src', 'alt', 'title', 'target'],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
      FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover']
    });
  }, [section.htmlContent]);

  // Sanitize CSS styles (more restrictive - no url() or javascript:)
  const sanitizedStyles = useMemo(() => {
    if (!section.styles) return '';

    // Remove any url() or javascript: from styles
    let cleaned = section.styles
      .replace(/url\s*\([^)]*\)/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/expression\s*\([^)]*\)/gi, '');

    return DOMPurify.sanitize(cleaned, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }, [section.styles]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {sanitizedStyles && (
        <style dangerouslySetInnerHTML={{ __html: sanitizedStyles }} />
      )}
      <div
        className="html-artifact-content"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  );
};
