// scripts/clear-auth-cookies.js
// Run this script to clear all authentication-related cookies

const fs = require('fs');
const path = require('path');

console.log('🧹 Clearing authentication cookies...');

// Clear browser cookies by creating a simple HTML page
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Clear Auth Cookies</title>
</head>
<body>
    <h1>Clearing Authentication Cookies</h1>
    <p>This page will clear all authentication-related cookies.</p>
    <button onclick="clearCookies()">Clear All Cookies</button>
    <button onclick="clearAuthCookies()">Clear Only Auth Cookies</button>
    <div id="result"></div>

    <script>
        function clearCookies() {
            const cookies = document.cookie.split(";");
            cookies.forEach(cookie => {
                const eqPos = cookie.indexOf("=");
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=127.0.0.1";
            });
            document.getElementById('result').innerHTML = '<p style="color: green;">✅ All cookies cleared!</p>';
        }

        function clearAuthCookies() {
            const authCookieNames = [
                'sb-auth-token',
                'sb-access-token',
                'sb-refresh-token',
                'sb-auth-token-code-verifier',
                'sb-127-auth-token',
                'sb-127-auth-token-code-verifier',
                'sb-uuvdjjclwwulvyeboavk-auth-token',
                'sb-uuvdjjclwwulvyeboavk-auth-token-code-verifier'
            ];
            
            authCookieNames.forEach(name => {
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=localhost";
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=127.0.0.1";
            });
            
            document.getElementById('result').innerHTML = '<p style="color: green;">✅ Auth cookies cleared!</p>';
        }

        // Show current cookies
        console.log('Current cookies:', document.cookie);
    </script>
</body>
</html>
`;

const outputPath = path.join(__dirname, '..', 'public', 'clear-cookies.html');
fs.writeFileSync(outputPath, htmlContent);

console.log('✅ Created cookie clearing page at: public/clear-cookies.html');
console.log('🌐 Open http://localhost:3000/clear-cookies.html in your browser to clear cookies');
console.log('');
console.log('📋 Manual steps:');
console.log('1. Update your .env.local file with the correct service role key');
console.log('2. Restart your Next.js development server');
console.log('3. Clear your browser cookies or visit the clear-cookies page');
console.log('4. Try logging in again'); 