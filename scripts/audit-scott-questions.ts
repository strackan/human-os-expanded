/**
 * Audit Script: Questions Database & Scott's Answers
 *
 * This script queries the database to show:
 * 1. All question sets (grouped by domain/target)
 * 2. All questions in the database (grouped by domain/category)
 * 3. Scott's entity_answers (what he's answered)
 * 4. D&D questions from core-questions.json (separate system)
 * 5. Gap analysis showing what's missing
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Question {
  id: string;
  slug: string;
  domain: string;
  category: string;
  subcategory: string;
  text: string;
}

interface QuestionSet {
  id: string;
  slug: string;
  name: string;
  domain: string;
  target: string;
  description: string;
}

interface EntityAnswer {
  id: string;
  question_id: string;
  answered: boolean;
  value_text: string | null;
  source: string;
}

async function audit() {
  console.log('\n' + '='.repeat(80));
  console.log('AUDIT: Questions Database & Scott\'s Answers');
  console.log('='.repeat(80) + '\n');

  // 1. Get all question sets
  console.log('1. QUESTION SETS');
  console.log('-'.repeat(40));

  const { data: questionSets, error: setsError } = await supabase
    .from('question_sets')
    .select('*')
    .order('domain')
    .order('slug');

  if (setsError) {
    console.error('Error fetching question sets:', setsError);
  } else {
    const byDomain: Record<string, QuestionSet[]> = {};
    for (const qs of questionSets || []) {
      if (!byDomain[qs.domain]) byDomain[qs.domain] = [];
      byDomain[qs.domain].push(qs);
    }

    for (const [domain, sets] of Object.entries(byDomain)) {
      console.log(`\n[${domain.toUpperCase()}]`);
      for (const qs of sets) {
        console.log(`  ${qs.slug} → ${qs.name} (target: ${qs.target})`);
      }
    }
    console.log(`\nTotal: ${questionSets?.length || 0} question sets`);
  }

  // 2. Get all questions
  console.log('\n\n2. QUESTIONS BY DOMAIN');
  console.log('-'.repeat(40));

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .order('domain')
    .order('category')
    .order('slug');

  if (questionsError) {
    console.error('Error fetching questions:', questionsError);
  } else {
    const byDomain: Record<string, Question[]> = {};
    for (const q of questions || []) {
      if (!byDomain[q.domain]) byDomain[q.domain] = [];
      byDomain[q.domain].push(q);
    }

    for (const [domain, qs] of Object.entries(byDomain)) {
      console.log(`\n[${domain.toUpperCase()}] - ${qs.length} questions`);

      // Group by category
      const byCategory: Record<string, Question[]> = {};
      for (const q of qs) {
        if (!byCategory[q.category]) byCategory[q.category] = [];
        byCategory[q.category].push(q);
      }

      for (const [cat, catQs] of Object.entries(byCategory)) {
        console.log(`  ${cat}: ${catQs.length}`);
        for (const q of catQs.slice(0, 3)) {
          console.log(`    - ${q.slug}: "${q.text.substring(0, 50)}..."`);
        }
        if (catQs.length > 3) {
          console.log(`    ... and ${catQs.length - 3} more`);
        }
      }
    }
    console.log(`\nTotal: ${questions?.length || 0} questions in database`);
  }

  // 3. Get Scott's entity_answers
  console.log('\n\n3. SCOTT\'S ENTITY_ANSWERS');
  console.log('-'.repeat(40));

  const { data: scottAnswers, error: answersError } = await supabase
    .from('entity_answers')
    .select(`
      id,
      question_id,
      answered,
      value_text,
      source,
      questions (slug, domain, category, text)
    `)
    .eq('entity_slug', 'scott-leese');

  if (answersError) {
    console.error('Error fetching Scott answers:', answersError);
  } else if (!scottAnswers || scottAnswers.length === 0) {
    console.log('\n  *** NO ENTITY_ANSWERS FOUND FOR SCOTT ***');
    console.log('  Scott has not answered any questions in the entity_answers table.');
  } else {
    console.log(`\nScott has ${scottAnswers.length} answers in entity_answers:`);
    for (const a of scottAnswers) {
      const q = (a as any).questions;
      console.log(`  [${a.answered ? 'Y' : 'N'}] ${q?.slug || a.question_id} (${a.source})`);
      if (a.value_text) {
        console.log(`      "${a.value_text.substring(0, 60)}..."`);
      }
    }
  }

  // 4. Check D&D questions (separate system)
  console.log('\n\n4. D&D ASSESSMENT (SEPARATE SYSTEM)');
  console.log('-'.repeat(40));

  const dndQuestionsPath = path.join(__dirname, '../apps/goodhang/lib/assessment/core-questions.json');

  try {
    const dndQuestions = JSON.parse(fs.readFileSync(dndQuestionsPath, 'utf-8'));
    console.log(`\nD&D Assessment: ${dndQuestions.title} v${dndQuestions.version}`);
    console.log(`Location: apps/goodhang/lib/assessment/core-questions.json`);
    console.log('\nThese 10 questions are NOT in the database - they\'re processed separately:');

    for (const section of dndQuestions.sections) {
      console.log(`\n  [${section.title}]`);
      for (const q of section.questions) {
        console.log(`    ${q.id}: "${q.text.substring(0, 50)}..."`);
      }
    }

    console.log('\n  *** D&D assessment is INDEPENDENT of Sculptor ***');
    console.log('  *** Scott must complete Good Hang assessment separately ***');
  } catch (e) {
    console.log('Could not read D&D questions file:', e);
  }

  // 5. Check Scott's Sculptor session metadata
  console.log('\n\n5. SCOTT\'S SCULPTOR SESSION');
  console.log('-'.repeat(40));

  const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';

  const { data: session, error: sessionError } = await supabase
    .from('sculptor_sessions')
    .select('id, entity_slug, status, product, metadata')
    .eq('id', SCOTT_SESSION_ID)
    .single();

  if (sessionError) {
    console.error('Error fetching session:', sessionError);
  } else if (session) {
    console.log(`\nSession ID: ${session.id}`);
    console.log(`Entity: ${session.entity_slug}`);
    console.log(`Status: ${session.status}`);
    console.log(`Product: ${session.product}`);

    const meta = session.metadata || {};
    console.log(`\nConversation turns: ${meta.conversation_history?.length || 0}`);
    console.log(`Outstanding questions: ${meta.outstanding_questions?.length || 0}`);
    console.log(`Gap analysis generated: ${meta.gap_analysis_generated || 'N/A'}`);

    if (meta.outstanding_questions?.length > 0) {
      console.log('\nOutstanding questions from gap-final:');
      for (const q of meta.outstanding_questions.slice(0, 10)) {
        console.log(`  [${q.slug}] ${q.text?.substring(0, 50)}...`);
      }
      if (meta.outstanding_questions.length > 10) {
        console.log(`  ... and ${meta.outstanding_questions.length - 10} more`);
      }
    }
  }

  // 6. Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  console.log(`
DATABASE QUESTIONS:
- Total question sets: ${questionSets?.length || 0}
- Total questions: ${questions?.length || 0}
- Scott's entity_answers: ${scottAnswers?.length || 0}

D&D ASSESSMENT (SEPARATE):
- 10 narrative questions in core-questions.json
- NOT tracked in entity_answers
- Requires separate Good Hang assessment flow

KEY FINDING:
Scott's Sculptor session data is in sculptor_sessions.metadata
His D&D assessment shows "not enough info" because he hasn't
completed the Good Hang Personality Assessment (10 questions).
`);
}

audit().catch(console.error);
