# Authentication Setup - Clean Implementation

> **⚠️ DEPRECATED DOCUMENTATION**
>
> **Status:** Archived - Superseded by Comprehensive OAuth Guide
> **Date Archived:** 2025-10-07
> **Reason:** This "clean implementation" guide has been superseded by the full-featured authentication system with dual auth, fallbacks, and password reset.
>
> **Current Documentation:** See root `OAUTH_AUTHENTICATION_GUIDE.md` and `docs/DOCUMENTATION_INDEX.md`
>
> ---

## Overview
This is a simplified, best-practice implementation of Supabase authentication with Google OAuth for Next.js 14+.

## Architecture

### 1. Client Structure
- `/lib/supabase/client.ts` - Browser-side Supabase client
- `/lib/supabase/server.ts` - Server-side Supabase client  
- `/lib/supabase/middleware.ts` - Middleware helper for token refresh

### 2. Key Components
- **Middleware** (`/middleware.ts`): Refreshes auth tokens and protects routes
- **AuthProvider** (`/components/auth/AuthProvider.tsx`): Manages auth state client-side
- **Sign In Page** (`/app/signin/page.tsx`): Handles Google OAuth and email/password auth
- **Auth Callback** (`/app/auth/callback/page.tsx`): Processes OAuth callbacks

## Configuration

### Environment Variables (.env.local)
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Authentication Mode
NEXT_PUBLIC_DEMO_MODE=false  # Set to true to bypass authentication
```

### Google OAuth Setup

1. **Google Cloud Console**:
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://[your-project-ref].supabase.co/auth/v1/callback`
   - Note the Client ID and Secret

2. **Supabase Dashboard**:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add Client ID and Secret from Google Cloud Console
   - Save configuration

## Testing

### Local Testing
1. Set `NEXT_PUBLIC_DEMO_MODE=false` in `.env.local`
2. Run `npm run dev`
3. Navigate to `http://localhost:3000`
4. Test Google OAuth sign in

### Production Deployment
1. Configure production domain in Google Cloud Console
2. Update Supabase Auth settings with production URL
3. Deploy with proper environment variables

## Key Improvements from Previous Implementation

1. **Removed complexity**: No more demo modes, auth bypass flags, or local auth fallbacks
2. **Proper client separation**: Distinct server and browser clients
3. **Clean middleware**: Only handles token refresh, no complex logic
4. **Standard OAuth flow**: Uses Supabase's built-in OAuth handling
5. **Security first**: Uses `getUser()` instead of `getSession()` per Supabase recommendations
6. **PKCE flow**: Enabled by default for enhanced security

## Multi-Tenant Expansion (Future)

To expand to multi-domain/multi-tenant:

1. **Database Schema**:
   - Add `tenants` table with domain mapping
   - Add `tenant_id` to user profiles
   - Implement Row Level Security (RLS) policies

2. **Middleware Enhancement**:
   - Check request domain
   - Map to tenant
   - Apply tenant context to requests

3. **OAuth Configuration**:
   - Configure multiple redirect URIs in Google Cloud Console
   - Use dynamic redirect URLs based on domain

## Troubleshooting

### Common Issues

1. **"Failed to sign in with Google"**
   - Verify Google Cloud Console configuration
   - Check Supabase dashboard OAuth settings
   - Ensure redirect URI matches exactly

2. **Session not persisting**
   - Check middleware is running
   - Verify cookies are being set
   - Check browser console for errors

3. **Redirect loops**
   - Ensure middleware matcher is configured correctly
   - Check protected route logic

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs/guides/auth
- Review Next.js auth guides: https://supabase.com/docs/guides/auth/server-side/nextjs