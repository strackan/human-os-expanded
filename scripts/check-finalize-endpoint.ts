import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../apps/goodhang/.env.local') });

const SCOTT_SESSION_ID = '408c50a8-748d-4ba2-9852-c49b95c26345';
const baseUrl = 'https://goodhang.com';

async function checkFinalize() {
  console.log('Fetching from:', `${baseUrl}/api/sculptor/sessions/${SCOTT_SESSION_ID}/finalize`);

  const response = await fetch(`${baseUrl}/api/sculptor/sessions/${SCOTT_SESSION_ID}/finalize`);

  if (!response.ok) {
    console.error('Error:', response.status, await response.text());
    return;
  }

  const data = await response.json();

  console.log('\n=== Finalize Endpoint Response ===');
  console.log('Status:', data.status);
  console.log('Outstanding Questions:', data.outstanding_questions?.length);

  console.log('\n=== First 15 Outstanding Questions (UI shows these) ===');
  data.outstanding_questions?.slice(0, 15).forEach((q: any, i: number) => {
    const text = q.text || q.prompt;
    console.log(`${i + 1}. [${q.slug}] ${text?.substring(0, 70)}...`);
  });

  // Check for new questions
  const newOnes = data.outstanding_questions?.filter((q: any) =>
    ['E25', 'E26', 'E27', 'E28'].includes(q.slug)
  );

  if (newOnes?.length > 0) {
    console.log('\n=== NEW E25-E28 in Outstanding Queue ===');
    newOnes.forEach((q: any) => {
      console.log(`[${q.slug}] ${q.text || q.prompt}`);
    });
  } else {
    console.log('\n(E25-E28 not in outstanding - may already be answered or not included)');
  }

  // Show category breakdown
  const byCategory: Record<string, number> = {};
  data.outstanding_questions?.forEach((q: any) => {
    const cat = q.category || 'uncategorized';
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  console.log('\n=== Outstanding by Category ===');
  Object.entries(byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}`);
  });
}

checkFinalize().catch(console.error);
