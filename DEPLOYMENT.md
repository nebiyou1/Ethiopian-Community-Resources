# Ethiopia Community Resources - Deployment Guide

This guide will help you deploy your Ethiopia Community Resources application to Netlify with Supabase authentication.

## 🚀 Quick Setup

### 1. Environment Setup

```bash
# Copy environment template
npm run setup:env

# Edit .env file with your credentials
nano .env
```

### 2. Supabase Setup

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure Environment**:
   ```bash
   # Add to .env file
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key_here
   USE_SUPABASE=true
   ```

3. **Run Database Setup**:
   ```bash
   npm run setup:supabase
   ```

### 3. Google OAuth Setup

1. **Create Google OAuth App**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://your-app.netlify.app/auth/google/callback` (production)

2. **Configure Environment**:
   ```bash
   # Add to .env file
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   SESSION_SECRET=your_random_session_secret
   ```

### 4. Netlify Setup

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**:
   ```bash
   netlify login
   ```

3. **Initialize Project**:
   ```bash
   netlify init
   ```

4. **Configure Environment Variables**:
   ```bash
   # Set production environment variables
   netlify env:set SUPABASE_URL "https://your-project.supabase.co"
   netlify env:set SUPABASE_KEY "your_anon_key_here"
   netlify env:set GOOGLE_CLIENT_ID "your_google_client_id"
   netlify env:set GOOGLE_CLIENT_SECRET "your_google_client_secret"
   netlify env:set SESSION_SECRET "your_session_secret"
   netlify env:set USE_SUPABASE "true"
   netlify env:set NODE_ENV "production"
   ```

5. **Deploy**:
   ```bash
   # Deploy to preview
   npm run deploy:preview
   
   # Deploy to production
   npm run deploy:netlify
   ```

## 🔧 Manual Configuration

### Supabase Database Schema

The application uses the following main tables:

- **programs**: Main programs data
- **users**: User authentication and profiles
- **user_favorites**: User saved programs
- **user_applications**: User application tracking
- **categories**: Program categorization

### Authentication Flow

1. User clicks "Login with Google"
2. Redirected to Google OAuth
3. Google redirects back with authorization code
4. Server exchanges code for user info
5. User data stored/updated in Supabase
6. Session created for user

### API Endpoints

- `GET /api/programs` - List all programs
- `GET /api/programs/stats` - Program statistics
- `GET /api/programs/filters` - Available filters
- `GET /api/programs/search` - Search programs
- `GET /api/programs/:id` - Get specific program
- `GET /api/user` - Current user info
- `POST /api/user/favorites/:id` - Add favorite
- `DELETE /api/user/favorites/:id` - Remove favorite

## 🛠️ Development

### Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run with Supabase
USE_SUPABASE=true npm run dev
```

### Database Management

```bash
# Run migration
npm run migrate:supabase

# Reset and setup
npm run setup:supabase
```

## 📊 Monitoring

### Supabase Dashboard

- Monitor database performance
- View user authentication logs
- Check API usage and limits

### Netlify Dashboard

- Monitor deployment status
- View function logs
- Check environment variables

## 🔒 Security Considerations

1. **Environment Variables**: Never commit `.env` files
2. **CORS**: Configure proper origins for production
3. **Session Security**: Use secure cookies in production
4. **Rate Limiting**: Consider implementing rate limiting
5. **Data Validation**: Validate all user inputs

## 🚨 Troubleshooting

### Common Issues

1. **Supabase Connection Failed**:
   - Check SUPABASE_URL and SUPABASE_KEY
   - Verify project is active
   - Check network connectivity

2. **Google OAuth Failed**:
   - Verify client ID and secret
   - Check redirect URIs
   - Ensure Google+ API is enabled

3. **Netlify Deployment Failed**:
   - Check build logs
   - Verify environment variables
   - Check function timeout limits

### Debug Commands

```bash
# Test Supabase connection
node -e "require('./services/supabaseMigration').checkConnection()"

# Test Google OAuth config
node -e "console.log(process.env.GOOGLE_CLIENT_ID)"

# Check environment
node -e "console.log(process.env)"
```

## 📈 Performance Optimization

1. **Database Indexing**: Ensure proper indexes on frequently queried columns
2. **Caching**: Implement Redis caching for frequently accessed data
3. **CDN**: Use Netlify's CDN for static assets
4. **Image Optimization**: Optimize images and use WebP format

## 🔄 Updates and Maintenance

### Regular Tasks

1. **Database Backups**: Set up automated Supabase backups
2. **Security Updates**: Keep dependencies updated
3. **Monitoring**: Monitor error rates and performance
4. **User Feedback**: Collect and address user feedback

### Scaling Considerations

1. **Database**: Consider read replicas for high traffic
2. **Functions**: Monitor Netlify function usage limits
3. **CDN**: Use edge functions for global performance
4. **Caching**: Implement application-level caching

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review Supabase and Netlify documentation
3. Check application logs
4. Contact the development team

---

**Happy Deploying! 🚀**

