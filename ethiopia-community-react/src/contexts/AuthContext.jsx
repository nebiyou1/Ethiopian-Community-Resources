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

  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!user && !!session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
