#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking OAuth Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID',
    'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET'
  ];

  requiredVars.forEach(varName => {
    const found = envContent.includes(varName);
    const status = found ? '✅ Found' : '❌ Missing';
    console.log(`   ${varName}: ${status}`);
  });
} else {
  console.log('   ❌ .env.local not found');
}

// Check Supabase config
console.log('\n📋 Supabase Config Check:');
const configPath = path.join(__dirname, '../supabase/config.toml');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  
  const checks = [
    {
      name: 'Google OAuth enabled',
      pattern: /\[auth\.external\.google\][\s\S]*?enabled = true/,
      required: true
    },
    {
      name: 'Google client_id configured',
      pattern: /client_id = "env\(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID\)"/,
      required: true
    },
    {
      name: 'Google secret configured',
      pattern: /secret = "env\(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET\)"/,
      required: true
    },
    {
      name: 'Redirect URI configured',
      pattern: /redirect_uri = "http:\/\/127\.0\.0\.1:54321\/auth\/v1\/callback"/,
      required: true
    },
    {
      name: 'Additional redirect URLs include localhost',
      pattern: /http:\/\/localhost:3000\/auth\/callback/,
      required: true
    }
  ];

  checks.forEach(check => {
    const found = check.pattern.test(config);
    const status = found ? '✅ Found' : '❌ Missing';
    console.log(`   ${check.name}: ${status}`);
  });
} else {
  console.log('   ❌ supabase/config.toml not found');
}

// Check callback routes
console.log('\n📋 Callback Routes Check:');
const callbackRoutes = [
  'src/app/auth/callback/route.ts',
  'src/app/signin/page.tsx'
];

callbackRoutes.forEach(route => {
  const routePath = path.join(__dirname, '..', route);
  const exists = fs.existsSync(routePath);
  const status = exists ? '✅ Found' : '❌ Missing';
  console.log(`   ${route}: ${status}`);
});

// Check middleware
console.log('\n📋 Middleware Check:');
const middlewarePath = path.join(__dirname, '../middleware.ts');
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
  const hasAuthCheck = middlewareContent.includes('getSession');
  const hasPublicRoutes = middlewareContent.includes('isPublicRoute');
  console.log(`   Auth session check: ${hasAuthCheck ? '✅ Found' : '❌ Missing'}`);
  console.log(`   Public routes check: ${hasPublicRoutes ? '✅ Found' : '❌ Missing'}`);
} else {
  console.log('   ❌ middleware.ts not found');
}

console.log('\n🔧 Troubleshooting Steps:');
console.log('1. Ensure Supabase is running: supabase status');
console.log('2. Check Google OAuth credentials in Google Cloud Console');
console.log('3. Verify redirect URIs include: http://127.0.0.1:54321/auth/v1/callback');
console.log('4. Test OAuth flow: http://localhost:3000/test-oauth-simple');
console.log('5. Clear browser cookies and try again');
console.log('6. Restart Supabase: supabase stop && supabase start'); 