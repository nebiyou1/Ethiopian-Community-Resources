import React, { useState, useEffect } from 'react'
import { 
  Heart, 
  MapPin, 
  Clock, 
  GraduationCap,
  Trash2,
  ChevronDown,
  ChevronUp,
  Star
} from 'lucide-react'

const FavoritesPanel = ({ onViewProgram }) => {
  const [favorites, setFavorites] = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Load favorites from localStorage on component mount
    const loadFavorites = () => {
      try {
        const savedFavorites = JSON.parse(localStorage.getItem('favoriteProgramsEthiopia') || '[]')
        setFavorites(savedFavorites)
      } catch (error) {
        console.error('Error loading favorites:', error)
        setFavorites([])
      }
    }

    loadFavorites()

    // Listen for storage changes (in case favorites are updated in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'favoriteProgramsEthiopia') {
        loadFavorites()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const removeFavorite = (programId) => {
    try {
      const updatedFavorites = favorites.filter(program => program.id !== programId)
      setFavorites(updatedFavorites)
      localStorage.setItem('favoriteProgramsEthiopia', JSON.stringify(updatedFavorites))
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const clearAllFavorites = () => {
    setFavorites([])
    localStorage.removeItem('favoriteProgramsEthiopia')
  }

  const formatCostCategory = (category) => {
    const categoryMap = {
      'FREE': '🆓 Free',
      'FREE_PLUS_STIPEND': '💰 Free + Stipend',
      'FREE_PLUS_SCHOLARSHIP': '🎓 Free + Scholarship',
      'LOW_COST': '💵 Low Cost',
      'PAID': '💸 Paid'
    }
    return categoryMap[category] || category
  }

  const getGradeLevelRange = (gradeLevel) => {
    if (!gradeLevel) return 'N/A'
    const grade = parseInt(gradeLevel)
    switch (grade) {
      case 6: return 'Grades 6-7'
      case 7: return 'Grades 6-8'
      case 8: return 'Grades 7-9'
      case 9: return 'Grades 9-10'
      case 10: return 'Grades 9-11'
      case 11: return 'Grades 10-12'
      case 12: return 'Grades 11-12'
      default: return `Grade ${grade}`
    }
  }

  return (
    <div style={{
      background: '#fef2f2',
      border: '2px solid #fecaca',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Heart color="#e53e3e" size={24} />
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#b91c1c',
              margin: 0
            }}>
              My Favorites
            </h2>
            <span style={{
              background: '#dc2626',
              color: 'white',
              borderRadius: '9999px',
              padding: '4px 12px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}>
              {favorites.length}
            </span>
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px'
          }}>
            {favorites.length > 0 && (
              <button
                onClick={clearAllFavorites}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#dc2626',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '14px'
                }}
                onMouseOver={(e) => e.target.style.background = '#fef2f2'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                <Trash2 size={16} />
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#374151',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '14px'
              }}
              onMouseOver={(e) => e.target.style.background = '#f9fafb'}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {isOpen ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <hr style={{
          border: 'none',
          borderTop: '1px solid #fca5a5',
          margin: 0
        }} />

        {/* Favorites List */}
        {isOpen && (
          <div>
            {favorites.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '32px 0'
              }}>
                <Star color="#9ca3af" size={48} style={{ marginBottom: '16px' }} />
                <p style={{
                  fontSize: '18px',
                  color: '#6b7280',
                  fontWeight: '500',
                  margin: '0 0 8px 0'
                }}>
                  No favorites yet
                </p>
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: 0
                }}>
                  Click the ❤️ button on programs you're interested in
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#dc2626',
                  fontWeight: '500',
                  margin: 0
                }}>
                  {favorites.length} program{favorites.length !== 1 ? 's' : ''} saved
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {favorites.map((program, index) => (
                    <div 
                      key={program.id || index}
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '16px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}>
                        
                        {/* Program Name */}
                        <h3 style={{
                          fontSize: '16px',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          margin: 0,
                          lineHeight: '1.4',
                          minHeight: '48px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {program.program_name || 'Unknown Program'}
                        </h3>
                        
                        {/* Organization */}
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          margin: 0,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {program.organization?.name || 'Unknown Organization'}
                        </p>
                        
                        {/* Quick Info */}
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <MapPin color="#6b7280" size={12} />
                              <span style={{ color: '#6b7280' }}>
                                {program.location || 
                                 (program.organization ? 
                                   [program.organization.city, program.organization.state]
                                     .filter(Boolean).join(', ') || 'Various' : 
                                   'Various')}
                              </span>
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '12px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <Clock color="#6b7280" size={12} />
                              <span style={{ color: '#6b7280' }}>
                                {program.duration_weeks ? `${program.duration_weeks}w` : 'N/A'}
                              </span>
                            </div>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <GraduationCap color="#6b7280" size={12} />
                              <span style={{ color: '#6b7280' }}>
                                {getGradeLevelRange(program.grade_level)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Cost Badge */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            background: program.cost_category === 'FREE' ? '#dcfce7' : 
                                       program.cost_category === 'PAID' ? '#fef2f2' : '#fef3c7',
                            color: program.cost_category === 'FREE' ? '#166534' : 
                                   program.cost_category === 'PAID' ? '#dc2626' : '#d97706',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {formatCostCategory(program.cost_category)}
                          </span>
                        </div>
                        
                        {/* Action Buttons */}
                        <div style={{
                          display: 'flex',
                          gap: '8px',
                          paddingTop: '8px'
                        }}>
                          <button
                            onClick={() => onViewProgram(program)}
                            style={{
                              flex: 1,
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '500'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#2563eb'}
                            onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                          >
                            👁️ View
                          </button>
                          <button
                            onClick={() => removeFavorite(program.id)}
                            style={{
                              background: 'transparent',
                              color: '#dc2626',
                              border: '1px solid #dc2626',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '14px'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = '#dc2626'
                              e.target.style.color = 'white'
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = 'transparent'
                              e.target.style.color = '#dc2626'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FavoritesPanel