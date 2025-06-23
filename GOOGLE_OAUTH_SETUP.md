# Google OAuth Setup Guide for Renubu

## 🔧 **Google Cloud Console Configuration**

### 1. **Create/Configure Google Cloud Project**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Google+ API (if not already enabled)

### 2. **Configure OAuth Consent Screen**
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

### 3. **Configure OAuth Scopes**
Add these scopes:
- `.../auth/userinfo.email`
- `.../auth/userinfo.profile`
- `openid`

### 4. **Create OAuth Credentials**
1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth Client ID**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
5. Add authorized redirect URIs:
   - `http://127.0.0.1:54321/auth/v1/callback` (Supabase local callback - REQUIRED)
   - `http://localhost:3000/api/auth/callback` (Your app callback - for production)
   - `http://127.0.0.1:3000/api/auth/callback` (Your app callback - for production)

### 5. **Get Credentials**
- Copy the **Client ID** and **Client Secret**
- Update your `.env.local` file:

```env
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_client_id_here
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_client_secret_here
```

## 🚀 **Application Configuration**

### 1. **Environment Variables**
Ensure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=your_google_client_id
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=your_google_client_secret
```

### 2. **Supabase Configuration**
The `supabase/config.toml` should have:
```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
redirect_uri = "http://127.0.0.1:54321/auth/v1/callback"
```

### 3. **Redirect URLs in Supabase**
Add these to `additional_redirect_urls` in `supabase/config.toml`:
```toml
additional_redirect_urls = [
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3000/api/auth/callback",
  "http://localhost:3000",
  "http://localhost:3000/api/auth/callback"
]
```

## 🔄 **OAuth Flow Types**

### **Option 1: Simple OAuth Flow (Recommended for Local Development)**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://127.0.0.1:54321/auth/v1/callback',
  }
})
```

### **Option 2: PKCE Flow (For Production)**
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'http://127.0.0.1:54321/auth/v1/callback',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent',
    },
  }
})
```

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"invalid request: both auth code and code verifier should be non-empty"**
   - **Solution**: Use simple OAuth flow without PKCE for local development
   - Remove `queryParams` from OAuth call

2. **"redirect_uri_mismatch"**
   - **Solution**: Ensure redirect URIs in Google Console match your app
   - **CRITICAL**: Must include `http://127.0.0.1:54321/auth/v1/callback` in Google Console
   - Check both JavaScript origins and redirect URIs

3. **"User from sub claim in JWT does not exist"**
   - **Solution**: Clear all auth cookies and try again
   - Restart Supabase local instance

4. **"Auth session missing"**
   - **Solution**: Check if Supabase is running locally
   - Verify environment variables are correct

### **Debugging Steps:**
1. Check browser console for errors
2. Verify Supabase is running: `supabase status`
3. Check environment variables are loaded
4. Clear browser cookies and local storage
5. Restart development server

## 🔒 **Security Notes**

1. **Never commit OAuth secrets to git**
2. **Use environment variables for all secrets**
3. **Enable HTTPS in production**
4. **Use PKCE flow in production**
5. **Implement proper error handling**

## 📝 **Testing**

1. Start Supabase: `supabase start`
2. Start your app: `npm run dev`
3. Navigate to `/login`
4. Click "Sign in with Google"
5. Complete OAuth flow
6. Verify you're redirected to dashboard

## 🚀 **Production Deployment**

When deploying to production:
1. Update Google OAuth redirect URIs to include your production domain
2. Update Supabase redirect URLs
3. Use PKCE flow for better security
4. Enable HTTPS
5. Set up proper environment variables in your hosting platform 