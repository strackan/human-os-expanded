/**
 * Conductor Engine
 *
 * Main engine that manages an interview session through 3 scenes:
 * elevator -> reception -> office
 *
 * Handles state management, scene transitions, and final scoring.
 */

import type {
  InterviewState,
  ScenePrompt,
  InterviewComplete,
  AssessmentResult,
  TranscriptEntry,
  Scene,
} from './types.js';

import {
  SCENES,
  getNextScene,
  getFollowUpPrompt,
  shouldTransition,
  getTotalExpectedExchanges,
} from './scenes.js';

import { scoreInterview, classifyArchetype, interviewScorer } from '../scoring/index.js';
import { analyzeTextEmotion } from '../core/index.js';

// =============================================================================
// CONDUCTOR ENGINE CLASS
// =============================================================================

export class ConductorEngine {
  private state: InterviewState | null = null;

  /**
   * Start a new interview session
   */
  startInterview(candidateName: string): ScenePrompt {
    const now = new Date();
    const scene: Scene = 'elevator';
    const config = SCENES[scene];

    // Initialize state
    this.state = {
      candidateName,
      currentScene: scene,
      currentExchange: 0,
      transcript: [],
      startedAt: now,
      sceneStartedAt: now,
    };

    // Add Earl's opening line to transcript
    this.addToTranscript('character', config.openingLine);

    return {
      scene,
      character: config.character,
      characterName: config.characterName,
      prompt: config.openingLine,
      isTransition: false,
      exchangeNumber: 0,
      totalExchanges: getTotalExpectedExchanges(),
    };
  }

  /**
   * Process a candidate response and return the next prompt or completion
   */
  processResponse(response: string): ScenePrompt | InterviewComplete {
    if (!this.state) {
      throw new Error('Interview not started. Call startInterview() first.');
    }

    const { currentScene } = this.state;
    const config = SCENES[currentScene];

    // 1. Add candidate response to transcript
    this.addToTranscript('candidate', response);
    this.state.currentExchange++;

    // 2. Check if current scene is complete
    if (shouldTransition(currentScene, this.state.currentExchange)) {
      const nextScene = getNextScene(currentScene);

      // 3. If 'office' complete, run analysis and return completion
      if (nextScene === null) {
        return this.completeInterview();
      }

      // 4. Transition to next scene
      return this.transitionToScene(nextScene, config.transitionLine);
    }

    // 5. Otherwise, return a follow-up prompt
    const followUpPrompt = getFollowUpPrompt(currentScene, this.state.currentExchange);
    this.addToTranscript('character', followUpPrompt);

    return {
      scene: currentScene,
      character: config.character,
      characterName: config.characterName,
      prompt: followUpPrompt,
      isTransition: false,
      exchangeNumber: this.state.currentExchange,
      totalExchanges: getTotalExpectedExchanges(),
    };
  }

  /**
   * Get current interview state (for status checks)
   */
  getState(): InterviewState | null {
    return this.state;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Add an entry to the transcript
   */
  private addToTranscript(speaker: 'character' | 'candidate', text: string): void {
    if (!this.state) return;

    const entry: TranscriptEntry = {
      scene: this.state.currentScene,
      character: SCENES[this.state.currentScene].character,
      speaker,
      text,
      timestamp: new Date(),
      exchangeNumber: this.state.currentExchange,
    };

    this.state.transcript.push(entry);
  }

  /**
   * Transition to the next scene
   */
  private transitionToScene(nextScene: Scene, transitionLine: string): ScenePrompt {
    if (!this.state) {
      throw new Error('Interview not started.');
    }

    // Add transition line from current character
    this.addToTranscript('character', transitionLine);

    // Update state for new scene
    this.state.currentScene = nextScene;
    this.state.currentExchange = 0;
    this.state.sceneStartedAt = new Date();

    const nextConfig = SCENES[nextScene];

    // Add new character's opening line
    this.addToTranscript('character', nextConfig.openingLine);

    return {
      scene: nextScene,
      character: nextConfig.character,
      characterName: nextConfig.characterName,
      prompt: nextConfig.openingLine,
      isTransition: true,
      exchangeNumber: 0,
      totalExchanges: getTotalExpectedExchanges(),
    };
  }

  /**
   * Complete the interview and run full analysis
   */
  private completeInterview(): InterviewComplete {
    if (!this.state) {
      throw new Error('Interview not started.');
    }

    // Add final transition line from interviewer
    const officeConfig = SCENES.office;
    this.addToTranscript('character', officeConfig.transitionLine);

    // Run analysis
    const result = this.analyzeInterview();

    return {
      complete: true,
      transcript: this.state.transcript,
      result,
    };
  }

  /**
   * Aggregate all candidate responses into one text for scoring
   */
  private aggregateTranscript(): string {
    if (!this.state) return '';

    return this.state.transcript
      .filter((entry) => entry.speaker === 'candidate')
      .map((entry) => entry.text)
      .join(' ');
  }

  /**
   * Run full analysis on the completed interview
   */
  private analyzeInterview(): AssessmentResult {
    if (!this.state) {
      throw new Error('Interview not started.');
    }

    const now = new Date();
    const durationMs = now.getTime() - this.state.startedAt.getTime();

    // 1. Aggregate all candidate responses
    const aggregatedText = this.aggregateTranscript();

    // 2. Score the interview across all dimensions
    const interviewScore = scoreInterview(aggregatedText, { includeFlags: true });

    // 3. Detect competency signals for archetype classification
    const competencyProfile = interviewScorer.detectCompetencySignals(aggregatedText);

    // 4. Classify archetype based on dimension scores and competency profile
    const archetypeResult = classifyArchetype(
      interviewScore.dimensions,
      competencyProfile
    );

    // 5. Analyze emotional content
    const emotionAnalysis = analyzeTextEmotion(aggregatedText);

    // 6. Build AssessmentResult
    const result: AssessmentResult = {
      candidateName: this.state.candidateName,
      transcript: this.state.transcript,

      // Raw 11-dimension scores
      dimensions: interviewScore.dimensions,

      // Competency profile from signal detection
      competencies: competencyProfile,

      // Emotional analysis
      emotions: emotionAnalysis,

      // Archetype classification
      archetype: {
        primary: archetypeResult.primary,
        secondary: archetypeResult.secondary,
        confidence: archetypeResult.primaryScore,
        allScores: archetypeResult.allScores,
      },

      // Tier and overall score
      tier: interviewScore.tier,
      overallScore: interviewScore.overallScore,

      // Flags
      greenFlags: interviewScore.greenFlags,
      redFlags: interviewScore.redFlags,

      // Metadata
      completedAt: now,
      durationMs,
    };

    return result;
  }
}

// =============================================================================
// SINGLETON & CONVENIENCE
// =============================================================================

/**
 * Create a new conductor engine instance
 */
export function createConductorEngine(): ConductorEngine {
  return new ConductorEngine();
}
