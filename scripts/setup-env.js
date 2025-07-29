#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment variables...\n');

// Supabase local instance keys from your output
const envContent = `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Google OAuth credentials
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=42614968888-9g1qb4kjofnqcusk9ru52llanfaei8cc.apps.googleusercontent.com
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=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
`;

const envPath = path.join(__dirname, '../.env.local');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env.local with correct Supabase keys');
  console.log('📋 Environment variables set:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL: http://127.0.0.1:54321');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY: [set]');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY: [set]');
  console.log('   - Google OAuth credentials: [set]');
  console.log('\n🔄 Please restart your development server for changes to take effect');
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
} 