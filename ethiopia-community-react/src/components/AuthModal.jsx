import React, { useState } from 'react'
import { Chrome, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import authService from '../services/supabaseAuth'

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    preferredName: '',
    gradeLevel: '',
    location: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match'
      }

      if (!formData.fullName) {
        newErrors.fullName = 'Full name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setErrors({})
    setSuccessMessage('')

    try {
      let result
      if (isLogin) {
        result = await authService.signInWithEmail(formData.email, formData.password)
      } else {
        result = await authService.signUpWithEmail(
          formData.email, 
          formData.password,
          {
            fullName: formData.fullName,
            preferredName: formData.preferredName,
            gradeLevel: formData.gradeLevel,
            location: formData.location
          }
        )
      }

      if (result.success) {
        if (isLogin) {
          onAuthSuccess?.(result.user)
          onClose()
        } else {
          setSuccessMessage(result.message)
          // Reset form for login
          setIsLogin(true)
          setFormData({
            email: '',
            password: '',
            confirmPassword: '',
            fullName: '',
            preferredName: '',
            gradeLevel: '',
            location: ''
          })
        }
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleAuth = async () => {
    setIsLoading(true)
    setErrors({})

    try {
      const result = await authService.signInWithGoogle()
      if (!result.success) {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Google authentication failed. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email first' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const result = await authService.resetPassword(formData.email)
      if (result.success) {
        setSuccessMessage(result.message)
      } else {
        setErrors({ general: result.error })
      }
    } catch (error) {
      setErrors({ general: 'Failed to send reset email. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        width: '100%',
        maxWidth: '400px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: 0,
            color: '#1f2937'
          }}>
            {isLogin ? 'Sign In' : 'Create Account'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#6b7280',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #a7f3d0',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#065f46',
            fontSize: '14px'
          }}>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '16px',
            color: '#dc2626',
            fontSize: '14px'
          }}>
            {errors.general}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          onClick={handleGoogleAuth}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#374151',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          <Chrome size={20} />
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#e5e7eb'
          }} />
          <span style={{
            padding: '0 16px',
            color: '#6b7280',
            fontSize: '14px'
          }}>
            or
          </span>
          <div style={{
            flex: 1,
            height: '1px',
            backgroundColor: '#e5e7eb'
          }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth}>
          {/* Full Name (Signup only) */}
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}
                />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    border: `1px solid ${errors.fullName ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.fullName && (
                <p style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  margin: '4px 0 0 0'
                }}>
                  {errors.fullName}
                </p>
              )}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Email *
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  border: `1px solid ${errors.email ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            {errors.email && (
              <p style={{
                color: '#dc2626',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '4px'
            }}>
              Password *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6b7280'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px 44px 12px 44px',
                  border: `1px solid ${errors.password ? '#dc2626' : '#d1d5db'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p style={{
                color: '#dc2626',
                fontSize: '12px',
                margin: '4px 0 0 0'
              }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password (Signup only) */}
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '4px'
              }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={20}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }}
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 44px',
                    border: `1px solid ${errors.confirmPassword ? '#dc2626' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              {errors.confirmPassword && (
                <p style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  margin: '4px 0 0 0'
                }}>
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              marginBottom: '16px',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Forgot Password */}
        {isLogin && (
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isLoading}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                textDecoration: 'underline'
              }}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Toggle Login/Signup */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin)
              setErrors({})
              setSuccessMessage('')
              setFormData({
                email: '',
                password: '',
                confirmPassword: '',
                fullName: '',
                preferredName: '',
                gradeLevel: '',
                location: ''
              })
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal