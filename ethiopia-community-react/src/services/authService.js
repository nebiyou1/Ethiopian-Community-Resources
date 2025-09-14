const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '/api'
  : '/api'

class AuthService {
  constructor() {
    this.user = this.getStoredUser()
    this.token = this.getStoredToken()
  }

  // Storage methods
  getStoredUser() {
    try {
      const user = localStorage.getItem('user')
      return user ? JSON.parse(user) : null
    } catch {
      return null
    }
  }

  getStoredToken() {
    return localStorage.getItem('token')
  }

  setStoredUser(user) {
    localStorage.setItem('user', JSON.stringify(user))
    this.user = user
  }

  setStoredToken(token) {
    localStorage.setItem('token', token)
    this.token = token
  }

  clearStorage() {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    this.user = null
    this.token = null
  }

  // Authentication methods
  async register(userData) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      const data = await response.json()

      if (response.ok) {
        this.setStoredUser(data.user)
        this.setStoredToken(data.token)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.message || 'Registration failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        this.setStoredUser(data.user)
        this.setStoredToken(data.token)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async googleAuth() {
    try {
      // Redirect to Google OAuth
      window.location.href = `${API_BASE_URL}/auth/google`
    } catch (error) {
      return { success: false, error: 'Google authentication failed' }
    }
  }

  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      this.clearStorage()
    }
  }

  async verifyEmail(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      return { success: false, message: 'Email verification failed' }
    }
  }

  async resendVerificationEmail() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      return { success: false, message: 'Failed to resend verification email' }
    }
  }

  async forgotPassword(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      return { success: false, message: 'Failed to send reset email' }
    }
  }

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      return { success: false, message: 'Password reset failed' }
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.user && !!this.token
  }

  isEmailVerified() {
    return this.user?.emailVerified || false
  }

  getUser() {
    return this.user
  }

  getToken() {
    return this.token
  }

  // API request helper with auth
  async authenticatedRequest(url, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  // User profile methods
  async updateProfile(profileData) {
    try {
      const response = await this.authenticatedRequest(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok) {
        this.setStoredUser(data.user)
        return { success: true, user: data.user }
      } else {
        return { success: false, error: data.message || 'Profile update failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }

  async changePassword(currentPassword, newPassword) {
    try {
      const response = await this.authenticatedRequest(`${API_BASE_URL}/user/change-password`, {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()
      return { success: response.ok, message: data.message }
    } catch (error) {
      return { success: false, message: 'Password change failed' }
    }
  }

  async deleteAccount() {
    try {
      const response = await this.authenticatedRequest(`${API_BASE_URL}/user/delete`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        this.clearStorage()
        return { success: true, message: data.message }
      } else {
        return { success: false, error: data.message || 'Account deletion failed' }
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' }
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService
