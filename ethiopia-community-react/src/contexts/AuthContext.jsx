import React, { createContext, useContext, useEffect, useState } from 'react'
import authService from '../services/supabaseAuth'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.addListener((user, session) => {
      setUser(user)
      setSession(session)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signIn = async (email, password) => {
    return await authService.signInWithEmail(email, password)
  }

  const signUp = async (email, password, userData) => {
    return await authService.signUpWithEmail(email, password, userData)
  }

  const signInWithGoogle = async () => {
    return await authService.signInWithGoogle()
  }

  const signOut = async () => {
    return await authService.signOut()
  }

  const resetPassword = async (email) => {
    return await authService.resetPassword(email)
  }

  const updateProfile = async (updates) => {
    return await authService.updateProfile(updates)
  }

  const addToFavorites = async (programId) => {
    return await authService.addToFavorites(programId)
  }

  const removeFromFavorites = async (programId) => {
    return await authService.removeFromFavorites(programId)
  }

  const getFavorites = async () => {
    return await authService.getFavorites()
  }

  const isFavorite = async (programId) => {
    return await authService.isFavorite(programId)
  }

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    addToFavorites,
    removeFromFavorites,
    getFavorites,
    isFavorite
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
