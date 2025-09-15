import React, { useState, useEffect } from 'react'
import { Sun, User, LogOut, LogIn } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from './AuthModal'
import ClientAPIService from '../services/clientAPIService'

const Header = () => {
  const { user, signOut } = useAuth()
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  // Initialize API service
  const [apiService] = useState(() => new ClientAPIService())
  
  useEffect(() => {
    apiService.initialize()
  }, [apiService])
  
  // Fetch stats data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['programs-stats'],
    queryFn: async () => {
      console.log('Fetching stats with client-side API service')
      try {
        const statsData = await apiService.getStatistics()
        return { success: true, data: statsData }
      } catch (error) {
        console.error('Error fetching stats:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '8px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
      }}></div>
      
      <div className="header-container" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Title */}
        <div className="header-title" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: '1',
          minWidth: '300px'
        }}>
          <div style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}>
            {/* Ethiopian Flag - Green, Yellow, Red with Blue Circle and Star */}
            <div style={{
              width: '22px',
              height: '15px',
              background: 'linear-gradient(to bottom, #009639 0%, #009639 33%, #FFDE00 33%, #FFDE00 66%, #DA121A 66%, #DA121A 100%)',
              border: '1px solid #333',
              borderRadius: '2px',
              position: 'relative',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
            }}>
              {/* Blue Circle */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '8px',
                height: '8px',
                background: '#0F47AF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {/* Yellow Star */}
                <div style={{
                  width: '5px',
                  height: '5px',
                  background: '#FFDE00',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                }} />
              </div>
            </div>
            
            {/* Eritrean Flag - Green, Red, Blue triangle with olive branch */}
            <div style={{
              width: '22px',
              height: '15px',
              position: 'relative',
              border: '1px solid #333',
              borderRadius: '2px',
              overflow: 'hidden',
              filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
            }}>
              {/* Green top stripe */}
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '50%',
                background: '#12AD2B'
              }} />
              
              {/* Blue bottom stripe */}
              <div style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                height: '50%',
                background: '#1560BD'
              }} />
              
              {/* Red triangle */}
              <div style={{
                position: 'absolute',
                left: '0',
                top: '0',
                width: '0',
                height: '0',
                borderTop: '7.5px solid transparent',
                borderBottom: '7.5px solid transparent',
                borderLeft: '11px solid #E4002B'
              }} />
              
              {/* Olive branch symbol */}
              <div style={{
                position: 'absolute',
                left: '3px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '2px',
                background: '#FFDE00',
                borderRadius: '50%'
              }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              margin: 0,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
            }}>
              Summer Programs Database
            </h1>
            <div style={{
              fontSize: '11px',
              fontWeight: '400',
              margin: 0,
              textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
              opacity: 0.8,
              fontStyle: 'italic'
            }}>
              ለመለስተኛ ሁለተኛ ደረጃ እና ሁለተኛ ደረጃ ተማሪዎች የክረምት ፕሮግራም ዳታቤዝ
            </div>
          </div>
          <Sun size={24} style={{ 
            color: '#fbbf24',
            filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))'
          }} />
        </div>
        
        {/* Right: Compact Stats */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            opacity: 0.8
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTop: '2px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Loading...
          </div>
        ) : stats ? (
          <div className="header-stats" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '14px'
          }}>
            <div className="stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>
                {stats.totalPrograms || 0}
              </span>
              <span style={{ opacity: 0.9 }}>Programs</span>
            </div>
            
            <div className="stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                {stats.freePrograms || 0}
              </span>
              <span style={{ opacity: 0.9 }}>Free</span>
            </div>
            
            <div className="stat-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
                {stats.organizations || 0}
              </span>
              <span style={{ opacity: 0.9 }}>Orgs</span>
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: '14px',
            opacity: 0.8
          }}>
            Stats unavailable
          </div>
        )}
        
        {/* Authentication Section */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {user ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <User size={16} />
              <span style={{ fontSize: '14px', opacity: 0.9 }}>
                {user.email?.split('@')[0] || 'User'}
              </span>
              <button
                onClick={signOut}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.8
                }}
                title="Sign Out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '6px 12px',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)'
              }}
            >
              <LogIn size={16} />
              Sign In
            </button>
          )}
        </div>
      </div>
      
      {/* CSS for spinner animation and responsive design */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          .header-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          
          .header-title h1 {
            font-size: 18px !important;
          }
          
          .header-title {
            min-width: auto !important;
          }
          
          .header-stats {
            flex-wrap: wrap !important;
            gap: 8px !important;
          }
        }
        
        @media (max-width: 480px) {
          .header-title h1 {
            font-size: 16px !important;
          }
          
          .header-stats {
            gap: 6px !important;
          }
          
          .stat-pill {
            padding: 3px 6px !important;
            font-size: 11px !important;
          }
        }
        
        @media (max-width: 360px) {
          .header-title h1 {
            font-size: 14px !important;
          }
        }
      `}</style>
      
      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </div>
  )
}

export default Header