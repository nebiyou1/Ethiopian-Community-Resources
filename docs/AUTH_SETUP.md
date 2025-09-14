# Authentication Setup Guide

## Google OAuth with Supabase

### Environment Variables Required

You already have these configured in Netlify:

```bash
# Supabase Configuration
SUPABASE_URL=https://qvqybobnsaikaknsdqhw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y
USE_SUPABASE=true

# Google OAuth
GOOGLE_CLIENT_ID=990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[YOUR_SECRET_FROM_NETLIFY]

# Session Secret
SESSION_SECRET=[GENERATE_RANDOM_STRING]

# Supabase Service Role
SUPABASE_SERVICE_ROLE_KEY=[GET_FROM_SUPABASE_DASHBOARD]
```

### Supabase Configuration

✅ **Google Auth is already configured in Supabase:**
- Client ID: `990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com`
- Callback URL: `https://qvqybobnsaikaknsdqhw.supabase.co/auth/v1/callback`

⚠️ **IMPORTANT: Site URL Configuration**
To fix the redirect issue (`http://localhost:3000/#`), you need to configure the **Site URL** in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qvqybobnsaikaknsdqhw`
3. Go to **Authentication** → **URL Configuration**
4. Set **Site URL** to:
   - For local development: `http://localhost:5173`
   - For production: `https://ethiopian-community-resources.netlify.app`
5. Add **Redirect URLs**:
   - `http://localhost:5173/**` (for local development)
   - `https://ethiopian-community-resources.netlify.app/**` (for production)

### Next Steps

1. **Generate Session Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Get Supabase Service Role Key:**
   - Go to Supabase Dashboard → Settings → API
   - Copy the `service_role` key (not the `anon` key)

3. **Update Netlify Environment Variables:**
   - Add the generated `SESSION_SECRET`
   - Add the `SUPABASE_SERVICE_ROLE_KEY`

4. **Test Authentication:**
   - Deploy to Netlify
   - Test Google sign-in functionality

### Authentication Flow

1. User clicks "Sign in with Google"
2. Redirects to Google OAuth
3. Google redirects back to Supabase callback
4. Supabase handles the authentication
5. User is logged in and redirected to the app

### Frontend Integration

The app will use Supabase Auth client to:
- Handle Google sign-in
- Manage user sessions
- Protect routes
- Store user preferences

