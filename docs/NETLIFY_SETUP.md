# Netlify Deployment Setup Guide

Complete guide for deploying the Ethiopia Community Resources application to Netlify with CI/CD integration.

## 🚀 Quick Setup Checklist

- [ ] Connect GitHub repository to Netlify
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Enable serverless functions
- [ ] Configure custom domain (optional)
- [ ] Test deployment

## 📋 Step 1: Connect Repository to Netlify

1. **Sign in to Netlify**: Go to [netlify.com](https://netlify.com) and sign in
2. **New Site**: Click "New site from Git"
3. **Choose Git Provider**: Select GitHub
4. **Select Repository**: Choose `nebiyou1/Ethiopian-Community-Resources`
5. **Configure Build Settings**:
   ```
   Build command: npm run netlify:build
   Publish directory: dist
   Functions directory: netlify/functions
   ```

## 🔧 Step 2: Configure Build Settings

### Basic Build Settings
```yaml
Build command: npm run netlify:build
Publish directory: dist
Functions directory: netlify/functions
```

### Advanced Build Settings
```yaml
Node version: 18
Package manager: npm
Build timeout: 15 minutes
```

### Build Environment Variables
```bash
NODE_VERSION=18
NODE_ENV=production
NPM_FLAGS=--production=false
```

## 🌍 Step 3: Environment Variables

In Netlify Dashboard → Site Settings → Environment Variables, add:

### 🔐 Required Variables
```bash
# Supabase Configuration
USE_SUPABASE=true
SUPABASE_URL=https://qvqybobnsaikaknsdqhw.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y
SUPABASE_SERVICE_ROLE_KEY=[Your service role key from Supabase Dashboard]

# Authentication
GOOGLE_CLIENT_ID=990930761220-82mlrn71hbqbbbe75c84u1dgpt450efs.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[Your Google OAuth client secret]
SESSION_SECRET=[Generate a random string]

# Build Configuration
NODE_ENV=production
```

### 🔑 How to Get Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw)
2. Navigate to Settings → API
3. Copy the `service_role` key (starts with `eyJ...`)
4. **Important**: Use the service role key, not the anon key

### 🔐 How to Generate Session Secret
```bash
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Online generator
# Visit: https://generate-secret.vercel.app/32
```

## ⚡ Step 4: Serverless Functions Configuration

Our application uses Netlify Functions for the API. The configuration is already set up in `netlify.toml`:

```toml
[build]
  command = "npm run netlify:build"
  functions = "netlify/functions"
  publish = "dist"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/auth/*"
  to = "/.netlify/functions/auth/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🔄 Step 5: Deploy and Test

### Manual Deployment
1. Push code to GitHub main branch
2. Netlify will automatically trigger a build
3. Monitor the build logs in Netlify dashboard
4. Check deployment status

### Test Deployment
After deployment, test these endpoints:

```bash
# Health check
curl https://your-site.netlify.app/api/health

# Programs API
curl https://your-site.netlify.app/api/programs

# Statistics API
curl https://your-site.netlify.app/api/programs/stats

# Frontend
open https://your-site.netlify.app
```

## 🌐 Step 6: Custom Domain (Optional)

### Using Netlify Domain
Your site will be available at: `https://[site-name].netlify.app`

### Using Custom Domain
1. Go to Site Settings → Domain management
2. Add custom domain
3. Configure DNS settings
4. Enable HTTPS (automatic with Netlify)

## 🔍 Troubleshooting

### Common Build Issues

#### 1. Build Command Not Found
```bash
Error: Command "npm run netlify:build" not found
```
**Solution**: Ensure the script exists in `package.json`

#### 2. Environment Variables Not Set
```bash
Error: SUPABASE_URL is not defined
```
**Solution**: Check environment variables in Netlify dashboard

#### 3. Function Deployment Issues
```bash
Error: Function "api" failed to deploy
```
**Solution**: Check function syntax and dependencies

#### 4. Database Connection Issues
```bash
Error: connect ECONNREFUSED
```
**Solution**: Verify Supabase credentials and service role key

### Debug Commands

```bash
# Check build logs
netlify logs

# Test functions locally
netlify dev

# Deploy preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

## 📊 Monitoring and Analytics

### Build Monitoring
- **Build History**: Check in Netlify dashboard
- **Build Logs**: Review for errors and warnings
- **Build Time**: Monitor performance

### Application Monitoring
- **Uptime**: Use Netlify Analytics
- **Performance**: Monitor Core Web Vitals
- **Errors**: Check function logs

### Database Monitoring
- **Supabase Dashboard**: Monitor database health
- **API Performance**: Check response times
- **Connection Pool**: Monitor active connections

## 🚀 Performance Optimization

### Build Optimization
```json
{
  "build": {
    "environment": {
      "NODE_OPTIONS": "--max_old_space_size=4096"
    }
  }
}
```

### Function Optimization
- Use connection pooling for database
- Implement caching strategies
- Optimize bundle size

### Frontend Optimization
- Enable Netlify's asset optimization
- Use Netlify's CDN
- Implement service worker caching

## 🔐 Security Best Practices

### Environment Variables
- Never commit secrets to Git
- Use different keys for development/production
- Rotate keys regularly

### Function Security
- Validate all inputs
- Use CORS appropriately
- Implement rate limiting

### Database Security
- Use Row Level Security (RLS)
- Limit service role key permissions
- Monitor database access

## 📈 Scaling Considerations

### Traffic Growth
- Monitor function invocations
- Consider upgrading Netlify plan
- Implement caching strategies

### Database Scaling
- Monitor Supabase usage
- Optimize queries
- Consider read replicas

## 🎯 Success Metrics

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ All environment variables are set
- ✅ API endpoints respond correctly
- ✅ Frontend loads with data
- ✅ Authentication works
- ✅ Database connection is stable

## 🔗 Useful Resources

- [Netlify Documentation](https://docs.netlify.com/)
- [Netlify Functions Guide](https://docs.netlify.com/functions/overview/)
- [Supabase Documentation](https://supabase.com/docs)
- [GitHub Actions Integration](https://docs.netlify.com/configure-builds/get-started/#github-integration)

---

**Need Help?** Check the troubleshooting section or contact support through the Netlify dashboard.
