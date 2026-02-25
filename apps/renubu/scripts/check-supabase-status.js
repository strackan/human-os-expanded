#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Supabase Status...\n');

// Check environment variables
console.log('📋 Environment Variables:');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allVarsSet = true;
  requiredVars.forEach(varName => {
    const found = envContent.includes(varName);
    const status = found ? '✅ Set' : '❌ Missing';
    console.log(`   ${varName}: ${status}`);
    if (!found) allVarsSet = false;
  });

  if (allVarsSet) {
    console.log('\n✅ All required environment variables are set');
  } else {
    console.log('\n❌ Some required environment variables are missing');
  }
} else {
  console.log('   ❌ .env.local not found');
}

// Check Supabase config
console.log('\n📋 Supabase Configuration:');
const configPath = path.join(__dirname, '../supabase/config.toml');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  
  const checks = [
    {
      name: 'API URL configured',
      pattern: /api_url = "http:\/\/127\.0\.0\.1:54321"/,
      required: true
    },
    {
      name: 'Database URL configured',
      pattern: /db_url = "postgresql:\/\/postgres:postgres@127\.0\.0\.1:54322\/postgres"/,
      required: true
    },
    {
      name: 'Studio URL configured',
      pattern: /studio_url = "http:\/\/127\.0\.0\.1:54323"/,
      required: true
    },
    {
      name: 'Inbucket URL configured',
      pattern: /inbucket_url = "http:\/\/127\.0\.0\.1:54324"/,
      required: true
    },
    {
      name: 'Storage URL configured',
      pattern: /storage_url = "http:\/\/127\.0\.0\.1:54325"/,
      required: true
    },
    {
      name: 'Google OAuth enabled',
      pattern: /\[auth\.external\.google\][\s\S]*?enabled = true/,
      required: false
    }
  ];

  checks.forEach(check => {
    const found = check.pattern.test(config);
    const status = found ? '✅ Found' : '❌ Missing';
    const required = check.required ? ' (Required)' : ' (Optional)';
    console.log(`   ${check.name}: ${status}${required}`);
  });
} else {
  console.log('   ❌ supabase/config.toml not found');
}

// Check if Supabase is running locally
console.log('\n📋 Local Supabase Status:');
const checkLocalSupabase = async () => {
  try {
    const response = await fetch('http://127.0.0.1:54321/health');
    if (response.ok) {
      console.log('   ✅ Local Supabase is running');
    } else {
      console.log('   ❌ Local Supabase is not responding');
    }
  } catch (error) {
    console.log('   ❌ Local Supabase is not running');
    console.log('   💡 Run: npx supabase start');
  }
};

// Check API endpoints
console.log('\n📋 API Endpoints:');
const checkAPIEndpoints = async () => {
  const endpoints = [
    { name: 'Config Check', url: 'http://localhost:3000/api/check-config' },
    { name: 'Supabase Status', url: 'http://localhost:3000/api/supabase-status' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      if (response.ok) {
        console.log(`   ✅ ${endpoint.name}: ${response.status}`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Not accessible`);
    }
  }
};

// Run async checks
(async () => {
  await checkLocalSupabase();
  await checkAPIEndpoints();
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('   1. If local Supabase is not running: npx supabase start');
  console.log('   2. If environment variables are missing: check .env.local');
  console.log('   3. If API endpoints fail: restart the Next.js dev server');
  console.log('   4. For OAuth issues: run node scripts/check-oauth-config.js');
})(); 