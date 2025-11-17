/**
 * Workflow composers for building modular workflow configurations
 *
 * The composer system provides:
 * - StageComposer: Resolves stage references to artifact sections
 * - SlideComposer: Builds complete slides from templates
 * - WorkflowBuilder: Orchestrates full workflow composition
 */

export * from './StageComposer';
export * from './SlideComposer';
export * from './WorkflowBuilder';
