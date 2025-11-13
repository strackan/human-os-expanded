/**
 * In-Workflow Authentication Components
 *
 * Easy-to-use authentication for embedding within workflows, modals, and artifacts.
 * No page redirects - users stay in their current context.
 *
 * Quick Start:
 * ```tsx
 * import { InWorkflowAuth, useInWorkflowAuth } from '@/components/auth';
 *
 * function MyWorkflow() {
 *   const { isAuthenticated, user } = useInWorkflowAuth();
 *
 *   if (!isAuthenticated) {
 *     return <InWorkflowAuth onAuthSuccess={() => {...}} />;
 *   }
 *
 *   return <WorkflowContent />;
 * }
 * ```
 *
 * See README.md for full documentation.
 */

export { default as InWorkflowAuth } from './InWorkflowAuth';
export { useInWorkflowAuth } from './useInWorkflowAuth';
export { default as AuthButton } from './AuthButton';
