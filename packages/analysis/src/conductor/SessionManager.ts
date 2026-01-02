/**
 * Interview Session Manager
 *
 * Protocol-driven session management for conversational interviews.
 * Unlike the state-machine ConductorEngine, this class:
 * - Provides protocol context for Claude to BE the interviewer
 * - Tracks captured attributes from natural conversation
 * - Runs analysis when the interview completes
 *
 * Claude generates the dialogue; this class tracks the signals.
 */

import type {
  TranscriptEntry,
  AssessmentResult,
  Scene,
} from './types.js';

import {
  ATTRIBUTES,
  ATTRIBUTE_SETS,
  type Attribute,
  type AttributeSet,
  getCaptureProgress,
} from './attributes.js';

import { scoreInterview, classifyArchetype, interviewScorer } from '../scoring/index.js';
import { analyzeTextEmotion } from '../core/index.js';

// =============================================================================
// TYPES
// =============================================================================

export interface InterviewSession {
  id: string;
  candidateName: string;
  attributeSetId: string;
  attributeSet: AttributeSet;
  transcript: TranscriptEntry[];
  capturedAttributes: Map<string, CapturedAttribute>;
  currentScene: Scene;
  startedAt: Date;
  status: 'active' | 'completed' | 'abandoned';
}

export interface CapturedAttribute {
  attributeId: string;
  capturedAt: Date;
  scene: Scene;
  evidence: string[];  // Quotes from transcript that indicate this attribute
  confidence: number;  // 0-1 scale
}

export interface CaptureResult {
  newCaptures: string[];  // Attribute IDs newly captured
  progress: {
    total: number;
    captured: number;
    percentage: number;
    requiredComplete: boolean;
    missingRequired: string[];
    missingOptional: string[];
  };
  suggestions: string[];  // Questions that might surface missing attributes
}

export interface SessionContext {
  session: {
    id: string;
    candidateName: string;
    currentScene: Scene;
    startedAt: string;
  };
  attributeSet: {
    id: string;
    name: string;
    description: string;
    interviewStyle: string;
    estimatedDuration: string;
  };
  progress: {
    captured: number;
    total: number;
    percentage: number;
    requiredComplete: boolean;
    missingRequired: string[];
  };
  characters: {
    elevator: { name: string; purpose: string; exchanges: string };
    reception: { name: string; purpose: string; exchanges: string };
    office: { name: string; purpose: string; exchanges: string };
  };
  guidance: {
    currentCharacter: string;
    sceneGoal: string;
    attributesToCapture: string[];
  };
}

// =============================================================================
// SESSION MANAGER CLASS
// =============================================================================

export class SessionManager {
  private sessions = new Map<string, InterviewSession>();

  /**
   * Start a new interview session
   */
  startSession(
    candidateName: string,
    attributeSetId: string = 'goodhang_full'
  ): SessionContext {
    const attributeSet = ATTRIBUTE_SETS[attributeSetId];
    if (!attributeSet) {
      throw new Error(`Unknown attribute set: ${attributeSetId}`);
    }

    const sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const session: InterviewSession = {
      id: sessionId,
      candidateName,
      attributeSetId,
      attributeSet,
      transcript: [],
      capturedAttributes: new Map(),
      currentScene: 'elevator',
      startedAt: new Date(),
      status: 'active',
    };

    this.sessions.set(sessionId, session);

    return this.getSessionContext(sessionId);
  }

  /**
   * Log an exchange and detect captured attributes
   */
  logExchange(
    sessionId: string,
    characterLine: string,
    candidateResponse: string,
    scene?: Scene
  ): CaptureResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const currentScene = scene || session.currentScene;

    // Add character line to transcript
    session.transcript.push({
      scene: currentScene,
      character: this.getCharacterForScene(currentScene),
      speaker: 'character',
      text: characterLine,
      timestamp: new Date(),
      exchangeNumber: Math.floor(session.transcript.length / 2),
    });

    // Add candidate response to transcript
    session.transcript.push({
      scene: currentScene,
      character: this.getCharacterForScene(currentScene),
      speaker: 'candidate',
      text: candidateResponse,
      timestamp: new Date(),
      exchangeNumber: Math.floor(session.transcript.length / 2),
    });

    // Detect captured attributes
    const newCaptures = this.detectAttributes(session, candidateResponse, currentScene);

    // Get progress
    const capturedIds = Array.from(session.capturedAttributes.keys());
    const progress = getCaptureProgress(session.attributeSetId, capturedIds);

    // Get suggestions for missing attributes
    const suggestions = this.getSuggestions(session.attributeSet, progress.missingRequired);

    return {
      newCaptures,
      progress,
      suggestions,
    };
  }

  /**
   * Transition to a new scene
   */
  transitionScene(sessionId: string, newScene: Scene): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.currentScene = newScene;
  }

  /**
   * Get current session context
   */
  getSessionContext(sessionId: string): SessionContext {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const capturedIds = Array.from(session.capturedAttributes.keys());
    const progress = getCaptureProgress(session.attributeSetId, capturedIds);

    return {
      session: {
        id: session.id,
        candidateName: session.candidateName,
        currentScene: session.currentScene,
        startedAt: session.startedAt.toISOString(),
      },
      attributeSet: {
        id: session.attributeSet.id,
        name: session.attributeSet.name,
        description: session.attributeSet.description,
        interviewStyle: session.attributeSet.interviewStyle,
        estimatedDuration: session.attributeSet.estimatedDuration,
      },
      progress: {
        captured: progress.captured,
        total: progress.total,
        percentage: progress.percentage,
        requiredComplete: progress.requiredComplete,
        missingRequired: progress.missingRequired,
      },
      characters: {
        elevator: {
          name: 'Earl',
          purpose: 'Warmup, break the ice, observe social calibration',
          exchanges: '2-3',
        },
        reception: {
          name: 'Maria',
          purpose: 'Interests, goals, communication style',
          exchanges: '3-4',
        },
        office: {
          name: 'You (Interviewer)',
          purpose: 'Deep dive across all dimensions',
          exchanges: '5-7',
        },
      },
      guidance: this.getSceneGuidance(session),
    };
  }

  /**
   * Complete the interview and run analysis
   */
  completeSession(sessionId: string): AssessmentResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';

    // Run full analysis
    return this.analyzeInterview(session);
  }

  /**
   * Abandon a session
   */
  abandonSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'abandoned';
    }
  }

  /**
   * Get all sessions for a user
   */
  listSessions(): Array<{
    id: string;
    candidateName: string;
    status: string;
    currentScene: Scene;
    progress: number;
    startedAt: string;
  }> {
    return Array.from(this.sessions.values()).map((s) => {
      const capturedIds = Array.from(s.capturedAttributes.keys());
      const progress = getCaptureProgress(s.attributeSetId, capturedIds);
      return {
        id: s.id,
        candidateName: s.candidateName,
        status: s.status,
        currentScene: s.currentScene,
        progress: progress.percentage,
        startedAt: s.startedAt.toISOString(),
      };
    });
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private getCharacterForScene(scene: Scene): 'operator' | 'receptionist' | 'interviewer' {
    switch (scene) {
      case 'elevator':
        return 'operator';
      case 'reception':
        return 'receptionist';
      case 'office':
        return 'interviewer';
    }
  }

  private getSceneGuidance(session: InterviewSession): {
    currentCharacter: string;
    sceneGoal: string;
    attributesToCapture: string[];
  } {
    const capturedIds = Array.from(session.capturedAttributes.keys());
    const progress = getCaptureProgress(session.attributeSetId, capturedIds);

    switch (session.currentScene) {
      case 'elevator':
        return {
          currentCharacter: 'Earl (elevator operator)',
          sceneGoal: 'Break the ice. Observe how they handle unexpected social moments.',
          attributesToCapture: ['personality', 'communication_style'],
        };
      case 'reception':
        return {
          currentCharacter: 'Maria (receptionist)',
          sceneGoal: 'Learn about their interests and goals. Note communication patterns.',
          attributesToCapture: ['motivation', 'passions', 'interest_vectors'],
        };
      case 'office':
        return {
          currentCharacter: 'You (interviewer)',
          sceneGoal: 'Deep dive. Capture remaining required attributes.',
          attributesToCapture: progress.missingRequired,
        };
    }
  }

  private detectAttributes(
    session: InterviewSession,
    response: string,
    scene: Scene
  ): string[] {
    const newCaptures: string[] = [];
    const responseWords = response.toLowerCase();

    // Check each attribute in the target set
    for (const attrId of session.attributeSet.attributes) {
      // Skip if already captured
      if (session.capturedAttributes.has(attrId)) continue;

      const attr = ATTRIBUTES[attrId];
      if (!attr) continue;

      // Check for signal keywords
      const hasSignal = attr.signalKeywords.some((kw) =>
        responseWords.includes(kw.toLowerCase())
      );

      // Check for anti-signal keywords (might indicate absence)
      const hasAntiSignal = attr.antiSignalKeywords.some((kw) =>
        responseWords.includes(kw.toLowerCase())
      );

      if (hasSignal && !hasAntiSignal) {
        // Calculate confidence based on keyword matches
        const matchCount = attr.signalKeywords.filter((kw) =>
          responseWords.includes(kw.toLowerCase())
        ).length;
        // More matches = higher confidence (0.6 base + 0.1 per additional match, max 0.95)
        const confidence = Math.min(0.6 + (matchCount - 1) * 0.1, 0.95);

        session.capturedAttributes.set(attrId, {
          attributeId: attrId,
          capturedAt: new Date(),
          scene,
          evidence: [response],
          confidence,
        });
        newCaptures.push(attrId);
      }
    }

    return newCaptures;
  }

  private getSuggestions(
    attributeSet: AttributeSet,
    missingRequired: string[]
  ): string[] {
    const suggestions: string[] = [];

    for (const attrId of missingRequired.slice(0, 3)) {
      const attr = ATTRIBUTES[attrId];
      if (attr?.exampleQuestions?.length) {
        suggestions.push(attr.exampleQuestions[0]);
      }
    }

    return suggestions;
  }

  private aggregateTranscript(session: InterviewSession): string {
    return session.transcript
      .filter((entry) => entry.speaker === 'candidate')
      .map((entry) => entry.text)
      .join(' ');
  }

  /**
   * Convert captured attributes to dimension score adjustments
   */
  private attributesToDimensionScores(
    capturedAttributes: Map<string, CapturedAttribute>
  ): Partial<Record<string, number>> {
    const scores: Record<string, number[]> = {
      iq: [],
      personality: [],
      motivation: [],
      work_history: [],
      passions: [],
      culture_fit: [],
      technical: [],
      gtm: [],
      eq: [],
      empathy: [],
      self_awareness: [],
    };

    // Map attributes to dimensions based on category and ID
    for (const [attrId, captured] of capturedAttributes) {
      const attr = ATTRIBUTES[attrId];
      if (!attr) continue;

      // Convert confidence (0-1) to score adjustment (0-10)
      const score = captured.confidence * 10;

      // Map by attribute ID first (direct matches)
      if (scores[attrId] !== undefined) {
        scores[attrId].push(score);
      }

      // Then map by category
      switch (attr.category) {
        case 'cognitive':
          scores.iq.push(score * 0.5);
          scores.technical.push(score * 0.5);
          break;
        case 'emotional':
          scores.eq.push(score);
          if (attrId === 'empathy') scores.empathy.push(score);
          if (attrId === 'self_awareness') scores.self_awareness.push(score);
          break;
        case 'professional':
          scores.work_history.push(score * 0.5);
          if (attrId === 'communication') scores.personality.push(score * 0.5);
          if (attrId === 'leadership') scores.personality.push(score * 0.3);
          break;
        case 'motivation':
          scores.motivation.push(score);
          scores.passions.push(score * 0.5);
          break;
        case 'personality':
          scores.personality.push(score);
          break;
        case 'cultural':
          scores.culture_fit.push(score);
          break;
        case 'relationship':
          scores.empathy.push(score * 0.5);
          scores.culture_fit.push(score * 0.3);
          break;
        case 'identity':
          scores.self_awareness.push(score * 0.5);
          scores.motivation.push(score * 0.3);
          break;
      }
    }

    // Average the scores for each dimension
    const result: Partial<Record<string, number>> = {};
    for (const [dim, values] of Object.entries(scores)) {
      if (values.length > 0) {
        result[dim] = values.reduce((a, b) => a + b, 0) / values.length;
      }
    }

    return result;
  }

  /**
   * Determine archetype from captured attributes
   */
  private attributesToArchetype(
    capturedAttributes: Map<string, CapturedAttribute>
  ): { primary: string; scores: Record<string, number> } {
    const archetypeSignals: Record<string, number> = {
      technical_builder: 0,
      gtm_operator: 0,
      creative_strategist: 0,
      execution_machine: 0,
      generalist_orchestrator: 0,
      domain_expert: 0,
    };

    for (const [attrId, captured] of capturedAttributes) {
      const attr = ATTRIBUTES[attrId];
      if (!attr) continue;

      const weight = captured.confidence;

      // Map attributes to archetypes
      switch (attrId) {
        case 'technical':
        case 'ai_readiness':
          archetypeSignals.technical_builder += weight * 2;
          break;
        case 'iq':
        case 'problem_solving':
          archetypeSignals.technical_builder += weight;
          archetypeSignals.creative_strategist += weight * 0.5;
          break;
        case 'communication':
        case 'social_style':
          archetypeSignals.gtm_operator += weight * 1.5;
          archetypeSignals.generalist_orchestrator += weight * 0.5;
          break;
        case 'leadership':
          archetypeSignals.execution_machine += weight;
          archetypeSignals.gtm_operator += weight * 0.5;
          break;
        case 'creativity':
        case 'passions':
          archetypeSignals.creative_strategist += weight * 1.5;
          break;
        case 'execution_ability':
        case 'work_history':
          archetypeSignals.execution_machine += weight * 1.5;
          break;
        case 'domain_expertise':
          archetypeSignals.domain_expert += weight * 2;
          break;
        case 'collaboration':
        case 'team_fit':
          archetypeSignals.generalist_orchestrator += weight;
          break;
      }

      // Category-based signals
      switch (attr.category) {
        case 'cognitive':
          archetypeSignals.technical_builder += weight * 0.3;
          break;
        case 'professional':
          archetypeSignals.execution_machine += weight * 0.2;
          break;
        case 'relationship':
          archetypeSignals.generalist_orchestrator += weight * 0.3;
          break;
      }
    }

    // Normalize and find primary
    const maxScore = Math.max(...Object.values(archetypeSignals), 1);
    const normalized = Object.fromEntries(
      Object.entries(archetypeSignals).map(([k, v]) => [k, v / maxScore])
    ) as Record<string, number>;

    const sorted = Object.entries(normalized).sort(([, a], [, b]) => b - a);
    return {
      primary: sorted[0][0],
      scores: normalized,
    };
  }

  private analyzeInterview(session: InterviewSession): AssessmentResult {
    const now = new Date();
    const durationMs = now.getTime() - session.startedAt.getTime();

    // 1. Aggregate all candidate responses
    const aggregatedText = this.aggregateTranscript(session);

    // 2. Score the interview across all dimensions (transcript-based)
    const interviewScore = scoreInterview(aggregatedText, { includeFlags: true });

    // 3. Get attribute-based dimension scores
    const attributeScores = this.attributesToDimensionScores(session.capturedAttributes);

    // 4. Blend transcript and attribute scores (attribute-weighted when available)
    const blendedDimensions = { ...interviewScore.dimensions };
    for (const [dim, attrScore] of Object.entries(attributeScores)) {
      if (attrScore !== undefined && blendedDimensions[dim as keyof typeof blendedDimensions]) {
        const transcriptScore = blendedDimensions[dim as keyof typeof blendedDimensions].score;
        // Weight attribute scores more heavily (60%) when we have them
        blendedDimensions[dim as keyof typeof blendedDimensions].score =
          transcriptScore * 0.4 + attrScore * 0.6;
      }
    }

    // 5. Detect competency signals for archetype classification
    const competencyProfile = interviewScorer.detectCompetencySignals(aggregatedText);

    // 6. Get attribute-based archetype signals
    const attributeArchetype = this.attributesToArchetype(session.capturedAttributes);

    // 7. Classify archetype (blending attribute signals with competency profile)
    const archetypeResult = classifyArchetype(blendedDimensions, competencyProfile);

    // If attribute-based archetype is strong and different, consider it
    const attributePrimary = attributeArchetype.primary as any;
    const attributeConfidence = attributeArchetype.scores[attributePrimary] || 0;
    const finalArchetype =
      attributeConfidence > 0.7 && session.capturedAttributes.size >= 5
        ? attributePrimary
        : archetypeResult.primary;

    // 8. Analyze emotional content
    const emotionAnalysis = analyzeTextEmotion(aggregatedText);

    // 9. Recalculate overall score and tier from blended dimensions
    const overallScore =
      Object.values(blendedDimensions).reduce((sum, d) => sum + d.score, 0) /
      Object.values(blendedDimensions).length;

    const tier =
      overallScore >= 8.5 ? 'top_1%' :
      overallScore >= 7 ? 'strong' :
      overallScore >= 5 ? 'moderate' :
      overallScore >= 3 ? 'weak' : 'pass';

    // 10. Build AssessmentResult
    return {
      candidateName: session.candidateName,
      transcript: session.transcript,
      dimensions: blendedDimensions,
      competencies: competencyProfile,
      emotions: emotionAnalysis,
      archetype: {
        primary: finalArchetype,
        secondary: archetypeResult.secondary,
        confidence: Math.max(archetypeResult.primaryScore, attributeConfidence),
        allScores: {
          ...archetypeResult.allScores,
          ...attributeArchetype.scores,
        },
      },
      tier,
      overallScore,
      greenFlags: interviewScore.greenFlags,
      redFlags: interviewScore.redFlags,
      completedAt: now,
      durationMs,
    };
  }
}

// =============================================================================
// SINGLETON & CONVENIENCE
// =============================================================================

/**
 * Create a new session manager instance
 */
export function createSessionManager(): SessionManager {
  return new SessionManager();
}
