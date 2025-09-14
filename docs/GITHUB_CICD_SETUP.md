# GitHub CI/CD Setup Guide

This guide will help you set up continuous integration and deployment for the Ethiopia Community Resources project using GitHub Actions and Netlify.

## 🚀 Quick Setup Overview

1. **GitHub Repository**: Already configured ✅
2. **GitHub Actions**: Workflow configured ✅
3. **GitHub Secrets**: Need to configure
4. **Netlify Connection**: Need to connect
5. **Environment Variables**: Need to sync

## 📋 Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions, then add these secrets:

### 🔐 Supabase Secrets
```
SUPABASE_URL=https://qvqybobnsaikaknsdqhw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard → Settings → API]
SUPABASE_PROJECT_REF=qvqybobnsaikaknsdqhw
SUPABASE_ACCESS_TOKEN=[Get from Supabase Dashboard → Settings → Access Tokens]
SUPABASE_DB_PASSWORD=9734937731Girma
```

### 🌐 Netlify Secrets
```
NETLIFY_AUTH_TOKEN=[Get from Netlify → User Settings → Applications → Personal Access Tokens]
NETLIFY_SITE_ID=[Get from Netlify → Site Settings → General → Site Information]
NETLIFY_URL=https://ethiopian-community-resources.netlify.app
```

### 🔑 Authentication Secrets
```
GOOGLE_CLIENT_ID=990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
SESSION_SECRET=[Generate a random string]
```

## 🔧 Step-by-Step Setup

### Step 1: Get Supabase Service Role Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw)
2. Navigate to Settings → API
3. Copy the `service_role` key (not the `anon` key)
4. Add it as `SUPABASE_SERVICE_ROLE_KEY` in GitHub secrets

### Step 2: Get Supabase Access Token

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/account/tokens)
2. Create a new access token
3. Add it as `SUPABASE_ACCESS_TOKEN` in GitHub secrets

### Step 3: Connect to Netlify

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "New site from Git"
3. Choose GitHub and select your repository: `nebiyou1/Ethiopian-Community-Resources`
4. Configure build settings:
   - **Build command**: `npm run netlify:build`
   - **Publish directory**: `dist`
   - **Functions directory**: `netlify/functions`

### Step 4: Get Netlify Secrets

1. **Netlify Auth Token**:
   - Go to Netlify → User Settings → Applications
   - Create a new Personal Access Token
   - Add it as `NETLIFY_AUTH_TOKEN` in GitHub secrets

2. **Netlify Site ID**:
   - Go to your site in Netlify → Site Settings → General
   - Copy the Site ID from "Site Information"
   - Add it as `NETLIFY_SITE_ID` in GitHub secrets

### Step 5: Configure Netlify Environment Variables

In your Netlify site dashboard → Site Settings → Environment Variables, add:

```
USE_SUPABASE=true
SUPABASE_URL=https://qvqybobnsaikaknsdqhw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y
SUPABASE_SERVICE_ROLE_KEY=[Your service role key]
GOOGLE_CLIENT_ID=990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[Your Google OAuth Client Secret]
SESSION_SECRET=[Your random session secret]
```

## 🔄 CI/CD Workflow

Our GitHub Actions workflow includes:

### 🧪 **Test and Build** (runs on every push/PR)
- Installs dependencies
- Runs linting
- Runs unit and integration tests
- Builds the application
- Uploads build artifacts

### 🗄️ **Database Migration** (runs on main branch only)
- Installs Supabase CLI
- Runs database migrations
- Seeds database with community data

### 🚀 **Deploy to Netlify** (runs after successful tests)
- Downloads build artifacts
- Deploys to Netlify
- Updates deployment status

### 🔍 **Health Check** (runs after deployment)
- Tests API endpoints
- Verifies database connection
- Confirms application functionality

### 📢 **Notifications** (runs after all jobs)
- Reports deployment success/failure
- Provides deployment URLs and status

## 🛠️ Manual Deployment Commands

For local testing and manual deployments:

```bash
# Build for production
npm run build:production

# Test the build locally
npm start

# Deploy to Netlify (requires Netlify CLI)
npm run deploy:netlify

# Run health checks
npm run health-check

# Setup database schema
npm run migrate:supabase
```

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all environment variables are set correctly
2. **Database Connection**: Verify Supabase credentials and service role key
3. **Netlify Deploy Fails**: Check build command and publish directory
4. **API Endpoints 404**: Ensure serverless functions are deployed correctly

### Debug Commands:

```bash
# Check environment variables
echo $SUPABASE_URL
echo $USE_SUPABASE

# Test database connection
node -e "console.log(require('./services/databaseService-v2'))"

# Test API locally
curl http://localhost:3000/api/programs
curl http://localhost:3000/api/programs/stats
```

## 📊 Monitoring

After setup, monitor your deployments:

1. **GitHub Actions**: Check workflow runs in the Actions tab
2. **Netlify**: Monitor deployments in the Netlify dashboard
3. **Supabase**: Check database health in Supabase dashboard
4. **Application**: Use the health check endpoint: `/api/health`

## 🎉 Success Indicators

Your CI/CD is working correctly when:

- ✅ GitHub Actions workflow completes successfully
- ✅ Netlify deployment shows "Published"
- ✅ Health checks pass for all API endpoints
- ✅ Database contains 170+ programs
- ✅ Frontend loads with proper data
- ✅ Authentication works correctly

## 🔗 Useful Links

- [GitHub Repository](https://github.com/nebiyou1/Ethiopian-Community-Resources)
- [Netlify Dashboard](https://app.netlify.com/)
- [Supabase Dashboard](https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Need Help?** Check the troubleshooting section or review the workflow logs in GitHub Actions.
