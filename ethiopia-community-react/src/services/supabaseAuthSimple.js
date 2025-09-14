import { supabase } from '../lib/supabase'

const supabaseAuth = {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    return { success: true, user: data.user }
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirect back to app root
      },
    })
    if (error) return { success: false, error: error.message }
    return { success: true } // Redirection happens, so no user data here
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) return { success: false, error: error.message }
    return { success: true }
  },

  async getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
  },
}

export default supabaseAuth
