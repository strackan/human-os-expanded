/**
 * Tools Testing Artifact
 *
 * Tutorial step that tests the MCP toolset by:
 * 1. Prompting for a brain dump of current events, priorities, and relationships
 * 2. Using entity extraction to pull multiple independent entities
 * 3. Adding entities to appropriate database contexts
 * 4. Using the Claude persona (from synthesized commandments) to conduct the exercise
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Brain,
  CheckCircle2,
  Users,
  ListTodo,
  Target,
  Lightbulb,
  ParkingCircle,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Edit3,
  X,
  Mic,
  MicOff,
} from 'lucide-react';
import { useSpeechToText } from '@/lib/hooks/useSpeechToText';
import type {
  FounderOsExtractionResult,
  VoiceOsExtractionResult,
} from '@/lib/types';

// =============================================================================
// TYPES
// =============================================================================

type Phase = 'welcome' | 'brain_dump' | 'extraction_review' | 'populating' | 'verification';

export interface ExtractedPerson {
  name: string;
  relationship_type?: string;
  context: string;
  confidence: number;
  selected: boolean;
}

export interface ExtractedTask {
  title: string;
  description?: string;
  due_date?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  context_tags: string[];
  selected: boolean;
}

export interface ExtractedProject {
  name: string;
  description: string;
  status: string;
  selected: boolean;
}

export interface ExtractedGoal {
  title: string;
  timeframe?: string;
  selected: boolean;
}

export interface ExtractedParkingLot {
  raw_input: string;
  cleaned_text: string;
  capture_mode: 'project' | 'brainstorm' | 'expand' | 'passive';
  selected: boolean;
}

export interface ExtractedEntities {
  people: ExtractedPerson[];
  tasks: ExtractedTask[];
  projects: ExtractedProject[];
  goals: ExtractedGoal[];
  parking_lot: ExtractedParkingLot[];
  summary: string;
}

export interface PopulateResult {
  tasks_created: number;
  relationships_created: number;
  contexts_added: number;
  projects_added: number;
  goals_added: number;
  parking_lot_items: number;
  transcript_id: string | null;
  entity_ids: string[];
  errors: string[];
}

export interface VerificationData {
  tasks: { count: number; urgent: unknown[]; preview: unknown[] };
  relationships: { count: number; names: string[] };
  parking_lot: { count: number; items: string[] };
  work_context: { projects: string[]; goals: string[] };
}

export interface ToolsTestingArtifactProps {
  sessionId: string;
  userId: string;
  founderOs?: FounderOsExtractionResult;
  voiceOs?: VoiceOsExtractionResult;
  onComplete: () => void;
}

// =============================================================================
// GUIDING PROMPTS
// =============================================================================

const GUIDING_PROMPTS = [
  "What projects are you working on right now?",
  "Who are the key people in your work or life?",
  "What's weighing on you or needs attention?",
  "Any upcoming deadlines or commitments?",
  "What ideas have you been parking for later?",
];

// =============================================================================
// COMPONENT
// =============================================================================

export function ToolsTestingArtifact({
  sessionId,
  userId,
  founderOs,
  onComplete,
}: ToolsTestingArtifactProps) {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [brainDump, setBrainDump] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  // Speech-to-text for brain dump
  const {
    isListening,
    isSupported: isSpeechSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechToText({ continuous: true, interimResults: true });
  const [entities, setEntities] = useState<ExtractedEntities | null>(null);
  const [_isPopulating, setIsPopulating] = useState(false);
  const [populateResult, setPopulateResult] = useState<PopulateResult | null>(null);
  const [populateError, setPopulateError] = useState<string | null>(null);
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [populationProgress, setPopulationProgress] = useState<string[]>([]);

  // Sync speech transcript to brain dump
  useEffect(() => {
    if (transcript) {
      setBrainDump((prev) => {
        // Append transcript, adding space if needed
        const separator = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
        return prev + separator + transcript;
      });
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  // Handle mic toggle
  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Build personalized greeting from commandments
  const buildPersonaGreeting = (): string => {
    if (!founderOs?.commandments) {
      return "Ready to capture what's on your mind. Let's see what's happening in your world right now.";
    }

    const workStyle = founderOs.commandments.WORK_STYLE || '';
    const conversationStyle = founderOs.commandments.CONVERSATION_PROTOCOLS || '';

    // Extract cues from commandments for personalization
    const usesSprints = workStyle.toLowerCase().includes('sprint');
    const prefersDirectness = conversationStyle.toLowerCase().includes('direct');

    if (prefersDirectness) {
      return usesSprints
        ? "Let's capture what's on your plate. Brain dump your current sprint, key people, and anything that needs attention."
        : "Let's get everything out of your head. Dump your projects, people, and priorities here.";
    }

    return usesSprints
      ? "Ready to capture what's in your world. Tell me about your current sprint, the people you're working with, and anything weighing on you."
      : "Let's map out your current landscape. Share what projects you're working on, who matters right now, and what's on your mind.";
  };

  // Handle brain dump extraction
  const handleExtract = useCallback(async () => {
    if (!brainDump.trim()) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/tutorial/tools-testing/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brain_dump: brainDump,
          session_id: sessionId,
          user_id: userId,
          commandments: founderOs?.commandments,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Extraction failed: ${response.status}`);
      }

      const data = await response.json();

      // Mark all entities as selected by default
      const entitiesWithSelection: ExtractedEntities = {
        people: (data.people || []).map((p: Omit<ExtractedPerson, 'selected'>) => ({ ...p, selected: true })),
        tasks: (data.tasks || []).map((t: Omit<ExtractedTask, 'selected'>) => ({ ...t, selected: true })),
        projects: (data.projects || []).map((p: Omit<ExtractedProject, 'selected'>) => ({ ...p, selected: true })),
        goals: (data.goals || []).map((g: Omit<ExtractedGoal, 'selected'>) => ({ ...g, selected: true })),
        parking_lot: (data.parking_lot || []).map((pl: Omit<ExtractedParkingLot, 'selected'>) => ({ ...pl, selected: true })),
        summary: data.summary || '',
      };

      setEntities(entitiesWithSelection);
      setPhase('extraction_review');
    } catch (error) {
      console.error('[ToolsTestingArtifact] Extraction error:', error);
      setExtractionError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExtracting(false);
    }
  }, [brainDump, sessionId, userId, founderOs]);

  // Handle entity selection toggle
  const toggleEntitySelection = useCallback(
    (category: keyof Omit<ExtractedEntities, 'summary'>, index: number) => {
      if (!entities) return;

      setEntities((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        const items = [...updated[category]] as Array<{ selected: boolean }>;
        items[index] = { ...items[index], selected: !items[index].selected };
        return { ...updated, [category]: items };
      });
    },
    [entities]
  );

  // Handle populate
  const handlePopulate = useCallback(async () => {
    if (!entities) return;

    setIsPopulating(true);
    setPopulateError(null);
    setPopulationProgress([]);
    setPhase('populating');

    // Filter to only selected entities
    const selectedEntities = {
      people: entities.people.filter((p) => p.selected),
      tasks: entities.tasks.filter((t) => t.selected),
      projects: entities.projects.filter((p) => p.selected),
      goals: entities.goals.filter((g) => g.selected),
      parking_lot: entities.parking_lot.filter((pl) => pl.selected),
    };

    // Show progress messages
    const addProgress = (msg: string) => {
      setPopulationProgress((prev) => [...prev, msg]);
    };

    try {
      console.log('[ToolsTestingArtifact] Populating with:', {
        sessionId,
        userId,
        isUuidFormat: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId),
        entities: {
          people: selectedEntities.people.length,
          tasks: selectedEntities.tasks.length,
          projects: selectedEntities.projects.length,
          goals: selectedEntities.goals.length,
          parking_lot: selectedEntities.parking_lot.length,
        },
      });

      if (selectedEntities.tasks.length > 0) {
        addProgress(`Adding ${selectedEntities.tasks.length} task(s)...`);
      }
      if (selectedEntities.people.length > 0) {
        addProgress(`Creating ${selectedEntities.people.length} relationship(s)...`);
      }
      if (selectedEntities.projects.length > 0) {
        addProgress(`Adding ${selectedEntities.projects.length} project(s)...`);
      }
      if (selectedEntities.goals.length > 0) {
        addProgress(`Adding ${selectedEntities.goals.length} goal(s)...`);
      }
      if (selectedEntities.parking_lot.length > 0) {
        addProgress(`Adding ${selectedEntities.parking_lot.length} parking lot item(s)...`);
      }

      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
      const response = await fetch(`${baseUrl}/api/tutorial/tools-testing/populate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entities: selectedEntities,
          session_id: sessionId,
          user_id: userId,
          brain_dump_text: brainDump, // Include raw text for transcript storage
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Population failed: ${response.status}`);
      }

      const result: PopulateResult = await response.json();
      console.log('[ToolsTestingArtifact] Populate result:', result);
      setPopulateResult(result);

      if (result.errors && result.errors.length > 0) {
        console.warn('[ToolsTestingArtifact] Populate had errors:', result.errors);
        addProgress(`Added items with ${result.errors.length} warning(s)`);
      } else {
        addProgress('All items added successfully!');
      }

      // Fetch verification data
      addProgress('Verifying data...');
      const verifyResponse = await fetch(
        `${baseUrl}/api/tutorial/tools-testing/verify?session_id=${sessionId}&user_id=${userId}`
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();
        setVerificationData(verifyData);
      }

      // Short delay for visual feedback, then show verification
      setTimeout(() => {
        setPhase('verification');
      }, 1000);
    } catch (error) {
      console.error('[ToolsTestingArtifact] Populate error:', error);
      setPopulateError(error instanceof Error ? error.message : 'Unknown error');
      setPhase('extraction_review'); // Go back to review on error
    } finally {
      setIsPopulating(false);
    }
  }, [entities, sessionId, userId]);

  // Handle skip
  const handleSkip = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Handle complete
  const handleComplete = useCallback(() => {
    onComplete();
  }, [onComplete]);

  // Count selected entities
  const getSelectedCount = (): number => {
    if (!entities) return 0;
    return (
      entities.people.filter((p) => p.selected).length +
      entities.tasks.filter((t) => t.selected).length +
      entities.projects.filter((p) => p.selected).length +
      entities.goals.filter((g) => g.selected).length +
      entities.parking_lot.filter((pl) => pl.selected).length
    );
  };

  // =============================================================================
  // RENDER PHASES
  // =============================================================================

  // Welcome Phase
  const renderWelcome = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full p-8"
    >
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
        <Brain className="w-10 h-10 text-white" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3 text-center">
        Let's Test Your Tools
      </h2>

      <p className="text-gray-400 text-center max-w-md mb-6">
        {buildPersonaGreeting()}
      </p>

      <p className="text-gray-500 text-sm text-center max-w-md mb-8">
        I'll extract people, tasks, projects, and more from your brain dump and add them to your Founder OS.
      </p>

      <div className="flex gap-4">
        <button
          onClick={() => setPhase('brain_dump')}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Start Brain Dump
        </button>
        <button
          onClick={handleSkip}
          className="px-6 py-3 bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-300 rounded-lg transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </motion.div>
  );

  // Brain Dump Phase
  const renderBrainDump = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-6"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white mb-2">Brain Dump</h2>
        <p className="text-gray-400 text-sm">
          Write or speak freely about what's on your mind. Don't worry about structure.
        </p>
      </div>

      {/* Guiding prompts */}
      <div className="flex flex-wrap gap-2 mb-4">
        {GUIDING_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => setBrainDump((prev) => prev + (prev ? '\n\n' : '') + prompt + ' ')}
            className="text-xs px-3 py-1.5 bg-gh-dark-700 hover:bg-gh-dark-600 text-gray-400 hover:text-white rounded-full transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Text area with mic button */}
      <div className="flex-1 relative">
        <textarea
          value={brainDump + (interimTranscript ? ` ${interimTranscript}` : '')}
          onChange={(e) => setBrainDump(e.target.value)}
          placeholder="Start typing or click the mic to speak... What projects are you working on? Who are the key people? What deadlines are coming up? What ideas are you sitting on?"
          className={`w-full h-full bg-gh-dark-800 border rounded-lg p-4 pr-16 text-white placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:border-transparent ${
            isListening ? 'border-red-500 focus:ring-red-500' : 'border-gh-dark-600 focus:ring-blue-500'
          }`}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {brainDump.length} chars
          </span>
          <button
            type="button"
            onClick={handleMicToggle}
            className={`p-2 rounded-lg transition-all duration-200 border ${
              isListening
                ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                : isSpeechSupported
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20'
                : 'bg-gray-700/30 border-gray-600/30 text-gray-500 cursor-not-allowed'
            }`}
            disabled={!isSpeechSupported}
            title={isListening ? 'Stop recording' : 'Start dictation'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Listening indicator */}
      {isListening && (
        <div className="mt-2 px-3 py-2 bg-red-900/30 border border-red-500/30 rounded-lg flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-red-300">Listening... speak freely</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center mt-4">
        <button
          onClick={() => setPhase('welcome')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          Back
        </button>

        {extractionError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {extractionError}
          </div>
        )}

        <button
          onClick={handleExtract}
          disabled={!brainDump.trim() || isExtracting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gh-dark-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          {isExtracting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              Process My Brain Dump
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );

  // Extraction Review Phase
  const renderExtractionReview = () => {
    if (!entities) return null;

    const totalEntities =
      entities.people.length +
      entities.tasks.length +
      entities.projects.length +
      entities.goals.length +
      entities.parking_lot.length;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col h-full p-6 overflow-hidden"
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-2">Review Extracted Entities</h2>
          <p className="text-gray-400 text-sm">
            {entities.summary || `Found ${totalEntities} items. Uncheck any you don't want to add.`}
          </p>
        </div>

        {/* Entity cards - scrollable */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* People */}
          {entities.people.length > 0 && (
            <EntitySection
              title="People"
              icon={<Users className="w-5 h-5" />}
              count={entities.people.length}
            >
              {entities.people.map((person, i) => (
                <EntityCard
                  key={i}
                  selected={person.selected}
                  onToggle={() => toggleEntitySelection('people', i)}
                  title={person.name}
                  subtitle={person.relationship_type}
                  context={person.context}
                  confidence={person.confidence}
                />
              ))}
            </EntitySection>
          )}

          {/* Tasks */}
          {entities.tasks.length > 0 && (
            <EntitySection
              title="Tasks"
              icon={<ListTodo className="w-5 h-5" />}
              count={entities.tasks.length}
            >
              {entities.tasks.map((task, i) => (
                <EntityCard
                  key={i}
                  selected={task.selected}
                  onToggle={() => toggleEntitySelection('tasks', i)}
                  title={task.title}
                  subtitle={task.due_date ? `Due: ${task.due_date}` : undefined}
                  context={task.description}
                  badge={task.priority}
                  badgeColor={
                    task.priority === 'critical'
                      ? 'red'
                      : task.priority === 'high'
                      ? 'orange'
                      : task.priority === 'medium'
                      ? 'yellow'
                      : 'gray'
                  }
                />
              ))}
            </EntitySection>
          )}

          {/* Projects */}
          {entities.projects.length > 0 && (
            <EntitySection
              title="Projects"
              icon={<Target className="w-5 h-5" />}
              count={entities.projects.length}
            >
              {entities.projects.map((project, i) => (
                <EntityCard
                  key={i}
                  selected={project.selected}
                  onToggle={() => toggleEntitySelection('projects', i)}
                  title={project.name}
                  subtitle={project.status}
                  context={project.description}
                />
              ))}
            </EntitySection>
          )}

          {/* Goals */}
          {entities.goals.length > 0 && (
            <EntitySection
              title="Goals"
              icon={<Lightbulb className="w-5 h-5" />}
              count={entities.goals.length}
            >
              {entities.goals.map((goal, i) => (
                <EntityCard
                  key={i}
                  selected={goal.selected}
                  onToggle={() => toggleEntitySelection('goals', i)}
                  title={goal.title}
                  subtitle={goal.timeframe}
                />
              ))}
            </EntitySection>
          )}

          {/* Parking Lot */}
          {entities.parking_lot.length > 0 && (
            <EntitySection
              title="Parking Lot"
              icon={<ParkingCircle className="w-5 h-5" />}
              count={entities.parking_lot.length}
            >
              {entities.parking_lot.map((item, i) => (
                <EntityCard
                  key={i}
                  selected={item.selected}
                  onToggle={() => toggleEntitySelection('parking_lot', i)}
                  title={item.cleaned_text}
                  badge={item.capture_mode}
                  badgeColor="blue"
                />
              ))}
            </EntitySection>
          )}

          {/* No entities found */}
          {totalEntities === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p className="text-lg">No entities found in your brain dump.</p>
              <p className="text-sm mt-2">Try adding more details about people, tasks, or projects.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-gh-dark-700">
          <button
            onClick={() => setPhase('brain_dump')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Brain Dump
          </button>

          {populateError && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {populateError}
            </div>
          )}

          <button
            onClick={handlePopulate}
            disabled={getSelectedCount() === 0}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gh-dark-700 disabled:text-gray-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            Add {getSelectedCount()} Items to Founder OS
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  };

  // Populating Phase
  const renderPopulating = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center h-full p-8"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30"
      >
        <Loader2 className="w-8 h-8 text-white" />
      </motion.div>

      <h2 className="text-xl font-bold text-white mb-4">Adding to Your Founder OS</h2>

      <div className="space-y-2 text-center">
        <AnimatePresence mode="popLayout">
          {populationProgress.map((msg, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0.5 }}
              className={`text-sm ${
                i === populationProgress.length - 1 ? 'text-blue-400' : 'text-gray-500'
              }`}
            >
              {i === populationProgress.length - 1 && !msg.includes('successfully') && !msg.includes('Verifying') && (
                <Loader2 className="w-3 h-3 inline-block mr-2 animate-spin" />
              )}
              {msg.includes('successfully') && (
                <CheckCircle2 className="w-3 h-3 inline-block mr-2 text-green-400" />
              )}
              {msg}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  // Verification Phase
  const renderVerification = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full p-6"
    >
      <div className="flex items-center gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Tools Set Up Successfully!</h2>
          <p className="text-gray-400 text-sm">
            Your Founder OS is now populated with your data.
          </p>
        </div>
      </div>

      {/* Results summary */}
      {populateResult && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          {populateResult.tasks_created > 0 && (
            <StatCard
              icon={<ListTodo className="w-5 h-5" />}
              label="Tasks"
              value={populateResult.tasks_created}
              color="blue"
            />
          )}
          {populateResult.relationships_created > 0 && (
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Relationships"
              value={populateResult.relationships_created}
              color="purple"
            />
          )}
          {populateResult.contexts_added > 0 && (
            <StatCard
              icon={<Brain className="w-5 h-5" />}
              label="Context Entries"
              value={populateResult.contexts_added}
              color="purple"
            />
          )}
          {populateResult.projects_added > 0 && (
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="Projects"
              value={populateResult.projects_added}
              color="green"
            />
          )}
          {populateResult.goals_added > 0 && (
            <StatCard
              icon={<Lightbulb className="w-5 h-5" />}
              label="Goals"
              value={populateResult.goals_added}
              color="yellow"
            />
          )}
          {populateResult.parking_lot_items > 0 && (
            <StatCard
              icon={<ParkingCircle className="w-5 h-5" />}
              label="Parking Lot"
              value={populateResult.parking_lot_items}
              color="orange"
            />
          )}
        </div>
      )}

      {/* Show errors if any */}
      {populateResult && populateResult.errors && populateResult.errors.length > 0 && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h4 className="text-red-400 font-medium">Some items could not be added:</h4>
          </div>
          <ul className="space-y-1 text-sm text-red-300">
            {populateResult.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Verification data preview */}
      {verificationData && (
        <div className="flex-1 overflow-y-auto space-y-4">
          {verificationData.tasks.preview && verificationData.tasks.preview.length > 0 && (
            <PreviewSection title="Recent Tasks" items={verificationData.tasks.preview.map((t: unknown) => (t as { title: string }).title)} />
          )}
          {verificationData.relationships.names && verificationData.relationships.names.length > 0 && (
            <PreviewSection title="New Relationships" items={verificationData.relationships.names} />
          )}
          {verificationData.work_context.projects && verificationData.work_context.projects.length > 0 && (
            <PreviewSection title="Active Projects" items={verificationData.work_context.projects} />
          )}
        </div>
      )}

      {/* Complete button */}
      <div className="flex justify-end mt-4 pt-4 border-t border-gh-dark-700">
        <button
          onClick={handleComplete}
          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Sparkles className="w-5 h-5" />
          Complete Tutorial
        </button>
      </div>
    </motion.div>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  return (
    <div className="h-full bg-gradient-to-br from-gh-dark-900 to-gh-dark-800 overflow-auto">
      <AnimatePresence mode="wait">
        {phase === 'welcome' && <div key="welcome" className="h-full">{renderWelcome()}</div>}
        {phase === 'brain_dump' && <div key="brain_dump" className="h-full">{renderBrainDump()}</div>}
        {phase === 'extraction_review' && <div key="extraction_review" className="h-full">{renderExtractionReview()}</div>}
        {phase === 'populating' && <div key="populating" className="h-full">{renderPopulating()}</div>}
        {phase === 'verification' && <div key="verification" className="h-full">{renderVerification()}</div>}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

interface EntitySectionProps {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
}

function EntitySection({ title, icon, count, children }: EntitySectionProps) {
  return (
    <div className="bg-gh-dark-800 rounded-lg p-4 border border-gh-dark-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-blue-400">{icon}</span>
        <h3 className="text-white font-medium">{title}</h3>
        <span className="text-xs text-gray-500 bg-gh-dark-700 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface EntityCardProps {
  selected: boolean;
  onToggle: () => void;
  title: string;
  subtitle?: string;
  context?: string;
  confidence?: number;
  badge?: string;
  badgeColor?: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
}

function EntityCard({
  selected,
  onToggle,
  title,
  subtitle,
  context,
  confidence,
  badge,
  badgeColor = 'gray',
}: EntityCardProps) {
  const colorClasses = {
    red: 'bg-red-500/20 text-red-400',
    orange: 'bg-orange-500/20 text-orange-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    green: 'bg-green-500/20 text-green-400',
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    gray: 'bg-gray-500/20 text-gray-400',
  };

  return (
    <div
      onClick={onToggle}
      className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        selected
          ? 'bg-blue-500/10 border border-blue-500/30'
          : 'bg-gh-dark-700/50 border border-transparent hover:bg-gh-dark-700'
      }`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-500'
        }`}
      >
        {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-medium ${selected ? 'text-white' : 'text-gray-400'}`}>
            {title}
          </span>
          {badge && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${colorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
          {confidence !== undefined && confidence < 0.8 && (
            <span className="text-xs text-gray-500">{Math.round(confidence * 100)}% confident</span>
          )}
        </div>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        {context && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{context}</p>}
      </div>

      {selected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-1 hover:bg-gh-dark-600 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'purple' | 'green' | 'yellow' | 'orange';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/20 text-purple-400',
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    orange: 'bg-orange-500/20 text-orange-400',
  };

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color].replace('text-', 'bg-').replace('400', '500/10')}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={colorClasses[color]}>{icon}</span>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

interface PreviewSectionProps {
  title: string;
  items: string[];
}

function PreviewSection({ title, items }: PreviewSectionProps) {
  return (
    <div className="bg-gh-dark-800/50 rounded-lg p-3">
      <h4 className="text-sm font-medium text-gray-400 mb-2">{title}</h4>
      <ul className="space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="text-sm text-white flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0" />
            <span className="truncate">{item}</span>
          </li>
        ))}
        {items.length > 5 && (
          <li className="text-xs text-gray-500">+{items.length - 5} more</li>
        )}
      </ul>
    </div>
  );
}

export default ToolsTestingArtifact;
