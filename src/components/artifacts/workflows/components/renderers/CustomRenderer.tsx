import React from 'react';
import { componentMap } from '@/components/artifacts/componentImports';

interface CustomRendererProps {
  section: {
    id?: string;
    title: string;
    content?: any;
    data?: {
      componentType?: string;
      props?: Record<string, any>;
    };
    visible?: boolean;
  };
}

/**
 * CustomRenderer Component
 *
 * Renders custom artifact types based on componentType.
 * Falls back to JSON display if component not found.
 */
export const CustomRenderer: React.FC<CustomRendererProps> = ({ section }) => {
  // Check for componentType in data
  const componentType = section.data?.componentType;
  const componentProps = section.data?.props || {};

  // If we have a componentType, try to render the registered component
  if (componentType) {
    const Component = componentMap[componentType];

    if (Component) {
      console.log('[CustomRenderer] Rendering component:', componentType, 'with props:', componentProps);
      return <Component {...componentProps} />;
    } else {
      console.warn('[CustomRenderer] Unknown component type:', componentType);
      // Show fallback with info about the missing component
      return (
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6">
          <h3 className="font-semibold text-yellow-800 mb-2 text-sm">
            Component Not Found: {componentType}
          </h3>
          <p className="text-xs text-yellow-700 mb-4">
            The component &quot;{componentType}&quot; is not registered in componentImports.ts
          </p>
          <div className="text-xs text-gray-600 bg-white rounded p-3">
            <pre>{JSON.stringify(componentProps, null, 2)}</pre>
          </div>
        </div>
      );
    }
  }

  // Fallback: Display content as formatted JSON
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-800 mb-6 text-lg">{section.title}</h3>
      <div className="text-sm text-gray-600">
        {JSON.stringify(section.content || section.data, null, 2)}
      </div>
    </div>
  );
};
