/**
 * Template Hydrator Test
 */

import {
  hydrateTemplate,
  hydrateObject,
  createHydrationContext,
} from './TemplateHydrator';

console.log('\n🧪 Testing Template Hydrator\n');
console.log('═'.repeat(60));

// Test data
const context = createHydrationContext(
  {
    name: 'Obsidian Black',
    current_arr: 185000,
    health_score: 72,
    renewal_date: '2026-03-15',
    days_until_renewal: 145,
    primary_contact: {
      name: 'Sarah Johnson',
      title: 'VP of Engineering',
    },
  },
  {
    first_name: 'Justin',
    last_name: 'Smith',
  }
);

// Test 1: Simple placeholder
const test1 = hydrateTemplate('Renewal for {{customer.name}}', context);
console.log('\n1️⃣  Simple placeholder:');
console.log(`   Input:  "Renewal for {{customer.name}}"`);
console.log(`   Output: "${test1}"`);
console.log(`   ${test1 === 'Renewal for Obsidian Black' ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Currency formatting
const test2 = hydrateTemplate('ARR: {{customer.current_arr|currency}}', context);
console.log('\n2️⃣  Currency formatting:');
console.log(`   Input:  "ARR: {{customer.current_arr|currency}}"`);
console.log(`   Output: "${test2}"`);
console.log(`   ${test2 === 'ARR: $185,000' ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Nested object
const test3 = hydrateTemplate('Contact: {{customer.primary_contact.name}}', context);
console.log('\n3️⃣  Nested object:');
console.log(`   Input:  "Contact: {{customer.primary_contact.name}}"`);
console.log(`   Output: "${test3}"`);
console.log(`   ${test3 === 'Contact: Sarah Johnson' ? '✅ PASS' : '❌ FAIL'}`);

// Test 4: User variables
const test4 = hydrateTemplate('From: <User.First> <User.Last>', context);
console.log('\n4️⃣  User variables:');
console.log(`   Input:  "From: <User.First> <User.Last>"`);
console.log(`   Output: "${test4}"`);
console.log(`   ${test4 === 'From: Justin Smith' ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Multiple placeholders
const test5 = hydrateTemplate(
  'Renewal for {{customer.name}} ({{customer.current_arr|currency}}) - Contact: {{customer.primary_contact.name}}',
  context
);
console.log('\n5️⃣  Multiple placeholders:');
console.log(`   Output: "${test5}"`);
console.log(
  `   ${
    test5 ===
    'Renewal for Obsidian Black ($185,000) - Contact: Sarah Johnson'
      ? '✅ PASS'
      : '❌ FAIL'
  }`
);

// Test 6: Direct property access (shorthand)
const test6 = hydrateTemplate('Customer: {{name}}', context);
console.log('\n6️⃣  Shorthand access:');
console.log(`   Input:  "Customer: {{name}}"`);
console.log(`   Output: "${test6}"`);
console.log(`   ${test6 === 'Customer: Obsidian Black' ? '✅ PASS' : '❌ FAIL'}`);

// Test 7: Hydrate object
const testObj = {
  title: 'Renewal for {{customer.name}}',
  description: 'ARR: {{customer.current_arr|currency}}',
  contact: {
    name: '{{customer.primary_contact.name}}',
    role: '{{customer.primary_contact.title}}',
  },
  items: [
    'Review {{customer.name}}',
    'Contact {{customer.primary_contact.name}}',
  ],
};

const hydratedObj = hydrateObject(testObj, context);
console.log('\n7️⃣  Object hydration:');
console.log('   Input:', JSON.stringify(testObj, null, 2));
console.log('   Output:', JSON.stringify(hydratedObj, null, 2));
console.log(
  `   ${
    hydratedObj.title === 'Renewal for Obsidian Black' &&
    hydratedObj.description === 'ARR: $185,000' &&
    hydratedObj.contact.name === 'Sarah Johnson'
      ? '✅ PASS'
      : '❌ FAIL'
  }`
);

// Test 8: Real workflow text
const realText = `Good afternoon, Justin. You've got one critical task for today:

**Renewal Planning for {{customer.name}}.**

We need to review contract terms, make sure we've got the right contacts, and put our initial forecast in.

The full plan is on the right. Ready to get started?`;

const hydratedText = hydrateTemplate(realText, context);
console.log('\n8️⃣  Real workflow text:');
console.log('   Output:');
console.log('   ' + hydratedText.split('\n').join('\n   '));
console.log(
  `   ${hydratedText.includes('Obsidian Black') ? '✅ PASS' : '❌ FAIL'}`
);

console.log('\n' + '═'.repeat(60));
console.log('✅ All hydration tests complete!\n');
