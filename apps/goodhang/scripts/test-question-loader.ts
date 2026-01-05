/**
 * Test script to verify question loader works correctly
 */

import { loadAssessmentConfig } from '../lib/assessment/question-loader';

async function main() {
  console.log('Testing question loader...\n');

  try {
    const config = await loadAssessmentConfig();

    console.log('✅ Question config loaded successfully');
    console.log(`   ID: ${config.id}`);
    console.log(`   Title: ${config.title}`);
    console.log(`   Version: ${config.version}`);
    console.log(`   Estimated Time: ${config.estimatedMinutes} minutes`);
    console.log(`   Sections: ${config.sections.length}`);

    let totalQuestions = 0;
    config.sections.forEach((section, idx) => {
      console.log(`\n   Section ${idx + 1}: ${section.title}`);
      console.log(`     Questions: ${section.questions.length}`);
      totalQuestions += section.questions.length;

      section.questions.forEach((q, qIdx) => {
        console.log(`       ${qIdx + 1}. ${q.text.substring(0, 50)}...`);
      });
    });

    console.log(`\n   Total Questions: ${totalQuestions}`);

    if (totalQuestions === 26) {
      console.log('\n✅ All 26 questions loaded correctly');
    } else {
      console.log(`\n❌ Expected 26 questions, got ${totalQuestions}`);
      process.exit(1);
    }

    console.log('\n✅ Test passed!');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();
