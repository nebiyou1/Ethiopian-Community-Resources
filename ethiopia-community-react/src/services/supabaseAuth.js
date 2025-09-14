import { supabase } from '../lib/supabase'

class AuthService {
  constructor() {
    this.user = null
    this.session = null
    this.listeners = []
    
    // Initialize auth state
    this.init()
  }

  async init() {
    try {
      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        console.error('Error getting session:', error)
        return
      }
      
      this.session = session
      this.user = session?.user || null
      this.notifyListeners()
    } catch (error) {
      console.error('Auth initialization error:', error)
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.session = session
      this.user = session?.user || null
      this.notifyListeners()
    })
  }

  // Event listeners
  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.user, this.session)
      } catch (error) {
        console.error('Auth listener error:', error)
      }
    })
  }

  // Authentication methods
  async signUpWithEmail(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.fullName || '',
            preferred_name: userData.preferredName || '',
            grade_level: userData.gradeLevel || '',
            location: userData.location || '',
            interests: userData.interests || []
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        user: data.user,
        message: 'Please check your email to verify your account'
      }
    } catch (error) {
      return { success: false, error: 'Sign up failed. Please try again.' }
    }
  }

  async signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: 'Sign in failed. Please try again.' }
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (error) {
      return { success: false, error: 'Google sign in failed. Please try again.' }
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        return { success: false, error: error.message }
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Sign out failed. Please try again.' }
    }
  }

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { 
        success: true, 
        message: 'Password reset email sent. Please check your inbox.' 
      }
    } catch (error) {
      return { success: false, error: 'Password reset failed. Please try again.' }
    }
  }

  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Password updated successfully' }
    } catch (error) {
      return { success: false, error: 'Password update failed. Please try again.' }
    }
  }

  async updateProfile(updates) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, user: data.user }
    } catch (error) {
      return { success: false, error: 'Profile update failed. Please try again.' }
    }
  }

  // Utility methods
  isAuthenticated() {
    return !!this.user && !!this.session
  }

  getUser() {
    return this.user
  }

  getSession() {
    return this.session
  }

  getUserMetadata() {
    return this.user?.user_metadata || {}
  }

  // Favorites functionality
  async addToFavorites(programId) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Please sign in to save favorites' }
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: this.user.id,
          program_id: programId,
          created_at: new Date().toISOString()
        })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Added to favorites' }
    } catch (error) {
      return { success: false, error: 'Failed to add to favorites' }
    }
  }

  async removeFromFavorites(programId) {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Please sign in to manage favorites' }
    }

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', this.user.id)
        .eq('program_id', programId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, message: 'Removed from favorites' }
    } catch (error) {
      return { success: false, error: 'Failed to remove from favorites' }
    }
  }

  async getFavorites() {
    if (!this.isAuthenticated()) {
      return { success: false, error: 'Please sign in to view favorites' }
    }

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          program_id,
          created_at,
          programs (
            id,
            program_name,
            organization_name,
            location,
            cost_category,
            application_deadline
          )
        `)
        .eq('user_id', this.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true, favorites: data }
    } catch (error) {
      return { success: false, error: 'Failed to load favorites' }
    }
  }

  async isFavorite(programId) {
    if (!this.isAuthenticated()) {
      return false
    }

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('id')
        .eq('user_id', this.user.id)
        .eq('program_id', programId)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }
}

// Create singleton instance
const authService = new AuthService()

export default authService
