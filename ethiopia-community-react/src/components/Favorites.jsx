import React, { useState, useEffect } from 'react'
import { Heart, Star, MapPin, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const Favorites = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  // Mock favorites data for now - in a real app, this would come from Supabase
  useEffect(() => {
    // Simulate loading favorites
    setTimeout(() => {
      setFavorites([
        {
          id: '1',
          program_name: 'MIT Summer Research Program',
          organization_name: 'Massachusetts Institute of Technology',
          location: 'Cambridge, MA',
          cost_category: 'FREE',
          application_deadline: '2024-03-15',
          prestige_level: 'elite',
          description: 'Research opportunity in computer science and engineering.',
          website: 'https://mit.edu'
        },
        {
          id: '2',
          program_name: 'Stanford Pre-Collegiate Studies',
          organization_name: 'Stanford University',
          location: 'Stanford, CA',
          cost_category: 'PAID',
          application_deadline: '2024-02-28',
          prestige_level: 'highly_selective',
          description: 'Academic enrichment program for high school students.',
          website: 'https://stanford.edu'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const removeFavorite = (programId) => {
    setFavorites(favorites.filter(fav => fav.id !== programId))
  }

  const getCostEmoji = (costCategory) => {
    const emojis = {
      'FREE': '🆓',
      'PAID': '💸',
      'LOW_COST': '💰',
      'FREE_PLUS_SCHOLARSHIP': '🎓',
      'FREE_PLUS_STIPEND': '💵'
    }
    return emojis[costCategory] || '💰'
  }

  const getPrestigeEmoji = (prestigeLevel) => {
    const emojis = {
      'elite': '🏆',
      'highly_selective': '⭐',
      'selective': '📚',
      'accessible': '🌟'
    }
    return emojis[prestigeLevel] || '🌟'
  }

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
        Loading your favorites...
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '2px solid #e5e7eb'
      }}>
        <Heart size={28} color="#ef4444" fill="#ef4444" />
        <h1 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: '#1e293b',
          margin: 0
        }}>
          My Favorites
        </h1>
        <span style={{
          background: '#ef4444',
          color: 'white',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '14px',
          fontWeight: '600'
        }}>
          {favorites.length}
        </span>
      </div>

      {favorites.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#64748b'
        }}>
          <Heart size={48} color="#e2e8f0" />
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            margin: '16px 0 8px 0',
            color: '#475569'
          }}>
            No favorites yet
          </h3>
          <p style={{
            fontSize: '16px',
            margin: '0 auto',
            maxWidth: '400px'
          }}>
            Start exploring programs and click the heart icon to save your favorites!
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))'
        }}>
          {favorites.map((program) => (
            <div key={program.id} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease',
              position: 'relative'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Remove from favorites button */}
              <button
                onClick={() => removeFavorite(program.id)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  color: '#ef4444',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#fef2f2'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'none'
                }}
                title="Remove from favorites"
              >
                <Heart size={20} fill="#ef4444" />
              </button>

              {/* Program header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontSize: '20px' }}>
                    {getPrestigeEmoji(program.prestige_level)}
                  </span>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#1e293b',
                    margin: 0,
                    flex: 1
                  }}>
                    {program.program_name}
                  </h3>
                </div>
                
                <p style={{
                  fontSize: '14px',
                  color: '#64748b',
                  margin: 0,
                  fontWeight: '500'
                }}>
                  {program.organization_name}
                </p>
              </div>

              {/* Program details */}
              <div style={{
                display: 'grid',
                gap: '8px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  <MapPin size={16} />
                  {program.location}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  <Calendar size={16} />
                  Deadline: {new Date(program.application_deadline).toLocaleDateString()}
                </div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  color: '#475569'
                }}>
                  <DollarSign size={16} />
                  {getCostEmoji(program.cost_category)} {program.cost_category.replace('_', ' ')}
                </div>
              </div>

              {/* Description */}
              <p style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '16px',
                lineHeight: '1.5'
              }}>
                {program.description}
              </p>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}>
                <a
                  href={program.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#3b82f6',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#2563eb'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#3b82f6'
                  }}
                >
                  <ExternalLink size={16} />
                  Visit Website
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Favorites
