/**
 * Artifact Panel Component
 *
 * Wrapper for artifact content that includes workflow step progress at the top.
 * This provides more room for step names compared to the sidebar header.
 */

import { motion } from 'framer-motion';
import { WorkflowStepProgress } from './WorkflowStepProgress';

export interface ArtifactPanelProps {
  children: React.ReactNode;
  showStepProgress?: boolean;
  className?: string;
}

export function ArtifactPanel({
  children,
  showStepProgress = true,
  className = '',
}: ArtifactPanelProps) {
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Step progress at top of artifact */}
      {showStepProgress && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-shrink-0 border-b border-gh-dark-700 bg-gh-dark-850"
        >
          <WorkflowStepProgress
            className="py-3 px-4"
            showActions={false}
          />
        </motion.div>
      )}

      {/* Artifact content - no scroll here, children handle their own overflow */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default ArtifactPanel;
