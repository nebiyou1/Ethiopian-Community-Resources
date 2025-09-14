# CI/CD Setup Guide - Ethiopian Community Resources

Complete guide to set up Continuous Integration and Continuous Deployment with Netlify, Supabase, and GitHub Actions.

## 🚀 Overview

This project uses:
- **GitHub Actions** for CI/CD pipeline
- **Netlify** for frontend deployment and serverless functions
- **Supabase** for database and authentication
- **Automated testing** and health checks
- **Environment-specific deployments**

## 📋 Prerequisites

1. **GitHub Repository** with admin access
2. **Netlify Account** (free tier works)
3. **Supabase Account** (free tier works)
4. **Google Cloud Console** account for OAuth

## 🔧 Step 1: Supabase Setup

### 1.1 Create Supabase Project
```bash
# Go to https://supabase.com
# Create new project: "ethiopian-community-resources"
# Note down:
# - Project URL: https://your-project.supabase.co
# - Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# - Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.2 Set up Database
```bash
# Install Supabase CLI
npm install -g @supabase/cli

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref

# Push database schema
supabase db push
```

### 1.3 Configure Authentication
1. Go to Supabase Dashboard → Authentication → Settings
2. Add your site URLs:
   - `http://localhost:3000` (development)
   - `https://your-app.netlify.app` (production)
3. Enable Google OAuth provider

## 🌐 Step 2: Google OAuth Setup

### 2.1 Create Google OAuth App
```bash
# Go to https://console.cloud.google.com
# Create new project or select existing
# Enable Google+ API
# Create OAuth 2.0 credentials
```

### 2.2 Configure Redirect URIs
Add these authorized redirect URIs:
- `http://localhost:3000/auth/google/callback`
- `https://your-app.netlify.app/auth/google/callback`
- `https://your-project.supabase.co/auth/v1/callback`

## 🚀 Step 3: Netlify Setup

### 3.1 Create Netlify Site
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Note down Site ID from netlify.toml or dashboard
```

### 3.2 Configure Build Settings
In Netlify Dashboard:
- **Build command**: `npm run netlify:build`
- **Publish directory**: `dist`
- **Functions directory**: `netlify/functions`

## 🔐 Step 4: Environment Variables

### 4.1 GitHub Secrets
Go to GitHub Repository → Settings → Secrets and Variables → Actions

Add these secrets:
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_ACCESS_TOKEN=your-access-token
SUPABASE_DB_PASSWORD=your-db-password

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Netlify
NETLIFY_AUTH_TOKEN=your-netlify-token
NETLIFY_SITE_ID=your-site-id
NETLIFY_URL=https://your-app.netlify.app

# Session
SESSION_SECRET=your-random-session-secret
```

### 4.2 Netlify Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables:
```bash
NODE_ENV=production
USE_SUPABASE=true
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=your-random-session-secret
```

## 🔄 Step 5: CI/CD Pipeline

### 5.1 GitHub Actions Workflow
The workflow (`.github/workflows/deploy.yml`) automatically:

1. **Test & Build** (on every push/PR)
   - Install dependencies
   - Run linting
   - Run tests
   - Build application

2. **Database Migration** (main branch only)
   - Install Supabase CLI
   - Run database migrations
   - Seed with community data

3. **Deploy to Netlify** (after successful build)
   - Deploy to preview (PRs)
   - Deploy to production (main branch)

4. **Health Checks** (production only)
   - Test API endpoints
   - Verify database connection
   - Check authentication flow

### 5.2 Deployment Environments

- **Production**: `main` branch → `https://your-app.netlify.app`
- **Preview**: Pull requests → `https://deploy-preview-123--your-app.netlify.app`
- **Branch Deploy**: Other branches → `https://branch-name--your-app.netlify.app`

## 🧪 Step 6: Testing

### 6.1 Local Testing
```bash
# Run all tests
npm test

# Test API endpoints
npm run test:integration

# Health check
npm run health-check

# Test with Supabase
USE_SUPABASE=true npm test
```

### 6.2 Automated Testing
Tests run automatically on:
- Every push to any branch
- Every pull request
- Before deployment

## 📊 Step 7: Monitoring

### 7.1 Deployment Status
- GitHub Actions tab shows build status
- Netlify dashboard shows deployment logs
- Supabase dashboard shows database metrics

### 7.2 Health Monitoring
```bash
# Manual health check
curl https://your-app.netlify.app/api/health

# Check all endpoints
npm run health-check
```

## 🚨 Step 8: Troubleshooting

### 8.1 Common Issues

**Build Failures:**
```bash
# Check GitHub Actions logs
# Verify all environment variables are set
# Test locally first: npm run build
```

**Database Connection Issues:**
```bash
# Verify Supabase URL and keys
# Check database migrations: supabase db push
# Test connection: npm run migrate:supabase
```

**Authentication Problems:**
```bash
# Verify Google OAuth credentials
# Check redirect URIs
# Ensure session secret is set
```

### 8.2 Debug Commands
```bash
# Test Supabase connection
node -e "require('./services/supabaseMigration').checkConnection()"

# Verify environment variables
node -e "console.log(process.env.SUPABASE_URL)"

# Test API locally
npm start
curl http://localhost:3000/api/health
```

## 🔄 Step 9: Deployment Process

### 9.1 Development Workflow
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes and test locally
npm run dev
npm test

# 3. Push branch (triggers preview deployment)
git push origin feature/new-feature

# 4. Create pull request (triggers preview build)
# 5. Review and merge to main (triggers production deployment)
```

### 9.2 Production Deployment
```bash
# Automatic deployment on main branch
git checkout main
git merge feature/new-feature
git push origin main

# Manual deployment (if needed)
npm run deploy:netlify
```

## 📈 Step 10: Performance Optimization

### 10.1 Build Optimization
- Static asset caching (configured in netlify.toml)
- Function bundling with esbuild
- Environment-specific builds

### 10.2 Database Optimization
- Proper indexing (configured in schema)
- Row Level Security (RLS) policies
- Connection pooling via Supabase

## 🎯 Success Checklist

- [ ] ✅ GitHub repository connected
- [ ] ✅ Supabase project created and configured
- [ ] ✅ Google OAuth app set up
- [ ] ✅ Netlify site connected
- [ ] ✅ All environment variables configured
- [ ] ✅ Database schema deployed
- [ ] ✅ CI/CD pipeline running
- [ ] ✅ Tests passing
- [ ] ✅ Health checks passing
- [ ] ✅ Authentication working
- [ ] ✅ API endpoints responding
- [ ] ✅ Frontend loading correctly

## 🚀 Next Steps

1. **Custom Domain** (optional)
   - Configure in Netlify dashboard
   - Update environment variables
   - Update OAuth redirect URIs

2. **Monitoring** (optional)
   - Set up error tracking (Sentry)
   - Configure uptime monitoring
   - Set up performance monitoring

3. **Advanced Features**
   - Email notifications
   - Slack integration
   - Advanced testing
   - Performance budgets

---

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review GitHub Actions logs
3. Check Netlify deployment logs
4. Verify Supabase dashboard for database issues

**🎉 Your Ethiopian Community Resources app is now fully automated with CI/CD! 🎉**

