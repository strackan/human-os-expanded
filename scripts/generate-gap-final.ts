/**
 * Generate GAP_ANALYSIS_FINAL.md from Sculptor Transcript
 *
 * This script:
 * 1. Reads the SCULPTOR_TRANSCRIPT.md from storage (or local file)
 * 2. Analyzes it against Question E questions (E01-E24)
 * 3. Uses Claude to determine which questions were already answered
 * 4. Generates GAP_ANALYSIS_FINAL.md
 * 5. Uploads to correct bucket (human-os/contexts/{entity}/)
 *
 * Usage:
 *   npx tsx scripts/generate-gap-final.ts scott
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from apps/goodhang/.env.local
config({ path: path.join(__dirname, '..', 'apps', 'goodhang', '.env.local') });

const supabase = createClient(
  'https://zulowgscotdrqlccomht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bG93Z3Njb3RkcnFsY2NvbWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTUwNjg2OSwiZXhwIjoyMDgxMDgyODY5fQ.1TaHY99JRt7ABGRZMMg5n_F7qwQc5H1UHkcOuUfdt8o'
);

// Initialize Anthropic client (uses ANTHROPIC_API_KEY env var)
const anthropic = new Anthropic();

const BUCKET = 'human-os';

// Question E definitions (E01-E24)
const QUESTION_E = [
  { id: 'E01', section: 'decision-making', text: "When you're facing a big decision and feeling overwhelmed, what does that look like for you?" },
  { id: 'E02', section: 'decision-making', text: "When you have too many options, what's your default response?" },
  { id: 'E03', section: 'decision-making', text: 'Do you prefer someone to present options, make recommendations, or just make the call?' },
  { id: 'E04', section: 'decision-making', text: 'What kinds of decisions drain you the most? What kinds energize you?' },
  { id: 'E05', section: 'energy-cognitive', text: "When are you at your best? Time of day, conditions, context?" },
  { id: 'E06', section: 'energy-cognitive', text: 'What drains you faster than people might expect?' },
  { id: 'E07', section: 'energy-cognitive', text: "How do you know when you're avoiding something? What does that look like?" },
  { id: 'E08', section: 'energy-cognitive', text: 'What does your "overwhelm spiral" look like?' },
  { id: 'E09', section: 'energy-cognitive', text: 'Do you have any neurodivergent patterns that affect how you work?' },
  { id: 'E10', section: 'energy-cognitive', text: 'What kind of structure helps you? What kind feels constraining?' },
  { id: 'E11', section: 'communication', text: 'When working with someone, do you prefer direct recommendations, facilitated thinking, or minimal check-ins?' },
  { id: 'E12', section: 'communication', text: 'What kind of input feels helpful vs. annoying?' },
  { id: 'E13', section: 'communication', text: "How should someone push back on you if they think you're wrong?" },
  { id: 'E14', section: 'communication', text: "When you're not feeling great, how should that change how people interact with you?" },
  { id: 'E15', section: 'crisis-recovery', text: 'What does "stuck" look like for you? How do you know when you\'re there?' },
  { id: 'E16', section: 'crisis-recovery', text: "What helps you get unstuck? What's worked in the past?" },
  { id: 'E17', section: 'crisis-recovery', text: "What makes things worse when you're struggling? What should people NOT do?" },
  { id: 'E18', section: 'crisis-recovery', text: 'How does chronic pain (or health issues) affect your availability and focus?' },
  { id: 'E19', section: 'crisis-recovery', text: "When you're in crisis mode, do you want space, help carrying the load, or distraction?" },
  { id: 'E20', section: 'work-style', text: 'How do you like to be helped? What does good support look like?' },
  { id: 'E21', section: 'work-style', text: 'How should priorities be presented to you?' },
  { id: 'E22', section: 'work-style', text: "What's your relationship with time? Are deadlines helpful pressure or unhelpful stress?" },
  { id: 'E23', section: 'work-style', text: 'What does "done enough" look like for you?' },
  { id: 'E24', section: 'work-style', text: 'Is there anything else about how you work that would be helpful to know?' },
];

interface QuestionAnalysis {
  id: string;
  answered: boolean;
  evidence?: string;
  confidence: number;
}

const GAP_ANALYSIS_SYSTEM = `You are analyzing a conversation to determine which assessment questions were already answered.

For each question provided, determine if the conversation contains sufficient information to answer it.
Return JSON with this structure:
{
  "analysis": [
    {
      "id": "E01",
      "answered": true/false,
      "evidence": "Brief quote or summary of relevant conversation",
      "confidence": 0.0-1.0
    }
  ]
}

Be generous - if the conversation touched on the topic even indirectly, mark it as answered.
Only mark as unanswered if there's truly no relevant information.`;

async function analyzeGapQuestions(transcript: string): Promise<QuestionAnalysis[]> {
  const questionList = QUESTION_E
    .map((q) => `- [${q.id}] (${q.section}) ${q.text}`)
    .join('\n');

  const prompt = `Analyze this conversation to determine which questions were answered:

CONVERSATION:
${transcript}

---

QUESTIONS TO CHECK:
${questionList}

Return your analysis as JSON (no markdown code blocks, just raw JSON):`;

  console.log(`\nAnalyzing transcript (${transcript.length} chars) against ${QUESTION_E.length} questions...`);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: GAP_ANALYSIS_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    // Extract JSON from response
    let cleaned = text.trim();
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1].trim();
    }
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const parsed = JSON.parse(cleaned);
    return parsed.analysis || [];
  } catch (e) {
    console.error('Failed to parse Claude response:', e);
    console.error('Raw response:', text.substring(0, 500));
    // Return all as unanswered
    return QUESTION_E.map((q) => ({
      id: q.id,
      answered: false,
      confidence: 0,
    }));
  }
}

function generateGapFinalMarkdown(
  entitySlug: string,
  analysis: QuestionAnalysis[]
): string {
  const unanswered = analysis.filter((a) => !a.answered);
  const answered = analysis.filter((a) => a.answered);

  // Group by section
  const sections: Record<string, { answered: number; total: number }> = {};
  for (const q of QUESTION_E) {
    if (!sections[q.section]) {
      sections[q.section] = { answered: 0, total: 0 };
    }
    sections[q.section].total++;
    const isAnswered = analysis.find((a) => a.id === q.id)?.answered;
    if (isAnswered) {
      sections[q.section].answered++;
    }
  }

  let md = `---
title: Gap Analysis Final
type: analysis
entity: ${entitySlug}
version: "1.0"
generated: "${new Date().toISOString()}"
outstanding_questions: [${unanswered.map(u => u.id).join(', ')}]
---

# GAP ANALYSIS FINAL: ${entitySlug}

Post-Sculptor extraction targets. Only questions NOT answered during the Sculptor interview.

---

## Summary

- **Total Questions:** ${analysis.length}
- **Answered in Sculptor:** ${answered.length} (${Math.round((answered.length / analysis.length) * 100)}%)
- **Outstanding:** ${unanswered.length}

### By Section

| Section | Total | Answered | Outstanding |
|---------|-------|----------|-------------|
`;

  for (const [section, counts] of Object.entries(sections)) {
    md += `| ${section} | ${counts.total} | ${counts.answered} | ${counts.total - counts.answered} |\n`;
  }

  md += `
---

## Outstanding Questions

`;

  if (unanswered.length === 0) {
    md += `**None!** All topics were covered during the Sculptor interview.\n`;
  } else {
    md += `| ID | Section | Question |\n`;
    md += `|----|---------|----------|\n`;

    for (const item of unanswered) {
      const q = QUESTION_E.find((q) => q.id === item.id);
      if (q) {
        md += `| ${item.id} | ${q.section} | ${q.text} |\n`;
      }
    }
  }

  md += `
---

## Already Answered (Evidence)

| ID | Section | Evidence |
|----|---------|----------|
`;

  for (const item of answered) {
    const q = QUESTION_E.find((q) => q.id === item.id);
    if (q && item.evidence) {
      const evidence = item.evidence.replace(/\|/g, '\\|').substring(0, 150);
      md += `| ${item.id} | ${q.section} | ${evidence}... |\n`;
    }
  }

  return md;
}

async function main() {
  const entitySlug = process.argv[2] || 'scott';

  console.log(`=== Generating GAP_ANALYSIS_FINAL for ${entitySlug} ===\n`);

  // Step 1: Try to get transcript from storage
  let transcript: string | null = null;

  const storagePath = `contexts/${entitySlug}/SCULPTOR_TRANSCRIPT.md`;
  const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);

  if (!error && data) {
    transcript = await data.text();
    console.log(`✅ Loaded transcript from storage (${transcript.length} chars)`);
  } else {
    // Try local file
    const localPath = path.join(__dirname, '..', 'contexts', entitySlug, 'SCULPTOR_TRANSCRIPT.md');
    if (fs.existsSync(localPath)) {
      transcript = fs.readFileSync(localPath, 'utf-8');
      console.log(`✅ Loaded transcript from local file (${transcript.length} chars)`);
    }
  }

  if (!transcript) {
    console.error('❌ Could not find SCULPTOR_TRANSCRIPT.md');
    process.exit(1);
  }

  // Step 2: Analyze with Claude
  const analysis = await analyzeGapQuestions(transcript);

  const answered = analysis.filter((a) => a.answered).length;
  const unanswered = analysis.filter((a) => !a.answered).length;

  console.log(`\n📊 Analysis Results:`);
  console.log(`   Answered: ${answered}/${analysis.length}`);
  console.log(`   Outstanding: ${unanswered}/${analysis.length}`);

  if (unanswered > 0) {
    console.log(`\n   Outstanding questions:`);
    analysis
      .filter((a) => !a.answered)
      .forEach((a) => {
        const q = QUESTION_E.find((q) => q.id === a.id);
        console.log(`   - ${a.id}: ${q?.text.substring(0, 60)}...`);
      });
  }

  // Step 3: Generate markdown
  const markdown = generateGapFinalMarkdown(entitySlug, analysis);

  // Step 4: Upload GAP_ANALYSIS_FINAL.md to storage
  const uploadPath = `contexts/${entitySlug}/GAP_ANALYSIS_FINAL.md`;
  const blob = new Blob([markdown], { type: 'text/markdown' });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(uploadPath, blob, {
      contentType: 'text/markdown',
      upsert: true,
    });

  if (uploadError) {
    console.error(`\n❌ Failed to upload: ${uploadError.message}`);
    // Save locally as backup
    const localOut = path.join(__dirname, '..', 'contexts', entitySlug, 'GAP_ANALYSIS_FINAL.md');
    fs.writeFileSync(localOut, markdown);
    console.log(`   Saved locally: ${localOut}`);
  } else {
    console.log(`\n✅ Uploaded to ${BUCKET}/${uploadPath}`);
  }

  // Step 4b: Generate and upload E_QUESTIONS_OUTSTANDING.json (simple format for API)
  const outstandingQuestions = analysis
    .filter((a) => !a.answered)
    .map((a) => {
      const q = QUESTION_E.find((q) => q.id === a.id);
      return {
        id: a.id,
        section: q?.section || 'unknown',
        text: q?.text || '',
      };
    });

  const eQuestionsJson = {
    entity: entitySlug,
    generated: new Date().toISOString(),
    total_questions: QUESTION_E.length,
    questions_answered: answered,
    questions_outstanding: unanswered,
    outstanding: outstandingQuestions,
  };

  const jsonPath = `contexts/${entitySlug}/E_QUESTIONS_OUTSTANDING.json`;
  const jsonBlob = new Blob([JSON.stringify(eQuestionsJson, null, 2)], { type: 'application/json' });

  const { error: jsonError } = await supabase.storage
    .from(BUCKET)
    .upload(jsonPath, jsonBlob, {
      contentType: 'application/json',
      upsert: true,
    });

  if (jsonError) {
    console.error(`\n❌ Failed to upload JSON: ${jsonError.message}`);
  } else {
    console.log(`✅ Uploaded to ${BUCKET}/${jsonPath}`);
  }

  // Step 5: Generate voice samples
  console.log('\n📝 Generating voice samples...');
  await generateVoiceSamples(entitySlug);

  console.log('\n✓ Done');
}

// =============================================================================
// VOICE SAMPLE GENERATION
// =============================================================================

interface VoiceSample {
  id: string;
  type: 'thought_leadership' | 'personal_story' | 'connection_request';
  label: string;
  description: string;
  content: string;
  topic: string;
}

const VOICE_SAMPLE_SYSTEM = `You are generating sample content in someone's authentic voice based on their voice profile.

Generate content that:
- Sounds natural and authentic to this person
- Uses their vocabulary, sentence patterns, and communication style
- Reflects their personality and values
- Is ready to use (not a template)

Return JSON array with exactly 3 samples:
[
  {
    "id": "thought_leadership",
    "type": "thought_leadership",
    "label": "Thought Leadership Post",
    "description": "A LinkedIn post sharing expertise",
    "content": "The actual post content...",
    "topic": "Brief topic description"
  },
  {
    "id": "personal_story",
    "type": "personal_story",
    "label": "Personal Story Post",
    "description": "A reflective LinkedIn post",
    "content": "The actual post content...",
    "topic": "Brief topic description"
  },
  {
    "id": "connection_request",
    "type": "connection_request",
    "label": "Connection Request",
    "description": "A LinkedIn connection message",
    "content": "The actual message content...",
    "topic": "Brief context"
  }
]`;

async function generateVoiceSamples(entitySlug: string): Promise<void> {
  // Load voice profile files
  const voiceFiles = ['VOICE.md', 'VOICE_SUMMARY.md', 'OPENINGS.md', 'THEMES.md'];
  let voiceContext = '';

  for (const filename of voiceFiles) {
    const filePath = `contexts/${entitySlug}/voice/${filename}`;
    const { data, error } = await supabase.storage.from(BUCKET).download(filePath);
    if (!error && data) {
      const content = await data.text();
      voiceContext += `\n\n=== ${filename} ===\n${content}`;
    }
  }

  // Also try root level CORPUS_SUMMARY for context
  const { data: corpusData } = await supabase.storage.from(BUCKET).download(`contexts/${entitySlug}/CORPUS_SUMMARY.md`);
  if (corpusData) {
    voiceContext += `\n\n=== CORPUS_SUMMARY.md ===\n${await corpusData.text()}`;
  }

  if (!voiceContext.trim()) {
    console.log('  ⚠️ No voice profile files found, skipping sample generation');
    return;
  }

  console.log(`  Loaded ${voiceContext.length} chars of voice context`);

  const prompt = `Based on this person's voice profile, generate 3 sample pieces of content.

VOICE PROFILE:
${voiceContext}

---

Generate 3 samples that authentically represent this person's voice:
1. A thought leadership LinkedIn post (sharing expertise or a contrarian take)
2. A personal/reflective LinkedIn post (vulnerable, introspective)
3. A LinkedIn connection request message (warm, professional)

Return ONLY valid JSON array, no markdown code blocks:`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: VOICE_SAMPLE_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse JSON
    let cleaned = text.trim();
    const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      cleaned = jsonBlockMatch[1].trim();
    }
    const startIdx = cleaned.indexOf('[');
    const endIdx = cleaned.lastIndexOf(']');
    if (startIdx !== -1 && endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }

    const samples: VoiceSample[] = JSON.parse(cleaned);
    console.log(`  Generated ${samples.length} samples`);

    // Create markdown file
    const markdown = generateVoiceSamplesMarkdown(entitySlug, samples);

    // Upload to storage
    const uploadPath = `contexts/${entitySlug}/VOICE_SAMPLES.md`;
    const blob = new Blob([markdown], { type: 'text/markdown' });

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uploadPath, blob, {
        contentType: 'text/markdown',
        upsert: true,
      });

    if (uploadError) {
      console.error(`  ❌ Failed to upload: ${uploadError.message}`);
    } else {
      console.log(`  ✅ Uploaded to ${BUCKET}/${uploadPath}`);
    }

    // Also save JSON version for API
    const jsonPath = `contexts/${entitySlug}/VOICE_SAMPLES.json`;
    const jsonBlob = new Blob([JSON.stringify(samples, null, 2)], { type: 'application/json' });

    await supabase.storage.from(BUCKET).upload(jsonPath, jsonBlob, {
      contentType: 'application/json',
      upsert: true,
    });
    console.log(`  ✅ Uploaded to ${BUCKET}/${jsonPath}`);

  } catch (e) {
    console.error('  ❌ Failed to generate voice samples:', e);
  }
}

function generateVoiceSamplesMarkdown(entitySlug: string, samples: VoiceSample[]): string {
  let md = `---
title: Voice Samples
type: samples
entity: ${entitySlug}
version: "1.0"
generated: "${new Date().toISOString()}"
---

# Voice Samples: ${entitySlug}

Pre-generated content samples for voice calibration tutorial.

---

`;

  for (const sample of samples) {
    md += `## ${sample.label}

**Type:** ${sample.type}
**Topic:** ${sample.topic}

${sample.content}

---

`;
  }

  return md;
}

main().catch(console.error);
