/**
 * Tutorial Mode Router
 *
 * Switches between legacy layout and new WorkflowModeLayout
 * based on the USE_WORKFLOW_MODE_LAYOUT feature flag.
 */

import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { FEATURES } from '@/lib/config';

// Lazy load both versions to avoid loading unused code
const TutorialLegacy = lazy(() => import('./tutorial'));
const TutorialWorkflow = lazy(() => import('./tutorial-workflow'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen bg-gh-dark-900">
      <div className="flex items-center gap-3 text-white">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Loading tutorial...</span>
      </div>
    </div>
  );
}

export default function TutorialRouter() {
  const Component = FEATURES.USE_WORKFLOW_MODE_LAYOUT
    ? TutorialWorkflow
    : TutorialLegacy;

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}
