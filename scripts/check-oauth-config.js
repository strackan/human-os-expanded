#!/usr/bin/env node

/**
 * OAuth Configuration Diagnostic Script
 * This script helps diagnose Google OAuth setup issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OAuth Configuration Diagnostic\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID',
    'SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    const hasVar = envContent.includes(varName);
    console.log(`   ${hasVar ? '✅' : '❌'} ${varName}: ${hasVar ? 'Present' : 'Missing'}`);
  });
  
  // Check if using local Supabase
  const isLocal = envContent.includes('127.0.0.1:54321') || envContent.includes('localhost:54321');
  console.log(`   ${isLocal ? '✅' : '❌'} Local Supabase: ${isLocal ? 'Yes' : 'No'}`);
  
} else {
  console.log('   ❌ .env.local file not found');
}

console.log('\n🔧 Google OAuth Configuration Requirements:');

console.log('\n1. Google Cloud Console Setup:');
console.log('   ✅ Go to https://console.cloud.google.com/');
console.log('   ✅ Select your project');
console.log('   ✅ Go to APIs & Services > OAuth consent screen');
console.log('   ✅ Configure external user type');

console.log('\n2. OAuth Credentials Setup:');
console.log('   ✅ Go to APIs & Services > Credentials');
console.log('   ✅ Create OAuth 2.0 Client ID (Web application)');
console.log('   ✅ Add authorized JavaScript origins:');
console.log('      - http://localhost:3000');
console.log('      - http://127.0.0.1:3000');
console.log('   ✅ Add authorized redirect URIs:');
console.log('      - http://127.0.0.1:54321/auth/v1/callback (REQUIRED for local Supabase)');
console.log('      - http://localhost:3000/api/auth/callback');
console.log('      - http://127.0.0.1:3000/api/auth/callback');

console.log('\n3. Supabase Configuration:');
console.log('   ✅ Check supabase/config.toml has Google OAuth enabled');
console.log('   ✅ Verify redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"');

console.log('\n4. Common Issues & Solutions:');

console.log('\n   ❌ "invalid request: both auth code and code verifier should be non-empty"');
console.log('   ✅ Solution: Remove PKCE parameters (access_type, prompt) from OAuth call');
console.log('   ✅ Use simple OAuth flow for local development');

console.log('\n   ❌ "redirect_uri_mismatch"');
console.log('   ✅ Solution: Add http://127.0.0.1:54321/auth/v1/callback to Google OAuth redirect URIs');
console.log('   ✅ Check both JavaScript origins and redirect URIs in Google Console');

console.log('\n   ❌ "Auth session missing"');
console.log('   ✅ Solution: Ensure Supabase is running locally (supabase status)');
console.log('   ✅ Clear browser cookies and local storage');
console.log('   ✅ Restart development server');

console.log('\n5. Testing Steps:');
console.log('   ✅ Run: supabase status (should show running)');
console.log('   ✅ Run: npm run dev (should start on localhost:3000)');
console.log('   ✅ Visit: http://localhost:3000/test-oauth-simple');
console.log('   ✅ Test simple OAuth flow without PKCE');

console.log('\n6. Debug Commands:');
console.log('   🔍 Check Supabase logs: supabase logs');
console.log('   🔍 Check browser console for errors');
console.log('   🔍 Clear auth cookies: visit /clear-auth page');
console.log('   🔍 Test OAuth step by step: visit /test-oauth-debug');

console.log('\n📝 Next Steps:');
console.log('1. Verify Google OAuth redirect URIs include: http://127.0.0.1:54321/auth/v1/callback');
console.log('2. Test simple OAuth flow at: http://localhost:3000/test-oauth-simple');
console.log('3. If still failing, check browser console and Supabase logs');
console.log('4. Consider using the simple OAuth flow (without PKCE) for local development');

console.log('\n🎯 Quick Fix:');
console.log('The main issue is likely PKCE parameters. Try the simple OAuth flow:');
console.log('supabase.auth.signInWithOAuth({');
console.log('  provider: "google",');
console.log('  options: {');
console.log('    redirectTo: "http://127.0.0.1:54321/auth/v1/callback"');
console.log('    // No queryParams');
console.log('  }');
console.log('})'); 