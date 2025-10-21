import React from 'react';

interface CustomRendererProps {
  section: {
    title: string;
    content: any;
  };
}

/**
 * CustomRenderer Component
 *
 * Fallback renderer for custom artifact types.
 * Displays the content as formatted JSON.
 */
export const CustomRenderer: React.FC<CustomRendererProps> = ({ section }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <h3 className="font-semibold text-gray-800 mb-6 text-lg">{section.title}</h3>
    <div className="text-sm text-gray-600">
      {JSON.stringify(section.content, null, 2)}
    </div>
  </div>
);
