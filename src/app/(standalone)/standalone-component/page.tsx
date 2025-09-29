'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import componentMap from '@/components/artifacts/componentImports';

export default function StandaloneComponentPage() {
  const searchParams = useSearchParams();
  const [LoadedComponent, setLoadedComponent] = useState<React.ComponentType | null>(null);
  const [componentName, setComponentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const name = searchParams.get('name');
    const path = searchParams.get('path');

    if (!name || !path) {
      setError('Missing component name or path parameters');
      setIsLoading(false);
      return;
    }

    setComponentName(name);

    const loadComponent = async () => {
      try {
        // First try to get component from pre-imported map
        const Component = componentMap[name];

        if (!Component) {
          throw new Error(`Component "${name}" not found in component map. Available components: ${Object.keys(componentMap).join(', ')}`);
        }

        setLoadedComponent(() => Component);
      } catch (err) {
        console.error('Error loading component:', err);
        setError(`Failed to load component: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Update document title
    document.title = `${name} - Component Viewer`;

    loadComponent();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Component...</h2>
          <p className="text-gray-600">Preparing {componentName || 'component'} for standalone viewing</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Component Load Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-white">
      {/* Minimal floating header */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="bg-black/80 text-white px-3 py-1 rounded text-sm">
          {componentName}
        </div>
        <button
          onClick={() => window.close()}
          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Full viewport component container */}
      <div className="w-full h-full">
        {LoadedComponent && (
          <Suspense fallback={
            <div className="flex items-center justify-center w-full h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-500">Rendering component...</span>
            </div>
          }>
            <LoadedComponent />
          </Suspense>
        )}
      </div>
    </div>
  );
}