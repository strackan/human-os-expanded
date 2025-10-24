const { getRenewalStage, getStageIcon } = require('./renewal-helpers');

console.log('\n🧪 TESTING RENEWAL STAGE BOUNDARIES\n');
console.log('='.repeat(80));

// Test cases: [days, expected_stage]
const testCases = [
  [-5, 'Overdue'],
  [0, 'Emergency'],
  [3, 'Emergency'],
  [6, 'Emergency'],
  [7, 'Critical'],
  [10, 'Critical'],
  [13, 'Critical'],
  [14, 'Signature'],
  [20, 'Signature'],
  [29, 'Signature'],
  [30, 'Finalize'],
  [45, 'Finalize'],
  [59, 'Finalize'],
  [60, 'Negotiate'],
  [75, 'Negotiate'],
  [89, 'Negotiate'],
  [90, 'Engage'],
  [105, 'Engage'],
  [119, 'Engage'],
  [120, 'Prepare'],
  [150, 'Prepare'],
  [179, 'Prepare'],
  [180, 'Monitor'],
  [200, 'Monitor'],
  [365, 'Monitor']
];

console.log('\nRunning tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach(([days, expected]) => {
  const actual = getRenewalStage(days);
  const icon = getStageIcon(actual);
  const status = actual === expected ? '✅' : '❌';

  if (actual === expected) {
    passed++;
  } else {
    failed++;
    console.log(`${status} Days: ${String(days).padStart(4)} | Expected: ${expected.padEnd(12)} | Got: ${actual.padEnd(12)} ${icon}`);
  }
});

console.log(`\n📊 Test Results: ${passed}/${testCases.length} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All tests passed!\n');
} else {
  console.log('⚠️  Some tests failed - check stage boundaries\n');
}

console.log('='.repeat(80));
console.log('\n📋 Stage Reference:\n');
console.log('  < 0 days:      Overdue');
console.log('  0-6 days:      Emergency');
console.log('  7-13 days:     Critical');
console.log('  14-29 days:    Signature');
console.log('  30-59 days:    Finalize');
console.log('  60-89 days:    Negotiate');
console.log('  90-119 days:   Engage');
console.log('  120-179 days:  Prepare');
console.log('  >= 180 days:   Monitor\n');

console.log('='.repeat(80) + '\n');
