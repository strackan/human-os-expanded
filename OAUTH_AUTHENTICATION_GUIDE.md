# OAuth Authentication Guide for Renubu

## 🎯 **Overview**

This comprehensive guide covers the complete authentication system for the Renubu application using Next.js and Supabase. The implementation includes Google OAuth, local email/password authentication, automatic fallback mechanisms, password reset functionality, and smart user account linking. It follows industry best practices and provides a secure, resilient, user-friendly authentication experience.

## 🏗️ **Architecture**

### **Multi-Layer Protection System**

1. **Server-Side Middleware** (`middleware.ts`)
   - Runs on every request before page loads
   - Checks authentication status using Supabase
   - Redirects unauthenticated users to `/signin`
   - Handles OAuth callbacks properly

2. **Client-Side Route Guard** (`RouteGuard.tsx`)
   - Provides additional protection at component level
   - Shows loading states during authentication checks
   - Handles client-side redirects

3. **Centralized Configuration** (`auth-config.ts`)
   - Manages public routes consistently
   - Provides helper functions for route checking

## 🔧 **Google Cloud Console Setup**

### **1. Create/Configure Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API

### **2. Configure OAuth Consent Screen**
1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Fill in required information:
   - App name: "Renubu"
   - User support email: Your email
   - Developer contact information: Your email
4. Add authorized domains:
   - `127.0.0.1:54321` (for local Supabase)
   - `localhost:3000` (for local development)
   - Your production domain (when ready)

### **3. Configure OAuth Scopes**
Add these scopes:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `openid`

### **4. Create OAuth Credentials**
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth Client ID**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
5. Add authorized redirect URIs:
   - `http://127.0.0.1:54321/auth/v1/callback` (Supabase local callback - REQUIRED)
   - `http://localhost:3000/auth/callback` (Your app callback)
   - `http://127.0.0.1:3000/auth/callback` (Your app callback)

### **5. Get Credentials**
- Copy the **Client ID** and **Client Secret**
- Update your `.env.local` file (see Environment Variables section)

## 🚀 **Application Configuration**

### **Environment Variables**

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret

# Application Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_URL=http://localhost:3000

# Local Authentication Configuration
NEXT_PUBLIC_LOCAL_AUTH_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED=true
NEXT_PUBLIC_LOCAL_AUTH_MIN_PASSWORD_LENGTH=8

# Force local auth bypass for testing (optional)
NEXT_PUBLIC_FORCE_LOCAL_AUTH=true

# Authentication Bypass Flag (Demo Mode - optional)
NEXT_PUBLIC_AUTH_BYPASS_ENABLED=true
```

### **Getting Local Supabase Credentials**

1. Start your local Supabase instance:
   ```bash
   npx supabase start
   ```

2. Go to your local Supabase dashboard: `http://127.0.0.1:54321`
3. Navigate to Settings > API
4. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### **Supabase Configuration**

The `supabase/config.toml` should have:
```toml
# Google OAuth configuration for local development
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
# Don't override redirect_uri - let Supabase handle it automatically
# redirect_uri = ""
skip_nonce_check = true

[auth]
# Email confirmation is disabled for local development
enable_confirmations = false
additional_redirect_urls = [
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3000/auth/callback",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3001/auth/callback",
  "http://localhost:3000",
  "http://localhost:3000/auth/callback",
  "http://localhost:3001",
  "http://localhost:3001/auth/callback"
]
# Token expiry set to 1 hour for development
jwt_expiry = 3600
enable_signup = true
```

## 🔄 **Authentication System Architecture**

### **🔀 Dual Authentication System**

The application now supports both OAuth and local email/password authentication with intelligent fallback mechanisms:

#### **1. Primary Method: Google OAuth**
- Fast, secure authentication via Google accounts
- No password management for users
- Automatic account creation and login

#### **2. Fallback Method: Local Email/Password**
- Traditional username/password authentication
- Works when OAuth is unavailable or hanging
- Supports user registration and login
- Password reset functionality

#### **3. Hybrid Approach: Account Linking**
- OAuth users can add password authentication
- Password users can link Google accounts
- Smart detection of existing accounts
- Seamless user experience

### **🧠 Smart User Detection System**

The system intelligently detects user account types:

```typescript
// User tries to sign up with email that has OAuth account
if (userExists && hasOAuthOnly) {
  showMessage: "This account exists with Google sign-in. 
                Would you like to set up a password for local authentication?"
}

// User has both OAuth and password
if (userExists && hasPasswordAuth) {
  showMessage: "Account exists. Please sign in instead."
}
```

## 🔄 **Authentication Flows**

### **1. Primary OAuth Flow (With Fallback)**
```
User visits protected page → Redirected to /signin?next=/intended-page
    ↓
User clicks "Sign in with Google" → OAuth health check performed
    ↓
If OAuth healthy → Normal OAuth flow initiated
    ↓
If OAuth hanging/timeout → Automatic fallback to local auth shown
    ↓
Google OAuth redirects to Supabase → http://127.0.0.1:54321/auth/v1/callback
    ↓
Supabase processes OAuth response → Exchanges code for tokens
    ↓
Supabase redirects to app callback → http://localhost:3000/auth/callback
    ↓
App callback creates session → User redirected to intended page or /dashboard
```

### **2. Local Authentication Flow**
```
User visits /signin → Sees dual authentication options
    ↓
User enters email/password → Sign in or Sign up selected
    ↓
If Sign Up: User detection check performed
    ↓
If existing OAuth user → Show password setup option
    ↓
If new user → Create account and send confirmation (if enabled)
    ↓
If Sign In: Authenticate and redirect to intended page
```

### **3. Password Reset Flow**
```
User clicks "Forgot your password?" → Reset modal shown
    ↓
User enters email → Reset link sent to email
    ↓
User clicks email link → Redirected to /auth/reset-password
    ↓
User enters new password → Password updated in Supabase
    ↓
Success message → Redirected to /signin
```

### **4. OAuth User Password Setup Flow**
```
OAuth user tries email signup → System detects existing OAuth account
    ↓
User sees: "Account exists with Google. Set up password?" → User clicks "Yes"
    ↓
Password setup email sent → User clicks email link
    ↓
User redirected to /auth/setup-password → User sets new password
    ↓
Account now has both OAuth and password auth → User can use either method
```

### **2. Sign Out Flow**
```
User clicks avatar → Dropdown appears
    ↓
User clicks "Sign out" → Loading state shown
    ↓
Client-side signout with timeout protection → Session cleared
    ↓
User redirected to /signin → Ready for new sign in
```

### **3. OAuth Implementation**

**Current Implementation (PKCE Flow)**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: redirectUrl,
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  },
})
```

**Simple OAuth Flow (Alternative for Local Development Issues)**
```typescript
const { error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${window.location.origin}/auth/callback${
      next ? `?next=${encodeURIComponent(next)}` : ""
    }`,
    // No queryParams - removes PKCE parameters
  },
})
```

> **Note**: The current implementation uses PKCE flow. If you encounter "invalid request: both auth code and code verifier should be non-empty" errors, switch to the simple OAuth flow by removing the `queryParams` section.

## 🛡️ **Protected Routes**

All routes are protected by default except for these public routes:

### **Authentication Pages**
- `/signin` - Sign-in page
- `/auth/callback` - OAuth callback handler
- `/signout` - Sign-out handler

### **Debug/Test Pages**
- `/debug-auth-state` - Authentication state debugging
- `/debug-env` - Environment debugging
- `/test-oauth*` - OAuth testing pages
- `/test-auth` - Authentication testing
- `/test-signout` - Signout testing
- `/clear-auth` - Clear authentication state

### **Static Files**
- `/favicon.ico`
- `/robots.txt`
- `/sitemap.xml`
- `/clear-cookies.html`

## 📁 **Key Implementation Files**

### **Server-Side Protection**
- `middleware.ts` - Main authentication middleware
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/app/signout/route.ts` - Sign-out handler

### **Client-Side Protection**
- `src/components/auth/RouteGuard.tsx` - Client-side route protection
- `src/components/auth/AuthProvider.tsx` - Authentication context
- `src/components/auth/ProtectedRoute.tsx` - Component-level protection

### **Authentication Pages**
- `src/app/signin/page.tsx` - Clean sign-in page
- `src/app/settings/page.tsx` - User settings page

### **Configuration**
- `src/lib/auth-config.ts` - Centralized authentication configuration
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/supabase-server.ts` - Server-side Supabase client

## 🎯 **Features**

### **✅ Implemented**
- [x] Server-side middleware protection
- [x] Client-side route guard
- [x] OAuth callback handling
- [x] Proper redirect after authentication
- [x] Loading states during auth checks
- [x] Centralized configuration
- [x] Comprehensive public route management
- [x] Error handling for auth failures
- [x] Settings page with user information
- [x] Enhanced signout with timeout protection
- [x] Session refresh functionality

### **🔄 Authentication States**
- **Loading**: Shows spinner while checking authentication
- **Unauthenticated**: Redirects to sign-in page
- [x] **Authenticated**: Allows access to protected pages
- **Error**: Shows error message and retry options

## 🧪 **Testing**

### **1. Test Sign In**
```
http://localhost:3000/signin
```
- Should show clean signin interface
- Should redirect to `/dashboard` after successful authentication (or intended page if `next` parameter is provided)

### **2. Test Protected Routes**
- Visit any protected route (e.g., `/dashboard`, `/insights`)
- Should redirect to `/signin` if not authenticated
- Should redirect to intended page after authentication

### **3. Test Sign Out**
- Click avatar in top-right corner
- Click "Sign out" in dropdown
- Should show loading state with timeout protection
- Should redirect to `/signin` after signout

### **4. Test OAuth Flow**
Visit: `http://localhost:3000/test-oauth-simple`
- Should work without server-side rendering errors
- Should demonstrate OAuth flow without PKCE

### **5. Test Signout Functionality**
Visit: `http://localhost:3000/test-signout`
- Dedicated test page for signout verification
- Check browser console for detailed logs

## 🐛 **Troubleshooting**

### **Common Issues & Solutions**

1. **"invalid request: both auth code and code verifier should be non-empty"**
   - **Root Cause**: PKCE flow issues with code verifier management
   - **Solution**: Switch to simple OAuth flow by removing `queryParams` from OAuth call
   - **Alternative**: Clear browser cache, restart Supabase, and ensure environment variables are correct

2. **"redirect_uri_mismatch"**
   - **Solution**: Ensure redirect URIs in Google Console match your app
   - **CRITICAL**: Must include `http://127.0.0.1:54321/auth/v1/callback` in Google Console
   - Check both JavaScript origins and redirect URIs

3. **Infinite redirect loops**
   - Clear browser cookies and local storage
   - Restart Supabase local instance: `npx supabase stop && npx supabase start`
   - Check middleware logs for auth state

4. **Authentication not persisting**
   - Verify Supabase is running: `npx supabase status`
   - Check environment variables are loaded
   - Clear and re-authenticate

5. **Signout hanging or not working**
   - The implementation now includes timeout protection
   - Check `/test-signout` page for debugging
   - Clear browser cache if issues persist

6. **Cookie setting errors**
   - Expected in server components - handled gracefully
   - Authentication will still work despite warnings
   - Only affects development console output

### **Debugging Steps**

1. **Check Supabase Status**
   ```bash
   npx supabase status
   ```

2. **View Auth Logs**
   ```bash
   npx supabase logs
   ```

3. **Clear Authentication Data**
   ```bash
   npm run clear-auth
   ```

4. **Reset Supabase (if issues persist)**
   ```bash
   npx supabase stop
   npx supabase reset
   npx supabase start
   ```

5. **Clear Browser Data**
   - Clear cookies, local storage, and session storage
   - Try in incognito/private mode
   - Visit: `http://localhost:3000/clear-cookies.html`

## 🔒 **Security Considerations**

### **Development vs Production**

**Local Development (Current Setup):**
- Simple OAuth flow without PKCE
- HTTP connections acceptable
- Detailed error logging

**Production Requirements:**
- Enable PKCE in Supabase dashboard
- Use HTTPS exclusively
- Update redirect URIs for production domain
- Implement rate limiting
- Monitor authentication metrics

### **Best Practices Implemented**

1. **Server-Side Protection**: Middleware runs before any page loads
2. **Client-Side Backup**: RouteGuard provides additional protection
3. **Secure Session Management**: Proper session creation and cleanup
4. **Error Handling**: Comprehensive error handling and user feedback
5. **Timeout Protection**: Prevents hanging during signout process
6. **Cookie Security**: Proper cookie management in middleware and API routes

## 🚀 **Production Deployment**

### **Environment Variables for Production**
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
NEXT_PUBLIC_URL=https://your-production-domain.com
```

### **Google OAuth Console Updates**
1. Add production redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - `https://your-production-domain.com/auth/callback`

2. Add production JavaScript origins:
   - `https://your-production-domain.com`

### **Supabase Configuration Updates**
1. Update `redirect_uri` in Supabase dashboard
2. Enable PKCE for enhanced security
3. Configure production redirect URLs
4. Set up proper CORS settings

### **Security Enhancements for Production**
1. **Enable PKCE**: Go to Supabase Dashboard > Authentication > Settings
2. **HTTPS Only**: Ensure all connections use HTTPS
3. **Rate Limiting**: Implement OAuth endpoint rate limiting
4. **Monitoring**: Set up authentication success/failure monitoring
5. **Error Handling**: Implement production-appropriate error messages

## 📈 **Performance & User Experience**

### **Performance Optimizations**
- **Middleware**: Fast server-side authentication checks
- **RouteGuard**: Minimal client-side overhead
- **Caching**: Supabase handles session caching automatically
- **Loading States**: Smooth user experience during auth checks

### **User Experience Features**
- **Seamless Redirects**: Users return to intended page after authentication
- **Loading States**: Clear feedback during authentication processes
- **Error Messages**: User-friendly error messages with recovery options
- **Timeout Protection**: Prevents hanging during signout process
- **Accessibility**: Proper ARIA labels and keyboard navigation

## 📚 **References & Resources**

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Hemanta Sundaray's Guide](https://www.hemantasundaray.com/blog/implement-google-signin-nextjs-supabase-auth) (Implementation reference)

## 🎉 **Success Criteria**

The OAuth implementation is considered successful when:

1. ✅ Users can sign in with Google without errors
2. ✅ Sessions are properly created and maintained
3. ✅ Protected routes redirect unauthenticated users to sign-in
4. ✅ No server-side rendering errors occur
5. ✅ Authentication flow is reliable and consistent
6. ✅ Signout functionality works without hanging
7. ✅ Users can access settings and account information
8. ✅ Error handling provides clear feedback to users

This implementation follows industry best practices and provides a solid foundation for authentication in your Next.js + Supabase application.
