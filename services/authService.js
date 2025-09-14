const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { supabase } = require('../config/supabase');

// Configure Google OAuth Strategy
const configureGoogleAuth = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.NETLIFY_URL || 'http://localhost:3000'}/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      // Extract user information from Google profile
      const userData = {
        google_id: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        picture: profile.photos[0].value,
        provider: 'google',
        last_login: new Date().toISOString()
      };

      // Check if user exists in Supabase
      let user;
      if (process.env.USE_SUPABASE === 'true') {
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('email', userData.email)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          console.error('Error fetching user:', fetchError);
          return done(fetchError, null);
        }

        if (existingUser) {
          // Update last login
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ 
              last_login: userData.last_login,
              picture: userData.picture,
              name: userData.name
            })
            .eq('id', existingUser.id)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user:', updateError);
            return done(updateError, null);
          }

          user = updatedUser;
        } else {
          // Create new user
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              email: userData.email,
              name: userData.name,
              picture: userData.picture,
              provider: userData.provider,
              role: 'user',
              preferences: {},
              last_login: userData.last_login
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            return done(createError, null);
          }

          user = newUser;
        }
      } else {
        // Fallback for non-Supabase mode
        user = {
          id: profile.id,
          email: userData.email,
          name: userData.name,
          picture: userData.picture,
          provider: userData.provider
        };
      }

      return done(null, user);
    } catch (error) {
      console.error('OAuth callback error:', error);
      return done(error, null);
    }
  }));

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user);
  });
};

// Middleware to check authentication
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({
    success: false,
    error: 'Authentication required',
    message: 'Please log in to access this resource'
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({
    success: false,
    error: 'Admin access required',
    message: 'You do not have permission to access this resource'
  });
};

// Get current user info
const getCurrentUser = async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.json({
        success: true,
        authenticated: false,
        user: null
      });
    }

    let userData = req.user;
    
    // If using Supabase, get fresh user data
    if (process.env.USE_SUPABASE === 'true' && req.user.id) {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', req.user.id)
        .single();

      if (!error && user) {
        userData = user;
      }
    }

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        role: userData.role || 'user',
        preferences: userData.preferences || {},
        last_login: userData.last_login
      }
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user information',
      message: error.message
    });
  }
};

module.exports = {
  configureGoogleAuth,
  requireAuth,
  requireAdmin,
  getCurrentUser
};

