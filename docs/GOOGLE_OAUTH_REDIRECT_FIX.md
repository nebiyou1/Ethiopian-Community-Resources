# Google OAuth Redirect Fix Guide

## The Problem
When users sign in with Google, they get redirected to `http://localhost:3000/#` instead of staying on the React app (`http://localhost:5173` or the Netlify URL).

## Root Cause
The issue is in the **Supabase Site URL configuration**. Supabase handles Google OAuth internally and then redirects users back to your app based on the Site URL setting.

## Solution: Configure Supabase Site URL

### Step 1: Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `qvqybobnsaikaknsdqhw`

### Step 2: Configure Authentication URLs
1. Go to **Authentication** → **URL Configuration**
2. Set the **Site URL** to:
   - **For local development**: `http://localhost:5173`
   - **For production**: `https://ethiopian-community-resources.netlify.app`

### Step 3: Add Redirect URLs
In the **Redirect URLs** section, add:
- `http://localhost:5173/**` (for local development)
- `https://ethiopian-community-resources.netlify.app/**` (for production)

### Step 4: Save Configuration
Click **Save** to apply the changes.

## How It Works

1. **User clicks "Sign In with Google"**
2. **Redirects to Google OAuth** (handled by Supabase)
3. **Google redirects back to Supabase** (`https://qvqybobnsaikaknsdqhw.supabase.co/auth/v1/callback`)
4. **Supabase processes the authentication**
5. **Supabase redirects user back to your app** using the Site URL you configured
6. **User is logged in** and stays on your React app

## Current Configuration Status

✅ **Google OAuth Client**: Already configured in Supabase
✅ **Callback URL**: `https://qvqybobnsaikaknsdqhw.supabase.co/auth/v1/callback`
✅ **React App**: Updated to use correct redirect logic
✅ **Deployment**: Latest version deployed to Netlify

⚠️ **Missing**: Site URL configuration in Supabase Dashboard

## Testing

### Local Development
1. Start React dev server: `cd ethiopia-community-react && npm run dev`
2. Open `http://localhost:5173`
3. Click "Sign In with Google"
4. Should redirect back to `http://localhost:5173` after authentication

### Production
1. Visit `https://ethiopian-community-resources.netlify.app`
2. Click "Sign In with Google"
3. Should redirect back to the Netlify URL after authentication

## No Special Login Required

You don't need to log in to Netlify for Google authentication to work. The issue is purely in the Supabase configuration, not in Netlify or your Google OAuth setup.

## Alternative: Environment-Based Configuration

If you want different redirects for different environments, you can also configure this in your Supabase project settings by adding multiple redirect URLs for different environments.
