# Simplified Google OAuth Setup Guide

## 🎯 **Overview**
This guide implements a simplified Google OAuth authentication system based on best practices from the tutorials you provided. The implementation removes complex components and follows a straightforward approach.

## 🔧 **Key Changes Made**

### 1. **Simplified Middleware**
- Removed complex cookie checking logic
- Simplified public routes handling
- Clean authentication flow

### 2. **Streamlined Callback Route**
- Single callback route at `/auth/callback`
- Removed complex cookie handling
- Simple error handling

### 3. **Clean Sign-in Page**
- Removed complex error states
- Simple OAuth flow without PKCE
- Clean UI

### 4. **Removed Conflicting Components**
- Removed AuthProvider and RouteGuard from layout
- Eliminated complex state management
- Simplified architecture

## 🚀 **Setup Instructions**

### 1. **Environment Variables**
Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google OAuth Configuration
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id_here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret_here
```

### 2. **Google Cloud Console Setup**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable Google+ API
4. Go to **APIs & Services** > **OAuth consent screen**
   - Choose **External** user type
   - Fill in required information
5. Go to **APIs & Services** > **Credentials**
   - Create OAuth Client ID
   - Application type: **Web application**
   - Add authorized JavaScript origins:
     - `http://localhost:3000`
     - `http://127.0.0.1:3000`
   - Add authorized redirect URIs:
     - `http://127.0.0.1:54321/auth/v1/callback` (REQUIRED for local Supabase)
     - `http://localhost:3000/auth/callback`
     - `http://127.0.0.1:3000/auth/callback`

### 3. **Supabase Configuration**
The `supabase/config.toml` is already configured with:
```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
skip_nonce_check = true
```

### 4. **Start Supabase**
```bash
supabase start
```

### 5. **Run the Application**
```bash
npm run dev
```

## 🔄 **OAuth Flow**

### **Simple Flow (Current Implementation)**
1. User clicks "Sign in with Google" on `/signin`
2. Redirects to Google OAuth
3. Google redirects to `http://127.0.0.1:54321/auth/v1/callback`
4. Supabase processes the OAuth code
5. Supabase redirects to your app at `/auth/callback`
6. Your app exchanges the code for a session
7. User is redirected to the intended page

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"redirect_uri_mismatch"**
   - Ensure `http://127.0.0.1:54321/auth/v1/callback` is in Google Console
   - Check both JavaScript origins and redirect URIs

2. **"invalid request: both auth code and code verifier should be non-empty"**
   - This is fixed by removing PKCE parameters
   - Using simple OAuth flow for local development

3. **Authentication not persisting**
   - Clear browser cookies and local storage
   - Restart Supabase: `supabase stop && supabase start`
   - Check environment variables are loaded

4. **Infinite redirect loops**
   - Clear all cookies for localhost
   - Restart the development server
   - Check middleware logs

## 📁 **Key Files**

### **Authentication Files:**
- `middleware.ts` - Simplified authentication middleware
- `src/app/signin/page.tsx` - Clean sign-in page
- `src/app/auth/callback/route.ts` - Simplified OAuth callback
- `supabase/config.toml` - Supabase OAuth configuration

### **Removed Complex Components:**
- `src/components/auth/AuthProvider.tsx` - Removed from layout
- `src/components/auth/RouteGuard.tsx` - Removed from layout
- `src/lib/auth-config.ts` - Simplified middleware doesn't use this

## ✅ **Benefits of This Approach**

1. **Simplified Architecture**: Removed complex state management
2. **Better Performance**: Fewer components and checks
3. **Easier Debugging**: Clear, straightforward flow
4. **Follows Best Practices**: Based on proven tutorials
5. **Reduced Conflicts**: Eliminated timing issues between components

## 🔒 **Security Notes**

- For production, enable PKCE in Supabase dashboard
- Use HTTPS in production
- Implement proper session management
- Add rate limiting for OAuth endpoints

## 🚀 **Next Steps**

1. Test the authentication flow
2. Add user profile management if needed
3. Implement proper error handling
4. Add loading states for better UX
5. Consider adding other OAuth providers

This simplified approach should resolve the authentication issues you were experiencing by removing the complex, conflicting components and following the proven patterns from the tutorials. 