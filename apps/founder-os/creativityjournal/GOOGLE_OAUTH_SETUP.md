# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Creativity Journal Next.js application.

## Step 1: Configure Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)
   - Click "Create"
5. Copy the Client ID and Client Secret

## Step 2: Set Up Environment Variables

1. Copy the `env.example` file to `.env.local`:
   ```bash
   cp env.example .env.local
   ```

2. Update `.env.local` with your Google OAuth credentials:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_random_secret_here
   ```

3. Generate a random NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

## Step 5: Test the Authentication

1. Open your browser and go to `http://localhost:3000`
2. Click "Sign in with Google"
3. Complete the Google OAuth flow
4. You should be redirected to the dashboard

## Features

- ✅ Google OAuth authentication
- ✅ Automatic session management
- ✅ Protected routes
- ✅ Responsive design
- ✅ Loading states
- ✅ Error handling

## Next Steps

1. **Database Integration**: If you want to store user data, you can integrate with a database using Prisma
2. **User Profile**: Add user profile management
3. **Journal Features**: Implement the actual journal functionality
4. **Production Deployment**: Update the redirect URIs for your production domain

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI" error**: Make sure your redirect URI in Google Console matches exactly
2. **"Client ID not found" error**: Check that your environment variables are set correctly
3. **Session not persisting**: Ensure NEXTAUTH_SECRET is set and consistent

### Debug Mode

To enable debug logging, add this to your `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use strong, random secrets for NEXTAUTH_SECRET
- Keep your Google OAuth credentials secure
- Regularly rotate your secrets 