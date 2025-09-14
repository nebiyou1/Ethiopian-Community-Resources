import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { LogIn, User } from 'lucide-react'

const ProtectedRoute = ({ children, fallback = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        gap: '12px',
        color: '#666'
      }}>
        <div style={{
          width: '20px',
          height: '20px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        Loading...
      </div>
    )
  }

  if (!user) {
    return fallback || (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        borderRadius: '12px',
        margin: '20px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
        }}>
          <LogIn size={32} color="white" />
        </div>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '12px'
        }}>
          Sign In Required
        </h2>
        
        <p style={{
          fontSize: '16px',
          color: '#64748b',
          marginBottom: '24px',
          maxWidth: '400px',
          lineHeight: '1.5'
        }}>
          You need to be signed in to access this feature. Sign in to save your favorite programs and get personalized recommendations.
        </p>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#3b82f6',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '16px',
          fontWeight: '500'
        }}
        onClick={() => {
          // This will be handled by the parent component
          const signInButton = document.querySelector('[data-sign-in-button]')
          if (signInButton) {
            signInButton.click()
          }
        }}>
          <User size={20} />
          Sign In
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
