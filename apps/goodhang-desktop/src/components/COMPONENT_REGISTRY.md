# Component Registry

Last updated: 2026-01-21

This registry tracks all UI components in the goodhang-desktop app, their status, and migration path.

> **See also:** [COMPONENT_AUDIT_REPORT.md](../COMPONENT_AUDIT_REPORT.md) for detailed naming convention audit.

## Active Components

| Component | Path | Purpose | Notes |
|-----------|------|---------|-------|
| ReportView | `report/ReportView.tsx` | Display executive report | Highly reusable |
| ReportEditor | `report/ReportEditor.tsx` | Edit report fields | Tutorial-specific |
| ReportTabContent | `report/ReportTabContent.tsx` | Report tab rendering | Reusable |
| AssessmentFlow | `assessment/AssessmentFlow.tsx` | Multi-step assessment UI | Highly reusable |
| QuestionCard | `assessment/QuestionCard.tsx` | Question display card | Reusable |
| RankingInput | `assessment/RankingInput.tsx` | Drag-to-rank input | Highly reusable |
| CompletionCard | `assessment/CompletionCard.tsx` | Assessment completion | Reusable |
| SectionTimeline | `assessment/SectionTimeline.tsx` | Section progress | Reusable |
| ArtifactCanvas | `artifacts/ArtifactCanvas.tsx` | Right panel artifact display | Highly reusable |
| PersonaCardArtifact | `artifacts/PersonaCardArtifact.tsx` | Persona card rendering | Reusable |
| ChatInput | `chat/ChatInput.tsx` | Chat text input with mic | Will be used in WorkflowSidebar |
| ChatMessage | `chat/ChatMessage.tsx` | Chat message bubble | Will be used in ChatPanel |
| LoadingIndicator | `chat/LoadingIndicator.tsx` | Three-dot loading | Will be used in ChatPanel |
| FrameworkImporter | `settings/FrameworkImporter.tsx` | Import frameworks | Settings-specific |
| MCPProviders | `settings/MCPProviders.tsx` | MCP provider config | Settings-specific |
| PendingProviders | `mcp/PendingProviders.tsx` | MCP pending state | May integrate into onboarding |

## Workflow Mode Components (New - Phase 1-4)

| Component | Path | Purpose | Replaces |
|-----------|------|---------|----------|
| WorkflowModeLayout | `workflow-mode/WorkflowModeLayout.tsx` | Main layout wrapper | N/A |
| WorkflowSidebar | `workflow-mode/WorkflowSidebar.tsx` | Unified chat+nav sidebar | SetupSidebar |
| ChatPanel | `workflow-mode/ChatPanel.tsx` | Chat messages display | Inline in routes |
| InlineComponent | `workflow-mode/InlineComponent.tsx` | Inline widgets | N/A |
| WorkflowStepProgress | `workflow-mode/WorkflowStepProgress.tsx` | Step indicator with actions | TutorialSidebar |
| StepIndicator | `workflow-mode/StepIndicator.tsx` | Single step circle | N/A |
| StepActionModals | `workflow-mode/StepActionModals.tsx` | Snooze/Skip modals | N/A |
| ProgressFooter | `workflow-mode/ProgressFooter.tsx` | Progress bar + unlock | SetupSidebar footer |
| StagedLoadingIndicator | `workflow-mode/StagedLoadingIndicator.tsx` | Multi-stage loading | Inline in routes |

## Deprecated Components

| Component | Path | Deprecated Date | Replaced By | Remove After |
|-----------|------|-----------------|-------------|--------------|
| SetupSidebar | `setup-mode/SetupSidebar.tsx` | 2025-01-21 | WorkflowSidebar | v2.0 release |

## Archive (Reference Only)

| Component | Original Path | Archived Date | Reason |
|-----------|---------------|---------------|--------|
| (none yet) | | | |

---

## Migration Notes

### SetupSidebar -> WorkflowSidebar

The SetupSidebar is being replaced by WorkflowSidebar as part of the v0-style chat + artifact layout redesign.

**Key differences:**
- WorkflowSidebar is wider (280-450px vs 48-240px)
- WorkflowSidebar includes chat messages (not just checklist)
- WorkflowSidebar has step actions (snooze, skip)
- WorkflowSidebar includes ChatInput at bottom

**Migration steps:**
1. Routes should use `WorkflowModeLayout` instead of manual layout
2. Replace `SetupSidebar` with `WorkflowSidebar`
3. Move chat logic into `WorkflowModeContext`

### Feature Flag

During transition, both layouts are available via feature flag:
```typescript
import { FEATURES } from '@/lib/config';

if (FEATURES.USE_WORKFLOW_MODE_LAYOUT) {
  // Use new WorkflowModeLayout
} else {
  // Use legacy SetupSidebar + separate chat
}
```
