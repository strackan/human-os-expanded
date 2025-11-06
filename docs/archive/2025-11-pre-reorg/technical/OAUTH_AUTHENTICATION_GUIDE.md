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

### **5. Sign Out Flow**
```
User clicks avatar → Dropdown appears
    ↓
User clicks "Sign out" → Loading state shown
    ↓
Client-side signout with timeout protection → Session cleared
    ↓
User redirected to /signin → Ready for new sign in
```

### **6. OAuth Implementation Details**

**Enhanced OAuth with Fallback Protection**
```typescript
// 1. Health check before OAuth attempt (prevents hanging)
async checkOAuthHealth(): Promise<boolean> {
  // Quick environment check without initiating OAuth flow
  const hasGoogleConfig = !!(
    process.env.SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID &&
    process.env.NEXT_PUBLIC_SUPABASE_URL
  )
  return hasGoogleConfig
}

// 2. OAuth with timeout protection
async signInWithOAuth(provider: 'google' = 'google'): Promise<AuthResult> {
  const { data, error } = await this.supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
}

// 3. Fallback mechanism with timeout
async signInWithFallback(provider: 'google' = 'google'): Promise<AuthResult> {
  // Force local auth if enabled
  if (process.env.NEXT_PUBLIC_FORCE_LOCAL_AUTH === 'true') {
    return { 
      success: false, 
      authType: 'fallback',
      message: 'Please use email/password authentication.' 
    }
  }

  // Health check first
  const isHealthy = await this.checkOAuthHealth()
  if (!isHealthy) {
    return { 
      success: false, 
      authType: 'fallback',
      message: 'Google OAuth is currently unavailable.' 
    }
  }

  // Try OAuth with 3-second timeout
  const oauthResult = await this.signInWithOAuthWithTimeout(provider)
  return oauthResult.success ? oauthResult : {
    success: false,
    authType: 'fallback',
    message: 'Google OAuth timed out. Please use email/password instead.'
  }
}
```

**Critical Middleware Fix**
```typescript
// BEFORE (caused hanging): Using getSession()
const { data: { session }, error } = await supabase.auth.getSession()

// AFTER (fixed hanging): Using getUser()
const { data: { user }, error } = await supabase.auth.getUser()
```

> **🚨 Critical Fix**: The middleware now uses `getUser()` instead of `getSession()` per Supabase documentation to prevent hanging issues in non-incognito browsers.

## 🛡️ **Protected Routes**

All routes are protected by default except for these public routes:

### **Authentication Pages**
- `/signin` - Enhanced dual authentication sign-in page
- `/auth/callback` - OAuth callback handler (client-side)
- `/auth/setup-password` - Password setup for OAuth users
- `/auth/reset-password` - Password reset page
- `/signout` - Sign-out handler

### **Debug/Test Pages**
- `/debug-auth` - Enhanced authentication state debugging
- `/debug-env` - Environment debugging
- `/test-oauth*` - OAuth testing pages
- `/test-auth` - Authentication testing
- `/test-signout` - Signout testing
- `/clear-auth` - Clear authentication state

### **Static Files**
- `/favicon.ico`
- `/robots.txt`
- `/sitemap.xml`
- `/clear-auth.html` - Interactive auth data cleanup tool

## 📁 **Key Implementation Files**

### **Server-Side Protection**
- `middleware.ts` - Enhanced authentication middleware (uses getUser() to prevent hanging)
- `src/app/auth/callback/route.ts` - Server-side OAuth callback handler
- `src/app/signout/route.ts` - Sign-out handler

### **Client-Side Authentication**
- `src/app/auth/callback/page.tsx` - Client-side OAuth callback processor
- `src/app/auth/setup-password/page.tsx` - Password setup for OAuth users
- `src/app/auth/reset-password/page.tsx` - Password reset interface
- `src/components/auth/RouteGuard.tsx` - Client-side route protection
- `src/components/auth/AuthProvider.tsx` - Authentication context
- `src/components/auth/ProtectedRoute.tsx` - Component-level protection

### **Authentication Pages & Services**
- `src/app/signin/page.tsx` - Dual authentication sign-in page with modals
- `src/app/debug-auth/page.tsx` - Enhanced authentication debugging
- `src/lib/auth-service.ts` - Comprehensive authentication service with fallbacks
- `src/app/settings/page.tsx` - User settings page

### **Configuration**
- `src/lib/auth-config.ts` - Centralized authentication configuration
- `src/lib/supabase.ts` - Enhanced Supabase client with error handling
- `src/lib/supabase-server.ts` - Server-side Supabase client with helper functions

### **Static Tools**
- `public/clear-auth.html` - Interactive authentication data cleanup tool

## 🎯 **Features**

### **✅ Core Authentication Features**
- [x] **Dual Authentication System**: OAuth + Local email/password
- [x] **Smart Fallback Mechanism**: Automatic OAuth→Local fallback when hanging
- [x] **Enhanced Middleware**: Uses getUser() to prevent hanging (critical fix)
- [x] **Client-side OAuth Callback**: Proper token exchange and session creation
- [x] **Server-side Protection**: Middleware-based route protection
- [x] **Client-side Route Guard**: Additional protection layer

### **✅ User Experience Features**  
- [x] **Smart User Detection**: Detects existing OAuth/password accounts
- [x] **Account Linking**: OAuth users can add passwords, password users can link OAuth
- [x] **Password Reset**: Forgot password functionality with email links
- [x] **Password Setup**: OAuth users can set up local authentication
- [x] **Interactive Modals**: User-friendly signup/reset/setup dialogs
- [x] **Loading States**: Smooth transitions and user feedback
- [x] **Error Handling**: Comprehensive error messages and recovery options

### **✅ Advanced Features**
- [x] **OAuth Health Checking**: Pre-flight checks to prevent hanging
- [x] **Timeout Protection**: 3-second OAuth timeout with fallback
- [x] **Session Corruption Cleanup**: Interactive auth data cleanup tool
- [x] **Environment Detection**: Force local auth for testing
- [x] **Enhanced Debugging**: Comprehensive auth state debugging page
- [x] **Settings Integration**: User settings page with account info
- [x] **Proper Redirects**: Returns to intended page after authentication

### **🔄 Authentication States**
- **Loading**: Shows spinner while checking authentication
- **Unauthenticated**: Redirects to sign-in page
- [x] **Authenticated**: Allows access to protected pages
- **Error**: Shows error message and retry options

## 🧪 **Testing**

### **1. Test Dual Authentication System**
```
http://localhost:3000/signin
```
**OAuth Testing:**
- Click "Sign in with Google" → Should work or show fallback
- If OAuth hangs, should automatically show "Use Email/Password Instead" button
- Test "Skip OAuth - Use Email/Password" button

**Local Auth Testing:**
- Enter email/password → Test sign in/sign up
- Test password validation (minimum 8 characters)
- Test "Forgot your password?" link

### **2. Test Smart User Detection**
**Scenario A: OAuth user tries email signup**
- Sign up with Google first
- Try to sign up with same email using password
- Should show: "Account exists with Google sign-in. Set up password?"
- Click "Yes" → Should send password setup email

**Scenario B: Existing user detection**
- Try to sign up with existing email
- Should show: "Account exists. Please sign in instead."

### **3. Test Password Reset Flow**
- Click "Forgot your password?"
- Enter email → Click "Send Reset Link"
- Check email → Click link → Should go to reset page
- Enter new password → Should redirect to signin with success message

### **4. Test OAuth User Password Setup**
- Create account with Google OAuth
- Try to sign up with same email
- Click "Yes, Set Up Password"
- Follow email link → Set password
- Should now be able to use both OAuth and password auth

### **5. Test Authentication States**
```
http://localhost:3000/debug-auth
```
- Click "Check Auth State" → Should show session info
- Click "Clear Auth Data" → Should clean corrupted data
- Test in both regular and incognito browsers

### **6. Test Protected Routes & Middleware**
- Visit protected route → Should redirect to signin
- Sign in → Should redirect to intended page
- Test middleware timeout handling
- Verify no hanging in non-incognito mode

### **7. Test Session Corruption Cleanup**
```
http://localhost:3000/clear-auth.html
```
- Test "Clear ALL Auth Data" button
- Test "Clear Supabase Data Only" button  
- Check auth data display
- Verify cleanup effectiveness

## 🐛 **Troubleshooting**

### **🚨 Critical Issues & Solutions**

1. **OAuth Hanging in Non-Incognito Browsers (FIXED)**
   - **Root Cause**: Middleware using `getSession()` causes hanging
   - **Solution Applied**: Middleware now uses `getUser()` per Supabase docs
   - **File Fixed**: `middleware.ts:45-50` 
   - **Result**: No more hanging, 3-second timeout for additional protection

2. **OAuth Fallback Not Triggering (FIXED)**
   - **Root Cause**: Health check was initiating OAuth flow
   - **Solution Applied**: Health check now only validates environment variables
   - **File Fixed**: `src/lib/auth-service.ts:28-49`
   - **Result**: Immediate fallback when OAuth unavailable

### **🔧 Authentication Issues & Solutions**

3. **User Detection Not Working**
   - **Root Cause**: Complex error message parsing unreliable
   - **Solution**: Use signup attempt with `identities.length === 0` detection
   - **Implementation**: `src/lib/auth-service.ts:241-271`

4. **Password Reset Not Available**
   - **Solution**: Added "Forgot your password?" link and reset flow
   - **New Pages**: `/auth/reset-password`, reset modal in signin
   - **Implementation**: Complete password reset with email links

5. **OAuth User Can't Add Password**
   - **Solution**: Smart account linking with password setup emails
   - **New Flow**: Detect OAuth-only accounts → Offer password setup
   - **New Page**: `/auth/setup-password` for secure password creation

6. **Session Corruption in Development**
   - **Solution**: Interactive cleanup tool at `/clear-auth.html`
   - **Features**: Clear all auth data, check current state, manual cleanup

### **🐛 Legacy Issues & Solutions**

7. **"redirect_uri_mismatch"**
   - **Solution**: Ensure redirect URIs in Google Console match your app
   - **Required URIs**: 
     - `http://127.0.0.1:54321/auth/v1/callback` (Supabase callback)
     - `http://localhost:3000/auth/callback` (App callback)

8. **Environment Variable Issues**
   - **Critical**: All local auth variables must use `NEXT_PUBLIC_` prefix
   - **Fixed Variables**: `NEXT_PUBLIC_LOCAL_AUTH_FALLBACK_ENABLED=true`
   - **Check**: Use `/debug-auth` page to verify all environment variables

9. **Infinite redirect loops**
   - **Quick Fix**: Visit `/clear-auth.html` → Click "Clear ALL Auth Data"
   - **Alternative**: `npx supabase db reset` to restart clean
   - **Prevention**: Enhanced middleware prevents most redirect loops

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
