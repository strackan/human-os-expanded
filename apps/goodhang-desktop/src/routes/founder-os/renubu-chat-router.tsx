/**
 * Renubu Chat Router
 *
 * Switches between legacy layout and new WorkflowModeLayout
 * based on the USE_WORKFLOW_MODE_LAYOUT feature flag.
 */

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { FEATURES } from '@/lib/config';

// Lazy load both versions to avoid loading unused code
const RenubuChatLegacy = lazy(() => import('./renubu-chat'));
const RenubuChatWorkflow = lazy(() => import('./renubu-chat-workflow'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gh-dark-900">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading...</span>
      </div>
    </div>
  );
}

export default function RenubuChatRouter() {
  const Component = FEATURES.USE_WORKFLOW_MODE_LAYOUT
    ? RenubuChatWorkflow
    : RenubuChatLegacy;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}
