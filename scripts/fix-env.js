// scripts/fix-env.js
// Script to help fix environment variables

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing environment variables...');

// Get the local Supabase keys from the status command
const localKeys = {
  url: 'http://127.0.0.1:54321',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
};

// Read current .env.local
const envPath = path.join(__dirname, '..', '.env.local');
let currentEnv = '';

try {
  currentEnv = fs.readFileSync(envPath, 'utf8');
  console.log('📖 Current .env.local found');
} catch (error) {
  console.log('📝 Creating new .env.local file');
}

// Parse current environment variables
const envLines = currentEnv.split('\n').filter(line => line.trim() && !line.startsWith('#'));
const envVars = {};

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

// Update with correct local values
envVars.NEXT_PUBLIC_SUPABASE_URL = localKeys.url;
envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY = localKeys.anonKey;
envVars.SUPABASE_SERVICE_ROLE_KEY = localKeys.serviceRoleKey;

// Keep existing Google OAuth credentials if they exist
if (!envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID) {
  envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID = '42614968888-9g1qb4kjofnqcusk9ru52llanfaei8cc.apps.googleusercontent.com';
}
if (!envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET) {
  envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET = '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';
}

// Create new .env.local content
const newEnvContent = `NEXT_PUBLIC_SUPABASE_URL=${envVars.NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${envVars.SUPABASE_SERVICE_ROLE_KEY}

# Google OAuth credentials
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=${envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID}
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=${envVars.SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET}
`;

// Write the new .env.local file
fs.writeFileSync(envPath, newEnvContent);

console.log('✅ .env.local updated with correct local Supabase configuration');
console.log('');
console.log('📋 Updated environment variables:');
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL}`);
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`  SUPABASE_SERVICE_ROLE_KEY: ${envVars.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...`);
console.log('');
console.log('🔄 Next steps:');
console.log('1. Restart your development server (npm run dev)');
console.log('2. Clear your browser cookies');
console.log('3. Try logging in again'); 