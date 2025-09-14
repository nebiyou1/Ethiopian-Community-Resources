const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const nodemailer = require('nodemailer')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const db = require('../services/database')

const router = express.Router()

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

// Valid email domains
const validDomains = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
  'edu', 'school', 'university', 'college', 'academy', 'institute',
  'company', 'corp', 'inc', 'org', 'gov', 'mil',
  'et', 'ethiopia'
]

// Helper functions
const validateEmailDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase()
  return validDomains.some(validDomain => 
    domain === validDomain || domain.endsWith('.' + validDomain)
  )
}

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: '7d'
  })
}

const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-email?token=${token}`
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'your-email@gmail.com',
    to: email,
    subject: 'Verify Your Email - Ethiopian Community Resources',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Welcome to Ethiopian Community Resources!</h2>
        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">If you didn't create an account, please ignore this email.</p>
      </div>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    return true
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

// Google OAuth configuration
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
  callbackURL: `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let user = users.find(u => u.googleId === profile.id)
    
    if (!user) {
      // Check if email already exists
      const existingUser = users.find(u => u.email === profile.emails[0].value)
      
      if (existingUser) {
        // Link Google account to existing user
        existingUser.googleId = profile.id
        existingUser.emailVerified = true
        user = existingUser
      } else {
        // Create new user
        user = {
          id: uuidv4(),
          googleId: profile.id,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          emailVerified: true,
          role: 'user', // Default role
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        users.push(user)
      }
    }
    
    return done(null, user)
  } catch (error) {
    return done(error, null)
  }
}))

// Serialize/deserialize user for sessions
passport.serializeUser((user, done) => {
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  const user = users.find(u => u.id === id)
  done(null, user)
})

// Routes

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      })
    }

    if (!validateEmailDomain(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a major email provider or school/corporation email'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      })
    }

    // Check if user already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Generate verification token
    const verificationToken = uuidv4()

    // Create user in database
    const result = await db.query(`
      INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified, email_verification_token, email_verification_expires)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, email, first_name, last_name, role, email_verified
    `, [
      email.toLowerCase(),
      hashedPassword,
      firstName,
      lastName,
      'user',
      false,
      verificationToken,
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    ])

    const user = result.rows[0]

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationToken)
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      })
    }

    // Generate JWT token
    const token = generateToken(user.id)

    res.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      })
    }

    // Find user
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    const user = result.rows[0]

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Generate JWT token
    const token = generateToken(user.id)

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: user.email_verified,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Login failed'
    })
  }
})

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}))

router.get('/google/callback', passport.authenticate('google', {
  failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/login?error=google_auth_failed`
}), (req, res) => {
  // Generate JWT token
  const token = generateToken(req.user.id)
  
  // Redirect to frontend with token
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5174'}/auth-success?token=${token}`)
})

// Email verification
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      })
    }

    const tokenData = emailVerificationTokens.get(token)
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      })
    }

    if (new Date() > tokenData.expiresAt) {
      emailVerificationTokens.delete(token)
      return res.status(400).json({
        success: false,
        message: 'Verification token has expired'
      })
    }

    // Find and update user
    const user = users.find(u => u.id === tokenData.userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      })
    }

    user.emailVerified = true
    user.updatedAt = new Date().toISOString()

    // Clean up token
    emailVerificationTokens.delete(token)

    res.json({
      success: true,
      message: 'Email verified successfully'
    })

  } catch (error) {
    console.error('Email verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Email verification failed'
    })
  }
})

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const user = users.find(u => u.id === decoded.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      })
    }

    // Generate new verification token
    const verificationToken = uuidv4()
    emailVerificationTokens.set(verificationToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    })

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, verificationToken)
    
    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      })
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    })

  } catch (error) {
    console.error('Resend verification error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification email'
    })
  }
})

// Logout
router.post('/logout', (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    const user = users.find(u => u.email === email.toLowerCase())
    if (!user) {
      // Don't reveal if user exists or not
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent'
      })
    }

    // Generate reset token
    const resetToken = uuidv4()
    passwordResetTokens.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    })

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: user.email,
      subject: 'Reset Your Password - Ethiopian Community Resources',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Request</h2>
          <p>You requested a password reset. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0;">
          <p style="color: #666; font-size: 12px;">If you didn't request this password reset, please ignore this email.</p>
        </div>
      `
    }

    try {
      await transporter.sendMail(mailOptions)
    } catch (error) {
      console.error('Email sending error:', error)
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    })
  }
})

// Reset password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Token and password are required'
      })
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      })
    }

    const tokenData = passwordResetTokens.get(token)
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      })
    }

    if (new Date() > tokenData.expiresAt) {
      passwordResetTokens.delete(token)
      return res.status(400).json({
        success: false,
        message: 'Reset token has expired'
      })
    }

    // Find and update user
    const user = users.find(u => u.id === tokenData.userId)
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12)
    user.password = hashedPassword
    user.updatedAt = new Date().toISOString()

    // Clean up token
    passwordResetTokens.delete(token)

    res.json({
      success: true,
      message: 'Password reset successfully'
    })

  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({
      success: false,
      message: 'Password reset failed'
    })
  }
})

module.exports = router
