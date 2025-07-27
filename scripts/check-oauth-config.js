#!/usr/bin/env node

/**
 * OAuth Configuration Diagnostic Script
 * 
 * This script checks your Google OAuth and Supabase configuration
 * to identify potential issues with your authentication setup.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OAuth Configuration Diagnostic\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const envVars = {
  'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID': process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID,
  'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET': process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET,
};

Object.entries(envVars).forEach(([key, value]) => {
  const status = value ? '✅ Present' : '❌ Missing';
  const preview = value ? `${value.substring(0, 20)}...` : 'Not set';
  console.log(`   ${key}: ${status} (${preview})`);
});

// Check Supabase config
console.log('\n📋 Supabase Configuration Check:');
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
  'src/app/api/auth/callback/route.ts'
];

callbackRoutes.forEach(route => {
  const routePath = path.join(__dirname, '..', route);
  const exists = fs.existsSync(routePath);
  const status = exists ? '✅ Exists' : '❌ Missing';
  console.log(`   ${route}: ${status}`);
});

// Google OAuth Console Configuration Guide
console.log('\n🔧 Google OAuth Console Configuration Required:');
console.log('\n📋 Authorized JavaScript Origins (add these):');
console.log('   ✅ http://localhost:3000');
console.log('   ✅ http://127.0.0.1:3000');

console.log('\n📋 Authorized Redirect URIs (add these):');
console.log('   ✅ http://127.0.0.1:54321/auth/v1/callback (REQUIRED for local Supabase)');
console.log('   ✅ http://localhost:3000/auth/callback (Your app callback)');
console.log('   ✅ http://127.0.0.1:3000/auth/callback (Your app callback)');

// Common Issues and Solutions
console.log('\n🚨 Common Issues and Solutions:');
console.log('\n1. "redirect_uri_mismatch" error:');
console.log('   → Ensure ALL redirect URIs are added to Google Console');
console.log('   → The Supabase local callback is CRITICAL: http://127.0.0.1:54321/auth/v1/callback');

console.log('\n2. "invalid request: both auth code and code verifier should be non-empty":');
console.log('   → Remove PKCE parameters from OAuth calls for local development');
console.log('   → Use simple OAuth flow without queryParams');

console.log('\n3. Session not persisting after OAuth:');
console.log('   → Check that callback route properly exchanges code for session');
console.log('   → Verify middleware is updating session cookies');

console.log('\n4. OAuth flow not starting:');
console.log('   → Check that Google OAuth is enabled in Supabase config');
console.log('   → Verify environment variables are set correctly');

// Testing Instructions
console.log('\n🧪 Testing Instructions:');
console.log('\n1. Start your local Supabase:');
console.log('   supabase start');

console.log('\n2. Test the OAuth flow:');
console.log('   http://localhost:3000/signin');

console.log('\n3. Check browser console for errors during OAuth flow');

console.log('\n4. Verify session creation:');
console.log('   http://localhost:3000/test-auth');

console.log('\n✅ Diagnostic complete!'); 