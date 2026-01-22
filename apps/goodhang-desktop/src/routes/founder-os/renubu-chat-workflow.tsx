/**
 * Renubu Chat with Workflow Layout
 *
 * New v0-style layout version of renubu-chat.
 * Uses WorkflowModeLayout with chat in the sidebar.
 *
 * This component is used when FEATURES.USE_WORKFLOW_MODE_LAYOUT is enabled.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/lib/stores/auth';
import { useUserStatusStore } from '@/lib/stores/user';
import { WorkflowModeLayout } from '@/components/workflow-mode';
import { ArtifactCanvas, PersonaCardArtifact } from '@/components/artifacts';
import type {
  WorkflowStep,
  WorkflowMessage,
  PersonaFingerprint,
} from '@/lib/types';
import type { ArtifactInstance } from '@/components/artifacts/ArtifactCanvas';

// =============================================================================
// WORKFLOW STEPS
// =============================================================================

const RENUBU_WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 'questions',
    label: 'Answer Questions',
    description: 'Address outstanding questions from your profile',
    required: false,
    status: 'pending',
    iconName: 'HelpCircle',
  },
  {
    id: 'context',
    label: 'Build Context',
    description: 'Share about your life, work, and goals',
    required: true,
    status: 'pending',
    iconName: 'Layers',
  },
  {
    id: 'persona',
    label: 'Review Persona',
    description: 'Confirm your AI persona card',
    required: true,
    status: 'pending',
    iconName: 'User',
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function RenubuChatWorkflow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token: _token, userId: _userId } = useAuthStore();
  const { status } = useUserStatusStore();
  const initializedRef = useRef(false);

  // State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [personaFingerprint] = useState<PersonaFingerprint | null>(null);

  // Artifact state
  const [artifacts, setArtifacts] = useState<ArtifactInstance[]>([]);
  const [activeArtifactId, setActiveArtifactId] = useState<string | undefined>();
  const [artifactCollapsed, setArtifactCollapsed] = useState(true);
  const [artifactWidth, setArtifactWidth] = useState(400);

  // Session
  const sessionId = searchParams.get('session') || status?.contexts?.active;

  // =============================================================================
  // MESSAGE HANDLER
  // =============================================================================

  const handleMessage = useCallback(
    async (_message: WorkflowMessage): Promise<string | null> => {
      if (!sessionId) {
        return "I'm having trouble connecting. Please try again.";
      }

      try {
        // TODO: Implement actual API call to renubu chat endpoint
        // This would call sendRenubuMessage from the API

        // For now, return a placeholder
        return "Thanks for sharing! Let me process that information.";
      } catch (error) {
        console.error('[renubu-workflow] Error sending message:', error);
        return "Something went wrong. Let's try that again.";
      }
    },
    [sessionId]
  );

  // =============================================================================
  // STEP HANDLERS
  // =============================================================================

  const handleStepComplete = useCallback((stepId: string) => {
    console.log('[renubu-workflow] Step completed:', stepId);

    // Add persona artifact when persona step completes
    if (stepId === 'persona' && personaFingerprint) {
      const personaArtifact: ArtifactInstance = {
        id: 'persona-card',
        type: 'persona',
        title: 'Your Persona',
        data: {
          name: 'You',
          personality: personaFingerprint,
          summary: 'Your AI persona based on the conversation.',
        },
        status: 'draft',
        generatedAt: new Date().toISOString(),
        source: 'awaken',
      };
      setArtifacts([personaArtifact]);
      setActiveArtifactId('persona-card');
      setArtifactCollapsed(false);
    }
  }, [personaFingerprint]);

  const handleStepChange = useCallback((_fromIndex: number, toIndex: number) => {
    setCurrentStepIndex(toIndex);
  }, []);

  const handleWorkflowComplete = useCallback(() => {
    navigate('/founder-os/dashboard');
  }, [navigate]);

  // =============================================================================
  // ARTIFACT HANDLERS
  // =============================================================================

  const handleArtifactConfirm = useCallback((id: string) => {
    setArtifacts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'confirmed' as const } : a))
    );
  }, []);

  const renderArtifact = useCallback((artifact: ArtifactInstance) => {
    if (artifact.type === 'persona') {
      const data = artifact.data as {
        name: string;
        personality: PersonaFingerprint;
        summary: string;
      };
      return (
        <PersonaCardArtifact
          artifact={artifact}
          data={data}
        />
      );
    }
    return <div className="p-4 text-gray-400">Unknown artifact type</div>;
  }, []);

  // =============================================================================
  // INITIALIZATION
  // =============================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Check if renubu is already complete
    const renubuComplete = localStorage.getItem('founder-os-renubu-completed');
    if (renubuComplete) {
      navigate('/founder-os/dashboard');
      return;
    }

    // TODO: Fetch initial state from API (outstanding questions, persona fingerprint)
  }, [navigate]);

  // =============================================================================
  // RENDER
  // =============================================================================

  // Artifact panel content
  const artifactContent = artifacts.length > 0 ? (
    <ArtifactCanvas
      artifacts={artifacts}
      activeArtifactId={activeArtifactId}
      collapsed={artifactCollapsed}
      onToggleCollapse={() => setArtifactCollapsed(!artifactCollapsed)}
      onArtifactSelect={setActiveArtifactId}
      onArtifactClose={(id) => {
        setArtifacts((prev) => prev.filter((a) => a.id !== id));
        if (activeArtifactId === id) {
          setActiveArtifactId(artifacts[0]?.id);
        }
      }}
      onArtifactConfirm={handleArtifactConfirm}
      renderArtifact={renderArtifact}
      resizable
      width={artifactWidth}
      onWidthChange={setArtifactWidth}
    />
  ) : null;

  return (
    <WorkflowModeLayout
      options={{
        workflowId: 'renubu-chat',
        steps: RENUBU_WORKFLOW_STEPS.map((step, index) => ({
          ...step,
          status:
            index < currentStepIndex
              ? 'completed'
              : index === currentStepIndex
              ? 'in_progress'
              : 'pending',
        })),
        initialStepIndex: currentStepIndex,
        onStepComplete: handleStepComplete,
        onStepChange: handleStepChange,
        onWorkflowComplete: handleWorkflowComplete,
        onMessage: handleMessage,
        persistenceKey: 'founder-os-renubu',
        autoSave: true,
      }}
      artifactContent={artifactContent}
      className="h-screen"
    />
  );
}
