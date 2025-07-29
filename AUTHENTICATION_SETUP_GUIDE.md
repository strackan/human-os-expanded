# Authentication Setup Guide

## Overview
This guide helps you set up authentication for the Renubu application with a **local Supabase instance** and resolve the cookie setting issues.

## Environment Variables Required

Create a `.env.local` file in the root directory with the following variables:

```bash
# Local Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000
```

## Getting Local Supabase Credentials

1. Start your local Supabase instance:
   ```bash
   supabase start
   ```

2. Go to your local Supabase dashboard: `http://127.0.0.1:54321`
3. Navigate to Settings > API
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` (should be `http://127.0.0.1:54321`)
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

## Google OAuth Setup for Local Development

### 1. Google OAuth Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select your OAuth 2.0 application
3. Add the following **Authorized redirect URIs**:
   - `http://127.0.0.1:54321/auth/v1/callback` (Local Supabase callback URL)
   - `http://localhost:3000/auth/callback` (Your app's callback URL)
4. Copy your **Client ID** and **Client Secret**

### 2. Local Supabase Dashboard Configuration
1. Go to your local Supabase dashboard: `http://127.0.0.1:54321`
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials:
   - **Client ID**: Your Google OAuth client ID
   - **Client Secret**: Your Google OAuth client secret
5. Go to Authentication > URL Configuration
6. Set the **Site URL** to: `http://localhost:3000`
7. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback`

## OAuth Flow for Local Development

The authentication flow works as follows:

1. **User clicks "Sign in with Google"** → Client calls `supabase.auth.signInWithOAuth()`
2. **Local Supabase redirects to Google** → User authenticates with Google
3. **Google redirects back to local Supabase** → `http://127.0.0.1:54321/auth/v1/callback`
4. **Local Supabase processes OAuth response** → Exchanges code for tokens
5. **Local Supabase redirects to our app** → `http://localhost:3000/auth/callback`
6. **Our callback processes the session** → User is authenticated

## Testing Authentication

1. Make sure your local Supabase instance is running:
   ```bash
   supabase start
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit the test page: `http://localhost:3000/test-auth`

4. Check the debug information to verify:
   - Environment variables are set correctly
   - Local Supabase connection is working
   - Authentication flow is functional

## Troubleshooting Cookie Issues

The cookie setting errors you're seeing are expected in some contexts and have been handled gracefully. The authentication should still work despite these warnings.

### Common Issues and Solutions

1. **"Cookies can only be modified in Server Action or Route Handler"**
   - This is expected in server components
   - The error is now handled gracefully and won't break authentication
   - Only auth-related cookies will show warnings in development

2. **Authentication not working**
   - Check that all environment variables are set correctly
   - Verify local Supabase instance is running (`supabase status`)
   - Ensure Google OAuth is properly configured
   - Check the test page for detailed debug information

3. **Redirect loops**
   - Clear browser cookies and local storage
   - Check that the redirect URLs are correct
   - Verify the middleware configuration

4. **"Invalid flow state" errors**
   - This usually means the OAuth flow was interrupted
   - Clear browser cookies and try again
   - Ensure redirect URIs are configured correctly

5. **Local Supabase connection issues**
   - Make sure Supabase is running: `supabase status`
   - Check the local dashboard: `http://127.0.0.1:54321`
   - Verify the project is active and healthy

## Files Modified

The following files have been updated to handle cookie issues gracefully:

- `src/lib/supabase-server.ts` - Improved error handling
- `src/lib/supabase/server.ts` - Better cookie management
- `src/app/auth/callback/route.ts` - Enhanced authentication flow
- `middleware.ts` - Graceful cookie handling
- `src/app/api/auth/debug/route.ts` - Better debugging
- `src/app/test-auth/page.tsx` - Comprehensive test page

## Next Steps

1. Start your local Supabase instance: `supabase start`
2. Set up your environment variables with local Supabase URLs
3. Configure Google OAuth in both Google Console and local Supabase
4. Test the authentication flow
5. If issues persist, check the debug page for detailed information

## Support

If you continue to have issues:
1. Check the test page at `/test-auth`
2. Review the debug information
3. Check browser console for errors
4. Verify all environment variables are set correctly
5. Ensure redirect URIs are configured properly in both Google Console and local Supabase
6. Make sure local Supabase is running and healthy 