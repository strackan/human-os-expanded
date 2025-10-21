import React from 'react';

interface HtmlRendererProps {
  section: {
    htmlContent?: string;
    styles?: string;
  };
}

/**
 * HtmlRenderer Component
 *
 * Renders raw HTML content with optional custom styles.
 * Use with caution - ensure HTML content is sanitized.
 */
export const HtmlRenderer: React.FC<HtmlRendererProps> = ({ section }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    {section.styles && (
      <style dangerouslySetInnerHTML={{ __html: section.styles }} />
    )}
    <div
      className="html-artifact-content"
      dangerouslySetInnerHTML={{ __html: section.htmlContent || '' }}
    />
  </div>
);
