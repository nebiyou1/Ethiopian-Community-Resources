const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { supabase } = require('../../config/supabase');

// Configure Google OAuth Strategy for Netlify Functions
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.URL || process.env.NETLIFY_URL}/auth/google/callback`
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
            community_affiliation: 'habesha', // Default for Ethiopian/Eritrean community
            languages_spoken: ['english'],
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

// Netlify function handler for authentication routes
exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body, queryStringParameters } = event;
  
  // Handle different auth routes
  if (path.includes('/auth/google') && !path.includes('/callback')) {
    // Initiate Google OAuth
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.URL || process.env.NETLIFY_URL)}/auth/google/callback&` +
      `response_type=code&` +
      `scope=profile email`;
    
    return {
      statusCode: 302,
      headers: {
        'Location': authUrl,
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  }
  
  if (path.includes('/auth/google/callback')) {
    // Handle OAuth callback
    const code = queryStringParameters?.code;
    
    if (!code) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'No authorization code provided'
        })
      };
    }
    
    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: `${process.env.URL || process.env.NETLIFY_URL}/auth/google/callback`
        })
      });
      
      const tokens = await tokenResponse.json();
      
      if (!tokens.access_token) {
        throw new Error('Failed to get access token');
      }
      
      // Get user profile
      const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      const profile = await profileResponse.json();
      
      // Create user session (simplified for serverless)
      const sessionToken = Buffer.from(JSON.stringify({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })).toString('base64');
      
      // Redirect to dashboard with session
      return {
        statusCode: 302,
        headers: {
          'Location': `${process.env.URL || process.env.NETLIFY_URL}/dashboard`,
          'Set-Cookie': `session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      
      return {
        statusCode: 302,
        headers: {
          'Location': `${process.env.URL || process.env.NETLIFY_URL}/?error=auth_failed`,
          'Cache-Control': 'no-cache'
        },
        body: ''
      };
    }
  }
  
  if (path.includes('/auth/logout')) {
    // Handle logout
    return {
      statusCode: 302,
      headers: {
        'Location': `${process.env.URL || process.env.NETLIFY_URL}/`,
        'Set-Cookie': 'session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
        'Cache-Control': 'no-cache'
      },
      body: ''
    };
  }
  
  // Default response for unhandled auth routes
  return {
    statusCode: 404,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: false,
      error: 'Auth route not found'
    })
  };
};

