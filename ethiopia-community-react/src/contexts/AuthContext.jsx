import React, { createContext, useContext, useEffect, useState } from 'react'
import supabaseAuth from '../services/supabaseAuthSimple'

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
  const [favorites, setFavorites] = useState(new Set())

  useEffect(() => {
    const { data: authListener } = supabaseAuth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null)
        setSession(session)
        setLoading(false)
      }
    )

    // Initial check
    supabaseAuth.getUser().then(currentUser => {
      setUser(currentUser)
      setLoading(false)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    return await supabaseAuth.signIn(email, password)
  }

  const signUp = async (email, password) => {
    return await supabaseAuth.signUp(email, password)
  }

  const signInWithGoogle = async () => {
    return await supabaseAuth.signInWithGoogle()
  }

  const signOut = async () => {
    return await supabaseAuth.signOut()
  }

  // Favorites management
  const toggleFavorite = (programId) => {
    if (!user) return false
    
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      if (newFavorites.has(programId)) {
        newFavorites.delete(programId)
      } else {
        newFavorites.add(programId)
      }
      return newFavorites
    })
    return true
  }

  const isFavorite = (programId) => {
    return favorites.has(programId)
  }

  const getFavorites = () => {
    return Array.from(favorites)
  }

  const removeFromFavorites = (programId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev)
      newFavorites.delete(programId)
      return newFavorites
    })
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
    favorites: Array.from(favorites),
    toggleFavorite,
    isFavorite,
    getFavorites,
    removeFromFavorites
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
