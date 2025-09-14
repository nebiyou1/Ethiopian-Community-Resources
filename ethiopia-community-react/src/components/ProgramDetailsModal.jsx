import React, { useState, useEffect } from 'react'
import {
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogCloseTrigger,
  DialogBackdrop,
  DialogTitle,
} from '@chakra-ui/react'
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  GraduationCap, 
  Calendar,
  Users,
  Award,
  ExternalLink,
  Heart,
  Share2
} from 'lucide-react'

const ProgramDetailsModal = ({ isOpen, onClose, program }) => {
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    if (program) {
      // Check if program is already in favorites
      const existingFavorites = JSON.parse(localStorage.getItem('favoriteProgramsEthiopia') || '[]')
      const isAlreadyFavorite = existingFavorites.some(fav => fav.id === program.id)
      setIsFavorite(isAlreadyFavorite)
    }
  }, [program])

  if (!program) return null

  const handleToggleFavorites = () => {
    try {
      const existingFavorites = JSON.parse(localStorage.getItem('favoriteProgramsEthiopia') || '[]')
      
      if (isFavorite) {
        // Remove from favorites
        const updatedFavorites = existingFavorites.filter(fav => fav.id !== program.id)
        localStorage.setItem('favoriteProgramsEthiopia', JSON.stringify(updatedFavorites))
        setIsFavorite(false)
        
        console.log("Removed from favorites:", program.program_name)
      } else {
        // Add to favorites
        const updatedFavorites = [...existingFavorites, program]
        localStorage.setItem('favoriteProgramsEthiopia', JSON.stringify(updatedFavorites))
        setIsFavorite(true)
        
        console.log("Added to favorites:", program.program_name)
      }
      
      // Trigger storage event for other components to update
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'favoriteProgramsEthiopia',
        newValue: localStorage.getItem('favoriteProgramsEthiopia')
      }))
    } catch (error) {
      console.error('Error toggling favorite:', error)
      console.error("Error updating favorites:", error)
    }
  }

  const handleShare = async () => {
    const shareData = {
      title: program.program_name,
      text: `Check out this Ethiopian/Eritrean summer program: ${program.program_name} by ${program.organization?.name || 'Unknown Organization'}`,
      url: window.location.href,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        console.log("Shared successfully:", program.program_name)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.log('Error sharing:', err)
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        console.log("Link copied to clipboard:", program.program_name)
      } catch (err) {
        console.error('Error copying to clipboard:', err)
        console.error("Unable to copy to clipboard:", err)
      }
    }
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

  const formatPrestigeLevel = (level) => {
    const prestigeMap = {
      'elite': '🏆 Elite',
      'highly-selective': '⭐ Highly Selective',
      'selective': '📚 Selective',
      'accessible': '🌟 Accessible'
    }
    return prestigeMap[level] || level
  }

  // Function to check if deadline might be estimated (basic heuristic)
  const isEstimatedDeadline = (deadline) => {
    if (!deadline) return false
    // Check if deadline is exactly on the 1st or 15th (common for estimated dates)
    const date = new Date(deadline)
    const day = date.getDate()
    return day === 1 || day === 15
  }

  // Function to format deadline with asterisk if estimated
  const formatDeadline = (deadline) => {
    if (!deadline) return 'N/A'
    const formatted = new Date(deadline).toLocaleDateString()
    return isEstimatedDeadline(deadline) ? `${formatted}*` : formatted
  }

  // Function to get grade level range (expand single grade to typical range)
  const getGradeLevelRange = (gradeLevel) => {
    if (!gradeLevel) return 'N/A'
    const grade = parseInt(gradeLevel)
    
    // Most programs accept a range around the target grade
    switch (grade) {
      case 6:
        return 'Grades 6-7'
      case 7:
        return 'Grades 6-8'
      case 8:
        return 'Grades 7-9'
      case 9:
        return 'Grades 9-10'
      case 10:
        return 'Grades 9-11'
      case 11:
        return 'Grades 10-12'
      case 12:
        return 'Grades 11-12'
      default:
        return `Grade ${grade}`
    }
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        width: '100%',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '24px 32px',
          position: 'relative'
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}
          >
            ×
          </button>
          
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 12px 0',
            lineHeight: '1.2'
          }}>
            {program.program_name || 'Unknown Program'}
          </h2>
          
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{
              background: 'rgba(255, 255, 255, 0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {program.organization?.name || 'Unknown Organization'}
            </span>
            <span style={{
              background: program.cost_category === 'FREE' ? 'rgba(34, 197, 94, 0.2)' :
                         program.cost_category === 'PAID' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(251, 191, 36, 0.2)',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {formatCostCategory(program.cost_category)}
            </span>
          </div>
        </div>
        
        {/* Content */}
        <div style={{
          padding: '32px',
          overflowY: 'auto',
          flex: 1
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '32px'
          }}>
            
            {/* Quick Info Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <MapPin color="#3b82f6" size={24} style={{ marginBottom: '8px' }} />
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  marginBottom: '4px'
                }}>
                  Location
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {program.location || 
                   (program.organization ? 
                     [program.organization.city, program.organization.state, program.organization.country]
                       .filter(Boolean).join(', ') || 'Various' : 
                     'Various')}
                </div>
              </div>
              
              <div style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <Clock color="#22c55e" size={24} style={{ marginBottom: '8px' }} />
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#166534',
                  marginBottom: '4px'
                }}>
                  Duration
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {program.duration_weeks ? `${program.duration_weeks} weeks` : 'N/A'}
                </div>
              </div>
              
              <div style={{
                background: '#faf5ff',
                border: '1px solid #d8b4fe',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <GraduationCap color="#a855f7" size={24} style={{ marginBottom: '8px' }} />
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#7c3aed',
                  marginBottom: '4px'
                }}>
                  Grade Level
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {getGradeLevelRange(program.grade_level)}
                </div>
              </div>
              
              <div style={{
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <Award color="#f97316" size={24} style={{ marginBottom: '8px' }} />
                <div style={{
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#ea580c',
                  marginBottom: '4px'
                }}>
                  Prestige
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {formatPrestigeLevel(program.prestige_level) || 'N/A'}
                </div>
              </div>
            </div>

            <hr style={{
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              margin: 0
            }} />

            {/* Program Description */}
            {program.description && (
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 12px 0'
                }}>
                  📝 Program Description
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: '#374151',
                  lineHeight: '1.6',
                  margin: 0
                }}>
                  {program.description}
                </p>
              </div>
            )}

            {/* Program Details Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '32px'
            }}>
              
              {/* Left Column */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                
                {/* Organization Details */}
                {program.organization && (
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 12px 0'
                    }}>
                      🏢 Organization Details
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      paddingLeft: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '100px'
                        }}>
                          Name:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {program.organization.name}
                        </span>
                      </div>
                      {program.organization.city && (
                        <div style={{
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            minWidth: '100px'
                          }}>
                            Location:
                          </span>
                          <span style={{
                            fontSize: '14px',
                            color: '#1f2937'
                          }}>
                            {[program.organization.city, program.organization.state, program.organization.country]
                              .filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {program.organization.website && (
                        <div style={{
                          display: 'flex',
                          gap: '12px'
                        }}>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            minWidth: '100px'
                          }}>
                            Website:
                          </span>
                          <a 
                            href={program.organization.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '14px',
                              color: '#3b82f6',
                              textDecoration: 'none'
                            }}
                            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                          >
                            Visit Website <ExternalLink size={12} style={{ marginLeft: '4px' }} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Program Specifications */}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 12px 0'
                  }}>
                    📋 Program Specifications
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingLeft: '16px'
                  }}>
                    {program.subject_area && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Subject Area:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {program.subject_area}
                        </span>
                      </div>
                    )}
                    {program.program_type && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Program Type:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {program.program_type}
                        </span>
                      </div>
                    )}
                    {program.delivery_method && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Delivery:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {program.delivery_method}
                        </span>
                      </div>
                    )}
                    {program.housing_provided !== undefined && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Housing:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {program.housing_provided ? '🏠 Provided' : '❌ Not Provided'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                
                {/* Dates & Deadlines */}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 12px 0'
                  }}>
                    📅 Important Dates
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingLeft: '16px'
                  }}>
                    {program.application_deadline && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '140px'
                        }}>
                          App Deadline:
                        </span>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            color: '#dc2626',
                            fontWeight: '600'
                          }}>
                            {formatDeadline(program.application_deadline)}
                          </div>
                          {isEstimatedDeadline(program.application_deadline) && (
                            <div style={{
                              fontSize: '12px',
                              color: '#6b7280',
                              fontStyle: 'italic'
                            }}>
                              *Estimated deadline
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {program.program_start_date && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '140px'
                        }}>
                          Start Date:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {new Date(program.program_start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {program.program_end_date && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '140px'
                        }}>
                          End Date:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          {new Date(program.program_end_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cost Information */}
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: '0 0 12px 0'
                  }}>
                    💰 Cost Information
                  </h3>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    paddingLeft: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      gap: '12px'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#6b7280',
                        minWidth: '120px'
                      }}>
                        Category:
                      </span>
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
                    {program.cost_amount && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Amount:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#1f2937'
                        }}>
                          ${program.cost_amount}
                        </span>
                      </div>
                    )}
                    {program.financial_aid && (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#6b7280',
                          minWidth: '120px'
                        }}>
                          Financial Aid:
                        </span>
                        <span style={{
                          fontSize: '14px',
                          color: '#16a34a'
                        }}>
                          ✅ Available
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                {(program.prerequisites || program.application_requirements) && (
                  <div>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: '0 0 12px 0'
                    }}>
                      📝 Requirements
                    </h3>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      paddingLeft: '16px'
                    }}>
                      {program.prerequisites && (
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            marginBottom: '4px'
                          }}>
                            Prerequisites:
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#1f2937'
                          }}>
                            {program.prerequisites}
                          </div>
                        </div>
                      )}
                      {program.application_requirements && (
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#6b7280',
                            marginBottom: '4px'
                          }}>
                            Application Requirements:
                          </div>
                          <div style={{
                            fontSize: '14px',
                            color: '#1f2937'
                          }}>
                            {program.application_requirements}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr style={{
              border: 'none',
              borderTop: '1px solid #e5e7eb',
              margin: 0
            }} />

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              paddingTop: '16px',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleToggleFavorites}
                style={{
                  background: isFavorite ? '#dc2626' : 'transparent',
                  color: isFavorite ? 'white' : '#dc2626',
                  border: '2px solid #dc2626',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = isFavorite ? '#b91c1c' : '#fef2f2'
                  e.target.style.transform = 'scale(1.02)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = isFavorite ? '#dc2626' : 'transparent'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                <Heart size={20} />
                {isFavorite ? "❤️ Favorited" : "🤍 Add to Favorites"}
              </button>
              
              <button
                onClick={handleShare}
                style={{
                  background: 'transparent',
                  color: '#3b82f6',
                  border: '2px solid #3b82f6',
                  padding: '12px 24px',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#eff6ff'
                  e.target.style.transform = 'scale(1.02)'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent'
                  e.target.style.transform = 'scale(1)'
                }}
              >
                <Share2 size={20} />
                Share Program
              </button>
              
              {program.application_url && (
                <a
                  href={program.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#16a34a',
                    color: 'white',
                    border: '2px solid #16a34a',
                    padding: '12px 24px',
                    borderRadius: '25px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.background = '#15803d'
                    e.target.style.transform = 'scale(1.02)'
                  }}
                  onMouseOut={(e) => {
                    e.target.style.background = '#16a34a'
                    e.target.style.transform = 'scale(1)'
                  }}
                >
                  <ExternalLink size={20} />
                  Apply Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProgramDetailsModal
