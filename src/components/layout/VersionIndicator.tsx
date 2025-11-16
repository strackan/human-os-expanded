'use client';

/**
 * Version Indicator
 *
 * Displays current release version in lower right corner
 * Pulls version from database releases table
 */

import { useEffect, useState } from 'react';

export default function VersionIndicator() {
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurrentVersion() {
      try {
        const response = await fetch('/api/version');
        if (response.ok) {
          const data = await response.json();
          setVersion(data.version);
        }
      } catch (error) {
        console.error('Failed to fetch version:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCurrentVersion();
  }, []);

  if (loading || !version) {
    return null;
  }

  return (
    <div
      className="fixed bottom-2 right-2 text-[10px] text-gray-400 font-mono pointer-events-none select-none z-50"
      style={{ opacity: 0.5 }}
    >
      v{version}
    </div>
  );
}
