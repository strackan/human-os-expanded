/**
 * Voice Engine
 *
 * Core engine for loading and working with voice packs.
 */

import { z } from 'zod';
import {
  ContextEngine,
  type Layer,
} from '@human-os/core';
import type {
  VoicePack,
  VoiceConfig,
  Template,
  Blend,
  CurrentState,
  GenerateRequest,
  GenerateResult,
  AnalyzeRequest,
  AnalyzeResult,
} from './types.js';

/**
 * Voice file name mappings
 */
const VOICE_FILES = {
  WRITING_ENGINE: '01_WRITING_ENGINE',
  TEMPLATE_COMPONENTS: '02_TEMPLATE_COMPONENTS',
  BLEND_RECIPES: '04_BLEND_RECIPES',
  CONVERSATION_PROTOCOLS: '05_CONVERSATION_PROTOCOLS',
  CRISIS_PROTOCOLS: '07_CRISIS_PROTOCOLS',
  CURRENT_STATE: '08_CURRENT_STATE',
} as const;

/**
 * Voice Engine class
 */
export class VoiceEngine {
  private contextEngine: ContextEngine;
  private cache: Map<string, VoicePack> = new Map();

  constructor(contextEngine: ContextEngine) {
    this.contextEngine = contextEngine;
  }

  /**
   * Load a voice pack by slug
   */
  async loadVoicePack(packSlug: string): Promise<VoicePack | null> {
    // Check cache first
    if (this.cache.has(packSlug)) {
      return this.cache.get(packSlug)!;
    }

    const layer = `founder:${packSlug}` as Layer;

    // Load writing engine (main config)
    const writingEngine = await this.contextEngine.getContext(
      layer,
      'voice',
      VOICE_FILES.WRITING_ENGINE
    );

    if (!writingEngine) {
      return null;
    }

    // Load templates
    const templatesFile = await this.contextEngine.getContext(
      layer,
      'voice',
      VOICE_FILES.TEMPLATE_COMPONENTS
    );

    // Load blends
    const blendsFile = await this.contextEngine.getContext(
      layer,
      'voice',
      VOICE_FILES.BLEND_RECIPES
    );

    // Load current state
    const currentStateFile = await this.contextEngine.getContext(
      layer,
      'voice',
      VOICE_FILES.CURRENT_STATE
    );

    // Parse and construct voice pack
    const fm = writingEngine.frontmatter ?? {};
    const voicePack: VoicePack = {
      slug: packSlug,
      name: String(fm.name ?? packSlug),
      description: String(fm.description ?? ''),
      version: String(fm.version ?? '1.0.0'),
      author: String(fm.author ?? 'Unknown'),
      voice: this.parseVoiceConfig(writingEngine.content),
      templates: templatesFile ? this.parseTemplates(templatesFile.content) : [],
      blends: blendsFile ? this.parseBlends(blendsFile.content) : [],
      currentState: currentStateFile ? this.parseCurrentState(currentStateFile.content) : undefined,
    };

    // Cache the loaded pack
    this.cache.set(packSlug, voicePack);

    return voicePack;
  }

  /**
   * Get voice configuration for generation
   */
  async getGenerationContext(
    packSlug: string,
    request: GenerateRequest
  ): Promise<{
    voicePack: VoicePack;
    template: Template | null;
    blend: Blend | null;
    effectiveConfig: VoiceConfig;
  } | null> {
    const voicePack = await this.loadVoicePack(packSlug);
    if (!voicePack) return null;

    // Find template
    const template = voicePack.templates.find(t => t.slug === request.template) || null;

    // Find blend if specified
    const blend = request.blend
      ? voicePack.blends.find(b => b.slug === request.blend) || null
      : null;

    // Apply blend adjustments if present
    const effectiveConfig = blend
      ? this.applyBlend(voicePack.voice, blend)
      : voicePack.voice;

    return {
      voicePack,
      template,
      blend,
      effectiveConfig,
    };
  }

  /**
   * Prepare context for LLM generation
   */
  async prepareGenerationPrompt(
    packSlug: string,
    request: GenerateRequest
  ): Promise<{
    systemPrompt: string;
    userPrompt: string;
  } | null> {
    const context = await this.getGenerationContext(packSlug, request);
    if (!context) return null;

    const { voicePack, template, effectiveConfig } = context;

    // Build system prompt with voice configuration
    const systemPrompt = this.buildSystemPrompt(voicePack, effectiveConfig, template);

    // Build user prompt with request specifics
    const userPrompt = this.buildUserPrompt(request, template);

    return { systemPrompt, userPrompt };
  }

  /**
   * Get analysis context for comparing text to voice
   */
  async getAnalysisContext(
    packSlug: string
  ): Promise<{ voicePack: VoicePack; analysisPrompt: string } | null> {
    const voicePack = await this.loadVoicePack(packSlug);
    if (!voicePack) return null;

    const analysisPrompt = this.buildAnalysisPrompt(voicePack);

    return { voicePack, analysisPrompt };
  }

  /**
   * List available templates in a voice pack
   */
  async listTemplates(packSlug: string): Promise<Template[]> {
    const voicePack = await this.loadVoicePack(packSlug);
    return voicePack?.templates || [];
  }

  /**
   * List available blends in a voice pack
   */
  async listBlends(packSlug: string): Promise<Blend[]> {
    const voicePack = await this.loadVoicePack(packSlug);
    return voicePack?.blends || [];
  }

  /**
   * Update current state
   */
  async updateCurrentState(packSlug: string, updates: Partial<CurrentState>): Promise<void> {
    const voicePack = await this.loadVoicePack(packSlug);
    if (!voicePack) return;

    const newState: CurrentState = {
      ...voicePack.currentState,
      ...updates,
    } as CurrentState;

    // Save to context
    const content = this.serializeCurrentState(newState);
    await this.contextEngine.saveContext(
      `founder:${packSlug}` as Layer,
      'voice',
      VOICE_FILES.CURRENT_STATE,
      content
    );

    // Update cache
    voicePack.currentState = newState;
  }

  /**
   * Clear cache for a specific pack or all packs
   */
  clearCache(packSlug?: string): void {
    if (packSlug) {
      this.cache.delete(packSlug);
    } else {
      this.cache.clear();
    }
  }

  // Private parsing methods

  private parseVoiceConfig(content: string): VoiceConfig {
    // Parse markdown content into VoiceConfig
    // This is a simplified parser - real implementation would be more robust
    return {
      style: {
        tone: this.extractList(content, 'tone') || ['professional'],
        formality: 'conversational',
        humor: 'subtle',
        directness: 'direct',
      },
      patterns: {
        sentenceLength: 'varied',
        paragraphLength: 'medium',
        transitions: this.extractList(content, 'transitions') || [],
        openers: this.extractList(content, 'openers') || [],
        closers: this.extractList(content, 'closers') || [],
      },
      signatures: {
        phrases: this.extractList(content, 'signature phrases') || [],
        metaphors: this.extractList(content, 'metaphors') || [],
        references: this.extractList(content, 'references') || [],
        avoidPhrases: this.extractList(content, 'avoid') || [],
      },
      contextRules: [],
    };
  }

  private parseTemplates(content: string): Template[] {
    // Parse markdown content into Template[]
    // Simplified implementation
    return [];
  }

  private parseBlends(content: string): Blend[] {
    // Parse markdown content into Blend[]
    // Simplified implementation
    return [];
  }

  private parseCurrentState(content: string): CurrentState {
    // Parse markdown content into CurrentState
    return {
      recentTopics: [],
      mood: 'focused',
      activeProjects: [],
      primaryAudience: '',
      recentPosts: [],
    };
  }

  private extractList(content: string, keyword: string): string[] | null {
    // Extract list items after a keyword in markdown
    const regex = new RegExp(`${keyword}[:\\s]*\\n((?:-\\s+.+\\n?)+)`, 'i');
    const match = content.match(regex);
    if (!match?.[1]) return null;

    return match[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s+/, '').trim());
  }

  private applyBlend(baseConfig: VoiceConfig, blend: Blend): VoiceConfig {
    // Apply blend adjustments to base config
    // Simplified implementation - would weight and merge aspects
    return baseConfig;
  }

  private buildSystemPrompt(
    voicePack: VoicePack,
    config: VoiceConfig,
    template: Template | null
  ): string {
    let prompt = `You are writing in the voice of ${voicePack.name}.\n\n`;

    prompt += `## Voice Characteristics\n`;
    prompt += `- Tone: ${config.style.tone.join(', ')}\n`;
    prompt += `- Formality: ${config.style.formality}\n`;
    prompt += `- Humor: ${config.style.humor}\n`;
    prompt += `- Directness: ${config.style.directness}\n\n`;

    if (config.signatures.phrases.length > 0) {
      prompt += `## Signature Phrases\n`;
      config.signatures.phrases.forEach(p => {
        prompt += `- "${p}"\n`;
      });
      prompt += '\n';
    }

    if (config.signatures.avoidPhrases.length > 0) {
      prompt += `## Phrases to Avoid\n`;
      config.signatures.avoidPhrases.forEach(p => {
        prompt += `- "${p}"\n`;
      });
      prompt += '\n';
    }

    if (template) {
      prompt += `## Template: ${template.name}\n`;
      prompt += `${template.description}\n\n`;
      prompt += `### Structure\n`;
      template.structure.forEach(section => {
        prompt += `- ${section.name} (${section.type}): ${section.guidelines}\n`;
      });
    }

    return prompt;
  }

  private buildUserPrompt(request: GenerateRequest, template: Template | null): string {
    let prompt = '';

    if (request.parameters?.platform) {
      prompt += `Platform: ${request.parameters.platform}\n`;
    }
    if (request.parameters?.audience) {
      prompt += `Audience: ${request.parameters.audience}\n`;
    }
    if (request.parameters?.length) {
      prompt += `Length: ${request.parameters.length}\n`;
    }
    if (request.parameters?.tone) {
      prompt += `Tone adjustment: ${request.parameters.tone}\n`;
    }

    if (request.context) {
      prompt += `\nContext:\n${JSON.stringify(request.context, null, 2)}\n`;
    }

    return prompt;
  }

  private buildAnalysisPrompt(voicePack: VoicePack): string {
    return `Analyze the provided text and compare it to ${voicePack.name}'s voice characteristics.

Voice Profile:
- Tone: ${voicePack.voice.style.tone.join(', ')}
- Formality: ${voicePack.voice.style.formality}
- Directness: ${voicePack.voice.style.directness}

Evaluate:
1. Overall voice match score (0-100)
2. Which aspects align with the voice
3. Which aspects diverge from the voice
4. Suggestions for improvement`;
  }

  private serializeCurrentState(state: CurrentState): string {
    return `---
title: Current State
updated: ${new Date().toISOString()}
---

# Current State

## Mood
${state.mood}

## Primary Audience
${state.primaryAudience}

## Recent Topics
${state.recentTopics.map(t => `- ${t}`).join('\n')}

## Active Projects
${state.activeProjects.map(p => `- ${p}`).join('\n')}

## Recent Posts
${state.recentPosts.map(p => `- ${p.date}: ${p.topic} (${p.platform})`).join('\n')}
`;
  }
}
