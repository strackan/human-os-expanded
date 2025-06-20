#!/usr/bin/env node

/**
 * Migration script to help update existing components to use the new styling system
 * 
 * Usage: node scripts/migrate-styles.js
 */

const fs = require('fs');
const path = require('path');

// Files that contain duplicate Stat components
const statComponentFiles = [
  'src/components/customers/CustomerRenewalLayout.tsx',
  'src/components/customers/AIPoweredLayout.tsx',
  'src/components/customers/ImpactEngineersLayout.tsx',
  'src/components/customers/RevenueArchitectsLayout.tsx',
  'src/app/customers/initech/page.tsx',
];

// Files that contain duplicate TwoColumnLegend components
const chartLegendFiles = [
  'src/components/charts/RenewalPerformanceChart.tsx',
  'src/components/charts/ContractAnomaliesChart.tsx',
  'src/components/charts/SegmentPriceIncreaseChart.tsx',
  'src/components/charts/RenewalPerformanceByRepChart.tsx',
  'src/components/charts/IndustryValueChart.tsx',
];

// Files with inline styles that should be migrated
const inlineStyleFiles = [
  'src/app/renewals-hq-ORIG/page.tsx',
  'src/components/customers/CustomerRenewalLayout.tsx',
  'src/components/customers/ImpactEngineersLayout.tsx',
  'src/components/customers/RevenueArchitectsLayout.tsx',
  'src/components/customers/AIPoweredLayout.tsx',
  'src/components/customers/layouts/BaseCustomerLayout.tsx',
];

console.log('🎨 Renubu Style Migration Helper');
console.log('================================\n');

console.log('📋 Migration Checklist:');
console.log('=======================\n');

console.log('1. ✅ Created shared UI components:');
console.log('   - src/components/ui/Stat.tsx');
console.log('   - src/components/ui/ChartLegend.tsx');
console.log('   - src/components/ui/Button.tsx');
console.log('   - src/components/ui/StatusBadge.tsx');
console.log('   - src/components/ui/Card.tsx');
console.log('   - src/components/ui/index.ts\n');

console.log('2. ✅ Created styling infrastructure:');
console.log('   - src/styles/components.css');
console.log('   - src/lib/styles.ts');
console.log('   - tailwind.config.ts');
console.log('   - src/styles/design-system.md\n');

console.log('3. 🔄 Files that need Stat component migration:');
statComponentFiles.forEach(file => {
  console.log(`   - ${file}`);
});
console.log('');

console.log('4. 🔄 Files that need ChartLegend component migration:');
chartLegendFiles.forEach(file => {
  console.log(`   - ${file}`);
});
console.log('');

console.log('5. 🔄 Files with inline styles to review:');
inlineStyleFiles.forEach(file => {
  console.log(`   - ${file}`);
});
console.log('');

console.log('📝 Migration Instructions:');
console.log('=========================\n');

console.log('For Stat components:');
console.log('1. Remove the local Stat component definition');
console.log('2. Add import: import Stat from "@/components/ui/Stat";');
console.log('3. Replace usage: <Stat label={label} value={value} />\n');

console.log('For ChartLegend components:');
console.log('1. Remove the local TwoColumnLegend component definition');
console.log('2. Add import: import ChartLegend from "@/components/ui/ChartLegend";');
console.log('3. Replace usage: <ChartLegend payload={payload} />\n');

console.log('For inline styles:');
console.log('1. Replace style={{ width: \`${progress}%\` }} with className="progress-bar"');
console.log('2. Use CSS custom properties for dynamic values');
console.log('3. Move complex styles to src/styles/components.css\n');

console.log('🎯 Next Steps:');
console.log('==============\n');

console.log('1. Run the development server to test changes:');
console.log('   npm run dev\n');

console.log('2. Update components one by one, starting with:');
console.log('   - Stat components (highest impact)');
console.log('   - ChartLegend components');
console.log('   - Inline styles\n');

console.log('3. Test each component after migration');
console.log('4. Update any TypeScript errors');
console.log('5. Ensure responsive design still works\n');

console.log('📚 Documentation:');
console.log('=================\n');

console.log('See src/styles/design-system.md for detailed guidelines');
console.log('Use src/lib/styles.ts for common class combinations');
console.log('Check tailwind.config.ts for available utilities\n');

console.log('🚀 Benefits after migration:');
console.log('============================\n');

console.log('✅ Consistent styling across all components');
console.log('✅ Reduced bundle size through component reuse');
console.log('✅ Easier maintenance and updates');
console.log('✅ Better accessibility with standardized focus states');
console.log('✅ Improved responsive design with consistent breakpoints');
console.log('✅ Type-safe styling with TypeScript support\n');

console.log('Happy migrating! 🎉\n'); 