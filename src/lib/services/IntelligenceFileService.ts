/**
 * Intelligence File Service
 *
 * Synthesizes and maintains longitudinal candidate profiles
 * across multiple interview sessions (Release 1.6)
 *
 * Core Functions:
 * - Initialize intelligence file from initial session
 * - Update intelligence file from check-in sessions
 * - Calculate relationship strength (cold/warm/hot)
 * - Extract insights from transcripts
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IntelligenceFile,
  InterviewSession,
  RelationshipStrength,
  InterviewMessage,
  CandidateAnalysis,
} from '@/types/talent';

export class IntelligenceFileService {
  /**
   * Initialize intelligence file from initial interview session
   *
   * @param candidateId - Candidate UUID
   * @param session - Initial interview session data
   * @param supabaseClient - Supabase client
   * @returns Newly created intelligence file
   */
  static async initializeFromSession(
    candidateId: string,
    session: Partial<InterviewSession> & {
      transcript: InterviewMessage[];
      analysis?: CandidateAnalysis;
    },
    email: string,
    name: string,
    supabaseClient: SupabaseClient
  ): Promise<IntelligenceFile> {
    const now = new Date().toISOString();

    // Extract basic profile info from transcript and analysis
    const profileData = this.extractProfileFromTranscript(
      session.transcript,
      session.analysis
    );

    const intelligenceFile: IntelligenceFile = {
      // Identity
      name,
      email,
      linkedin_url: profileData.linkedin_url,

      // Professional Profile
      current_role: profileData.current_role || 'Unknown',
      company: profileData.company || 'Unknown',
      career_trajectory: profileData.career_trajectory || [],

      // Skills & Expertise
      technical_skills: profileData.technical_skills || [],
      domain_expertise: profileData.domain_expertise || [],
      skill_evolution: [],

      // Projects & Artifacts
      projects: [],

      // Personal Context
      life_context: {
        location: profileData.location,
        family: profileData.family,
        hobbies: profileData.hobbies,
        last_updated: now,
      },

      // Motivations & Goals
      current_motivation: {
        seeking: profileData.seeking || 'exploring opportunities',
        ideal_role: profileData.ideal_role || 'Unknown',
        deal_breakers: profileData.deal_breakers || [],
        must_haves: profileData.must_haves || [],
        updated: now,
      },

      // Relationship Metadata
      first_contact: now,
      last_contact: now,
      total_sessions: 1,
      relationship_strength: 'cold', // First session = cold

      // Session Timeline
      session_timeline: [
        {
          session_id: session.id || 'initial',
          date: now,
          type: 'initial',
          key_updates: ['Initial interview completed'],
          sentiment: session.sentiment || 'exploring',
        },
      ],

      // AI's Understanding
      archetype: session.analysis?.archetype || 'Generalist Orchestrator',
      archetype_confidence: session.analysis?.archetype_confidence || 'medium',
      strengths: this.extractStrengths(session.analysis),
      growth_areas: this.extractGrowthAreas(session.analysis),
      best_fit_at_renubu: session.analysis?.best_fit_roles || [],
    };

    // Save to database
    await this.saveIntelligenceFile(candidateId, intelligenceFile, supabaseClient);

    return intelligenceFile;
  }

  /**
   * Update intelligence file from check-in session
   *
   * @param candidateId - Candidate UUID
   * @param existingFile - Current intelligence file
   * @param session - Check-in session data
   * @param supabaseClient - Supabase client
   * @returns Updated intelligence file
   */
  static async updateFromCheckIn(
    candidateId: string,
    existingFile: IntelligenceFile,
    session: Partial<InterviewSession> & {
      transcript: InterviewMessage[];
      updates?: Record<string, unknown>;
    },
    supabaseClient: SupabaseClient
  ): Promise<IntelligenceFile> {
    const now = new Date().toISOString();

    // Extract updates from transcript
    const updates = this.extractUpdatesFromTranscript(
      session.transcript,
      existingFile
    );

    // Update career trajectory if role/company changed
    if (updates.current_role && updates.current_role !== existingFile.current_role) {
      existingFile.career_trajectory.push({
        role: existingFile.current_role,
        company: existingFile.company,
        timeframe: `${existingFile.last_contact} - ${now}`,
        learned_from_session: session.id || 'check-in',
      });
      existingFile.current_role = updates.current_role;
      existingFile.company = updates.company || existingFile.company;
    }

    // Update skills
    if (updates.new_skills && updates.new_skills.length > 0) {
      updates.new_skills.forEach((skill: string) => {
        if (!existingFile.technical_skills.includes(skill)) {
          existingFile.technical_skills.push(skill);
          existingFile.skill_evolution.push({
            skill,
            added_date: now,
            proficiency: 'learning',
          });
        }
      });
    }

    // Update projects
    if (updates.projects && updates.projects.length > 0) {
      existingFile.projects.push(...updates.projects);
    }

    // Update life context
    if (updates.life_updates) {
      existingFile.life_context = {
        ...existingFile.life_context,
        ...updates.life_updates,
        last_updated: now,
      };
    }

    // Update motivations
    if (updates.motivation_changes) {
      existingFile.current_motivation = {
        ...existingFile.current_motivation,
        ...updates.motivation_changes,
        updated: now,
      };
    }

    // Update relationship metadata
    existingFile.last_contact = now;
    existingFile.total_sessions += 1;
    existingFile.relationship_strength = this.calculateRelationshipStrength(
      existingFile.first_contact,
      now,
      existingFile.total_sessions
    );

    // Add to session timeline
    existingFile.session_timeline.push({
      session_id: session.id || `check-in-${existingFile.total_sessions}`,
      date: now,
      type: session.session_type || 'check_in',
      key_updates: updates.key_insights || ['Check-in completed'],
      sentiment: session.sentiment || 'content',
    });

    // Save updated file
    await this.saveIntelligenceFile(candidateId, existingFile, supabaseClient);

    // Update candidate check-in metadata
    await supabaseClient
      .from('candidates')
      .update({
        last_check_in: now,
        check_in_count: existingFile.total_sessions - 1, // Subtract initial session
        relationship_strength: existingFile.relationship_strength,
        updated_at: now,
      })
      .eq('id', candidateId);

    return existingFile;
  }

  /**
   * Calculate relationship strength based on recency, frequency, and engagement
   *
   * Rules:
   * - cold: >6 months since last contact OR only 1 session
   * - warm: 2-3 sessions OR last contact <6 months
   * - hot: 3+ sessions AND last contact <3 months AND actively seeking
   *
   * @param firstContact - ISO date string
   * @param lastContact - ISO date string
   * @param totalSessions - Number of total sessions
   * @returns Relationship strength
   */
  static calculateRelationshipStrength(
    firstContact: string,
    lastContact: string,
    totalSessions: number
  ): RelationshipStrength {
    const now = Date.now();
    const lastContactTime = new Date(lastContact).getTime();
    const daysSinceLastContact = (now - lastContactTime) / (1000 * 60 * 60 * 24);

    // Cold: >6 months or only 1 session
    if (daysSinceLastContact > 180 || totalSessions === 1) {
      return 'cold';
    }

    // Hot: 3+ sessions AND <3 months
    if (totalSessions >= 3 && daysSinceLastContact < 90) {
      return 'hot';
    }

    // Warm: everything else
    return 'warm';
  }

  /**
   * Save intelligence file to database
   */
  private static async saveIntelligenceFile(
    candidateId: string,
    intelligenceFile: IntelligenceFile,
    supabaseClient: SupabaseClient
  ): Promise<void> {
    await supabaseClient
      .from('candidates')
      .update({
        intelligence_file: intelligenceFile,
        relationship_strength: intelligenceFile.relationship_strength,
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId);
  }

  /**
   * Extract profile information from initial transcript
   */
  private static extractProfileFromTranscript(
    transcript: InterviewMessage[],
    analysis?: CandidateAnalysis
  ): Partial<IntelligenceFile> {
    // This is a simplified extraction
    // In a real implementation, you'd use NLP or Claude API to extract structured data

    const extracted: Record<string, string[]> = {
      technical_skills: [],
      domain_expertise: [],
      career_trajectory: [],
    };

    // Extract from transcript content (basic keyword matching)
    const fullText = transcript.map((m) => m.content).join(' ').toLowerCase();

    // Extract skills (basic approach - look for common tech keywords)
    const skillKeywords = [
      'python', 'javascript', 'typescript', 'react', 'node', 'aws', 'docker',
      'kubernetes', 'sql', 'nosql', 'machine learning', 'data science'
    ];
    extracted.technical_skills = skillKeywords.filter((skill) =>
      fullText.includes(skill.toLowerCase())
    );

    // Use analysis data if available
    if (analysis) {
      extracted.archetype = analysis.archetype;
      extracted.archetype_confidence = analysis.archetype_confidence;
    }

    return extracted;
  }

  /**
   * Extract updates from check-in transcript
   */
  private static extractUpdatesFromTranscript(
    transcript: InterviewMessage[],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _existingFile: IntelligenceFile
  ): Record<string, unknown> {
    // Simplified extraction - in production, use Claude API or NLP
    const updates: Record<string, unknown> = {
      new_skills: [],
      projects: [],
      key_insights: [],
    };

    const fullText = transcript.map((m) => m.content).join(' ');

    // Basic extraction logic
    if (fullText.toLowerCase().includes('new role') || fullText.toLowerCase().includes('joined')) {
      updates.current_role = 'Updated Role'; // In production, extract actual role
    }

    updates.key_insights.push('Check-in conversation completed');

    return updates;
  }

  /**
   * Extract strengths from analysis
   */
  private static extractStrengths(analysis?: CandidateAnalysis): string[] {
    if (!analysis) return ['Strong communicator', 'Quick learner'];

    const strengths: string[] = [];

    // Extract from dimensions
    if (analysis.dimensions) {
      if (analysis.dimensions.iq >= 80) strengths.push('High intellectual capacity');
      if (analysis.dimensions.eq >= 80) strengths.push('Strong emotional intelligence');
      if (analysis.dimensions.technical >= 80) strengths.push('Technical expertise');
      if (analysis.dimensions.motivation >= 80) strengths.push('Highly motivated');
    }

    // Extract from green flags
    if (analysis.flags?.green_flags) {
      strengths.push(...analysis.flags.green_flags);
    }

    return strengths.length > 0 ? strengths : ['Strong potential'];
  }

  /**
   * Extract growth areas from analysis
   */
  private static extractGrowthAreas(analysis?: CandidateAnalysis): string[] {
    if (!analysis) return ['Needs more context to assess'];

    const growthAreas: string[] = [];

    // Extract from dimensions
    if (analysis.dimensions) {
      if (analysis.dimensions.technical < 60) growthAreas.push('Technical skills development');
      if (analysis.dimensions.eq < 60) growthAreas.push('Emotional intelligence');
      if (analysis.dimensions.culture_fit < 60) growthAreas.push('Culture alignment');
    }

    // Extract from red flags (without being too harsh)
    if (analysis.flags?.red_flags && analysis.flags.red_flags.length > 0) {
      growthAreas.push('Areas to watch');
    }

    return growthAreas.length > 0 ? growthAreas : ['Continue developing expertise'];
  }
}
