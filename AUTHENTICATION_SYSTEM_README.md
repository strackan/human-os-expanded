# Authentication System Implementation

## 🔐 **Overview**

This implementation provides comprehensive authentication protection for all internal pages in the Renubu application. Users who are not authenticated will be automatically redirected to the sign-in page, and upon successful authentication, they will be redirected back to their originally requested page.

> **📋 For complete OAuth setup and configuration details, see [OAUTH_AUTHENTICATION_GUIDE.md](./OAUTH_AUTHENTICATION_GUIDE.md)**

## 🏗️ **Architecture**

### **Multi-Layer Protection**

1. **Server-Side Middleware** (`middleware.ts`)
   - Runs on every request before the page loads
   - Checks authentication status using Supabase
   - Redirects unauthenticated users to `/signin`
   - Handles OAuth callbacks properly

2. **Client-Side Route Guard** (`RouteGuard.tsx`)
   - Provides additional protection at the component level
   - Shows loading states during authentication checks
   - Handles client-side redirects

3. **Centralized Configuration** (`auth-config.ts`)
   - Manages public routes consistently across the application
   - Provides helper functions for route checking

## 🛡️ **Protected Routes**

All routes are protected by default except for the following public routes:

### **Authentication Pages**
- `/signin` - Sign-in page
- `/auth/callback` - OAuth callback handler
- `/auth/signout` - Sign-out handler

### **Debug/Test Pages**
- `/debug-auth-state` - Authentication state debugging
- `/debug-env` - Environment debugging
- `/test-oauth*` - OAuth testing pages
- `/test-auth` - Authentication testing
- `/clear-auth` - Clear authentication state

### **Static Files**
- `/favicon.ico`
- `/robots.txt`
- `/sitemap.xml`
- `/clear-cookies.html`

## 🔄 **Authentication Flow**

### **1. Unauthenticated User Access**
```
User visits /dashboard
    ↓
Middleware checks authentication
    ↓
No user found → Redirect to /signin?next=/dashboard
    ↓
User completes OAuth flow
    ↓
Redirect to /auth/callback?next=/dashboard
    ↓
Session created → Redirect to /dashboard
```

### **2. OAuth Callback Flow**
```
Google OAuth redirects to /auth/callback
    ↓
Exchange code for session
    ↓
Create user session
    ↓
Redirect to original page (next parameter)
```

### **3. Sign Out Flow**
```
User clicks sign out
    ↓
Clear session on server
    ↓
Redirect to /signin
```

## 📁 **Key Files**

### **Server-Side Protection**
- `middleware.ts` - Main authentication middleware
- `src/app/auth/callback/route.ts` - OAuth callback handler
- `src/app/signout/route.ts` - Sign-out handler

### **Client-Side Protection**
- `src/components/auth/RouteGuard.tsx` - Client-side route protection
- `src/components/auth/AuthProvider.tsx` - Authentication context
- `src/app/layout.tsx` - Root layout with RouteGuard integration

### **Configuration**
- `src/lib/auth-config.ts` - Centralized authentication configuration

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

### **🔄 Authentication States**
- **Loading**: Shows spinner while checking authentication
- **Unauthenticated**: Redirects to sign-in page
- **Authenticated**: Allows access to protected pages
- **Error**: Shows error message and retry options

## 🚀 **Usage**

### **Adding New Protected Routes**
All routes are protected by default. No additional configuration needed.

### **Adding New Public Routes**
Update the `publicRoutes` array in `src/lib/auth-config.ts`:

```typescript
publicRoutes: [
  // ... existing routes
  '/your-new-public-route'
]
```

### **Custom Redirect Logic**
Modify the `getNextRedirect` function in `auth-config.ts` for custom redirect logic.

## 🔧 **Configuration**

### **Environment Variables**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

### **Supabase Configuration**
Ensure your `supabase/config.toml` has OAuth configured:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **"redirect_uri_mismatch"**
   - Ensure Google OAuth redirect URIs include `http://127.0.0.1:54321/auth/v1/callback`
   - Check both JavaScript origins and redirect URIs in Google Console

2. **Infinite redirect loops**
   - Clear browser cookies and local storage
   - Restart Supabase local instance
   - Check middleware logs for auth state

3. **Authentication not persisting**
   - Verify Supabase is running: `supabase status`
   - Check environment variables are loaded
   - Clear and re-authenticate

### **Debug Commands**
```bash
# Check Supabase status
supabase status

# View auth logs
supabase logs

# Clear auth cookies
npm run clear-auth
```

## 🔒 **Security Considerations**

1. **Server-Side Protection**: Middleware runs before any page loads
2. **Client-Side Backup**: RouteGuard provides additional protection
3. **Secure OAuth**: Uses PKCE flow for production
4. **Session Management**: Proper session creation and cleanup
5. **Error Handling**: Comprehensive error handling and user feedback

## 📈 **Performance**

- **Middleware**: Fast server-side checks
- **RouteGuard**: Minimal client-side overhead
- **Caching**: Supabase handles session caching
- **Loading States**: Smooth user experience during auth checks

## 🎨 **User Experience**

- **Seamless Redirects**: Users return to their intended page after auth
- **Loading States**: Clear feedback during authentication
- **Error Messages**: Helpful error messages for auth failures
- **Responsive Design**: Works on all device sizes 