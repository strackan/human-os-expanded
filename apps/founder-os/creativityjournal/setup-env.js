const fs = require('fs');
const path = require('path');

// Read current .env.local
const envPath = path.join(__dirname, '.env.local');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Remove any existing NEXTAUTH_URL lines
const lines = envContent.split('\n').filter(line => !line.startsWith('NEXTAUTH_URL='));

// Add the correct NEXTAUTH_URL
lines.push('NEXTAUTH_URL=http://localhost:3000');

// Write back to file
const newContent = lines.join('\n');
fs.writeFileSync(envPath, newContent);

console.log('Environment file updated with NEXTAUTH_URL=http://localhost:3000');
console.log('Please restart your development server and clear browser cookies.'); 