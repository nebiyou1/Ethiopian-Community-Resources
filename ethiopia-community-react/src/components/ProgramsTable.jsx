import React, { useState, useMemo, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  SortAsc, 
  SortDesc,
  MapPin,
  Clock,
  GraduationCap,
  DollarSign,
  Calendar,
  Users,
  Award,
  User,
  LogIn
} from 'lucide-react'
import ProgramDetailsModal from './ProgramDetailsModal'
import FavoritesPanel from './FavoritesPanel'
import ExportButton from './ExportButton'
import AuthModal from './AuthModal'
import authService from '../services/authService'

const ProgramsTable = () => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [viewMode, setViewMode] = useState('table')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true)
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    costCategory: '',
    location: '',
    prestige: '',
    gradeLevel: '',
  })
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState('asc')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20) // More reasonable default
  const [density, setDensity] = useState('comfortable') // compact, comfortable, spacious
  const [selectedRows, setSelectedRows] = useState(new Set())

  // Fetch programs data with filters
  const { data: programs = [], isLoading, error } = useQuery({
    queryKey: ['programs', globalFilter, filters],
    queryFn: async () => {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api/programs/search'
        : '/api/programs/search'
      
      // Build query parameters
      const params = new URLSearchParams()
      if (globalFilter) params.append('search', globalFilter)
      if (filters.costCategory) params.append('costCategory', filters.costCategory)
      if (filters.prestige) params.append('prestige', filters.prestige)
      if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel)
      if (filters.location) params.append('location', filters.location)
      
      const url = `${apiUrl}?${params.toString()}`
      console.log('Fetching programs from:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Received programs:', data.programs?.length || 0)
      return data.programs || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Helper functions
  const formatCostCategory = (category) => {
    const categoryMap = {
      'FREE': '🆓 Free',
      'FREE_PLUS_STIPEND': '💰 Free + Stipend',
      'FREE_PLUS_SCHOLARSHIP': '🎓 Free + Scholarship',
      'FREE_TO_LOW': '🆓➡️💵 Free to Low',
      'LOW_COST': '💵 Low Cost',
      'PAID': '💸 Paid'
    }
    return categoryMap[category] || category
  }

  const formatTuitionAmount = (program) => {
    if (program.cost_category === 'FREE') {
      return 'Free'
    }
    
    if (program.financial_aid) {
      // Extract specific amounts from financial aid text
      const aidText = program.financial_aid.toLowerCase()
      
      if (aidText.includes('stipend')) {
        const stipendMatch = program.financial_aid.match(/\$[\d,]+/)
        return stipendMatch ? `Free + ${stipendMatch[0]} stipend` : 'Free + Stipend'
      }
      
      if (aidText.includes('scholarship')) {
        const scholarshipMatch = program.financial_aid.match(/\$[\d,]+/)
        return scholarshipMatch ? `Free + ${scholarshipMatch[0]} scholarship` : 'Free + Scholarship'
      }
      
      if (aidText.includes('fully funded')) {
        return 'Fully Funded'
      }
      
      return program.financial_aid
    }
    
    // For paid programs, try to extract cost information
    if (program.cost_category === 'PAID' || program.cost_category === 'LOW_COST') {
      return 'See website for current pricing'
    }
    
    return 'Contact program for details'
  }

  const getAccuracyDisclaimer = (program) => {
    const needsDisclaimer = program.cost_category === 'PAID' || 
                           program.cost_category === 'LOW_COST' ||
                           !program.financial_aid ||
                           program.financial_aid.toLowerCase().includes('see') ||
                           program.financial_aid.toLowerCase().includes('contact')
    
    return needsDisclaimer
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

  const getGradeLevelRange = (gradeLevel) => {
    if (!gradeLevel) return 'Refer to website'
    
    const gradeStr = gradeLevel.toString().trim()
    
    // Handle different formats
    if (gradeStr.match(/^\d+$/)) {
      // Single grade like "10"
      const grade = parseInt(gradeStr)
      if (grade >= 6 && grade <= 12) {
        return `Grades ${Math.max(6, grade - 1)}-${Math.min(12, grade + 1)}`
      }
    } else if (gradeStr.match(/^\d+-\d+$/)) {
      // Range like "9-11"
      const [min, max] = gradeStr.split('-').map(n => parseInt(n.trim()))
      if (min >= 6 && max <= 12 && min <= max) {
        return `Grades ${min}-${max}`
      }
    } else if (gradeStr.toLowerCase().includes('high school')) {
      return 'Grades 9-12'
    } else if (gradeStr.toLowerCase().includes('middle school')) {
      return 'Grades 6-8'
    }
    
    return gradeStr || 'Refer to website'
  }

  const isEstimatedDeadline = (deadline) => {
    if (!deadline) return false
    const date = new Date(deadline)
    const day = date.getDate()
    return day === 1 || day === 15
  }

  const formatDeadline = (deadline) => {
    // Handle null, undefined, empty string, or common placeholder values
    if (!deadline || 
        deadline === 'N/A' || 
        deadline === 'TBD' || 
        deadline === '' || 
        deadline === 'null' ||
        deadline === 'undefined' ||
        deadline.toString().toLowerCase().includes('invalid') ||
        deadline.toString().toLowerCase().includes('refer')) {
      return 'Refer to website'
    }
    
    // Try to parse the date
    const date = new Date(deadline)
    
    // Check if the date is valid
    if (isNaN(date.getTime()) || date.getFullYear() < 1900 || date.getFullYear() > 2030) {
      return 'Refer to website'
    }
    
    // Format the valid date
    try {
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      
      // Add asterisk for estimated deadlines
      return isEstimatedDeadline(deadline) ? `${formatted}*` : formatted
    } catch (error) {
      return 'Refer to website'
    }
  }

  // Filter and sort programs (backend handles filtering, we only do sorting)
  const filteredPrograms = useMemo(() => {
    if (!programs || programs.length === 0) {
      return []
    }
    
    let filtered = [...programs] // Backend already filtered the data

    // Sort programs
    if (filtered.length > 0) {
      filtered.sort((a, b) => {
        let aValue, bValue

        switch (sortBy) {
          case 'name':
            aValue = a.program_name || ''
            bValue = b.program_name || ''
            break
          case 'organization':
            aValue = a.organization?.name || ''
            bValue = b.organization?.name || ''
            break
          case 'cost':
            aValue = a.cost_amount || 0
            bValue = b.cost_amount || 0
            break
          case 'duration':
            aValue = a.duration_weeks || 0
            bValue = b.duration_weeks || 0
            break
          case 'location':
            aValue = a.location || a.organization?.city || ''
            bValue = b.location || b.organization?.city || ''
            break
          case 'deadline':
            aValue = new Date(a.application_deadline || '9999-12-31')
            bValue = new Date(b.application_deadline || '9999-12-31')
            break
          default:
            aValue = a.program_name || ''
            bValue = b.program_name || ''
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortOrder === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }, [programs, globalFilter, filters, sortBy, sortOrder])

  // Pagination calculations
  const totalItems = filteredPrograms.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedPrograms = filteredPrograms.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [globalFilter, filters, sortBy, sortOrder])

  const handleViewProgram = (program) => {
    setSelectedProgram(program)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedProgram(null)
  }

  const clearAllFilters = () => {
    setGlobalFilter('')
    setFilters({
      costCategory: '',
      location: '',
      prestige: '',
      gradeLevel: '',
    })
    setSortBy('name')
    setSortOrder('asc')
    setCurrentPage(1)
    setSelectedRows(new Set())
  }

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedRows.size === paginatedPrograms.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(paginatedPrograms.map(p => p.id)))
    }
  }

  const handleSelectRow = (programId) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(programId)) {
      newSelected.delete(programId)
    } else {
      newSelected.add(programId)
    }
    setSelectedRows(newSelected)
  }

  const handleBulkExport = () => {
    const selectedPrograms = paginatedPrograms.filter(p => selectedRows.has(p.id))
    // This will be handled by ExportButton component
    return selectedPrograms
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          Loading programs...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: '#e74c3c',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '20px' }}>Error Loading Programs</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '16px' }}>{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px'
    }}>
      {/* Header */}

      {/* Search and Filters */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        {/* Search Bar */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            position: 'relative',
            flex: 1
          }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}
            />
            <input
              type="text"
              placeholder="Search programs, organizations, locations..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 44px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            style={{
              background: showAdvancedFilters ? '#667eea' : 'white',
              color: showAdvancedFilters ? 'white' : '#667eea',
              border: '2px solid #667eea',
              padding: '12px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            <Filter size={20} />
            Filters
          </button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div style={{
            borderTop: '1px solid #e2e8f0',
            paddingTop: '20px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              {/* Cost Category Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Cost Category
                </label>
                <select
                  value={filters.costCategory}
                  onChange={(e) => setFilters(prev => ({ ...prev, costCategory: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Costs</option>
                  <option value="FREE">Free</option>
                  <option value="FREE_PLUS_STIPEND">Free + Stipend</option>
                  <option value="FREE_PLUS_SCHOLARSHIP">Free + Scholarship</option>
                  <option value="LOW_COST">Low Cost</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Location
                </label>
                <input
                  type="text"
                  placeholder="City, State..."
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Prestige Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Prestige Level
                </label>
                <select
                  value={filters.prestige}
                  onChange={(e) => setFilters(prev => ({ ...prev, prestige: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Levels</option>
                  <option value="elite">Elite</option>
                  <option value="highly-selective">Highly Selective</option>
                  <option value="selective">Selective</option>
                  <option value="accessible">Accessible</option>
                </select>
              </div>

              {/* Grade Level Filter */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '6px'
                }}>
                  Grade Level
                </label>
                <select
                  value={filters.gradeLevel}
                  onChange={(e) => setFilters(prev => ({ ...prev, gradeLevel: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                    background: 'white'
                  }}
                >
                  <option value="">All Grades</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                </select>
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'transparent',
                  color: '#666',
                  border: '1px solid #d1d5db',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Mode, Density, and Sorting */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left Controls */}
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* View Mode Toggle */}
          <div style={{
            display: 'flex',
            background: '#f7fafc',
            borderRadius: '8px',
            padding: '4px'
          }}>
            <button
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? '#667eea' : 'transparent',
                color: viewMode === 'table' ? 'white' : '#666',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <List size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? '#667eea' : 'transparent',
                color: viewMode === 'grid' ? 'white' : '#666',
                border: 'none',
                padding: '8px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <Grid size={16} />
              Grid
            </button>
          </div>

          {/* Density Controls */}
          <div style={{
            display: 'flex',
            background: '#f7fafc',
            borderRadius: '8px',
            padding: '4px'
          }}>
            {[
              { key: 'compact', label: 'Compact', icon: '≡' },
              { key: 'comfortable', label: 'Comfortable', icon: '☰' },
              { key: 'spacious', label: 'Spacious', icon: '☷' }
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setDensity(key)}
                style={{
                  background: density === key ? '#667eea' : 'transparent',
                  color: density === key ? 'white' : '#666',
                  border: 'none',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Page Size Selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}>
            <span style={{ color: '#666' }}>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value))
                setCurrentPage(1)
              }}
              style={{
                padding: '6px 8px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
            <span style={{ color: '#666' }}>per page</span>
          </div>
        </div>

        {/* Sorting Options */}
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {[
            { key: 'name', label: 'Name' },
            { key: 'organization', label: 'Organization' },
            { key: 'cost', label: 'Cost' },
            { key: 'duration', label: 'Duration' },
            { key: 'location', label: 'Location' },
            { key: 'deadline', label: 'Deadline' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleSort(key)}
              style={{
                background: sortBy === key ? '#667eea' : 'white',
                color: sortBy === key ? 'white' : '#666',
                border: '1px solid #d1d5db',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {label}
              {sortBy === key && (
                sortOrder === 'asc' ? <SortAsc size={12} /> : <SortDesc size={12} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Favorites Panel */}
      <FavoritesPanel onViewProgram={handleViewProgram} />

      {/* Export Button */}
      <div style={{ marginBottom: '20px' }}>
        <ExportButton 
          programs={selectedRows.size > 0 ? paginatedPrograms.filter(p => selectedRows.has(p.id)) : filteredPrograms}
          selectedCount={selectedRows.size}
        />
      </div>

      {/* Programs Display */}
      {viewMode === 'table' ? (
        /* Table View */
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            overflowX: 'auto'
          }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse'
            }}>
              <thead style={{
                background: '#f8fafc',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <tr>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px',
                    width: '40px'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedPrograms.length && paginatedPrograms.length > 0}
                      onChange={handleSelectAll}
                      style={{
                        transform: 'scale(1.1)',
                        cursor: 'pointer'
                      }}
                    />
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Program
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Organization
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Location
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Duration
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Grade Level
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Cost
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Tuition
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'left',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Deadline
                  </th>
                  <th style={{
                    padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#374151',
                    fontSize: density === 'compact' ? '12px' : '14px'
                  }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedPrograms.map((program, index) => (
                  <tr 
                    key={program.id || index}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      transition: 'background-color 0.2s',
                      backgroundColor: selectedRows.has(program.id) ? '#eff6ff' : 'transparent'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = selectedRows.has(program.id) ? '#dbeafe' : '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = selectedRows.has(program.id) ? '#eff6ff' : 'transparent'}
                  >
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      textAlign: 'center'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(program.id)}
                        onChange={() => handleSelectRow(program.id)}
                        style={{
                          transform: 'scale(1.1)',
                          cursor: 'pointer'
                        }}
                      />
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px'
                    }}>
                      <div>
                        <div style={{
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '4px'
                        }}>
                          {program.program_name || 'Unknown Program'}
                        </div>
                        {program.subject_area && (
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280'
                          }}>
                            {program.subject_area}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      {program.organization?.name || 'Unknown Organization'}
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      {program.location || 
                       (program.organization ? 
                         [program.organization.city, program.organization.state]
                           .filter(Boolean).join(', ') || 'Various' : 
                         'Various')}
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      {program.duration_weeks ? `${program.duration_weeks}w` : 'N/A'}
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      {getGradeLevelRange(program.grade_level)}
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px'
                    }}>
                      <span style={{
                        background: program.cost_category === 'FREE' ? '#dcfce7' : 
                                   program.cost_category === 'PAID' ? '#fef2f2' : '#fef3c7',
                        color: program.cost_category === 'FREE' ? '#166534' : 
                               program.cost_category === 'PAID' ? '#dc2626' : '#d97706',
                        padding: density === 'compact' ? '2px 6px' : '4px 8px',
                        borderRadius: '6px',
                        fontSize: density === 'compact' ? '10px' : '12px',
                        fontWeight: '500'
                      }}>
                        {formatCostCategory(program.cost_category)}
                      </span>
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: '500' }}>
                          {formatTuitionAmount(program)}
                        </span>
                        {getAccuracyDisclaimer(program) && (
                          <span style={{ 
                            fontSize: density === 'compact' ? '9px' : '10px', 
                            color: '#6b7280',
                            fontStyle: 'italic'
                          }}>
                            *Refer to website for current pricing
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      fontSize: density === 'compact' ? '12px' : '14px',
                      color: '#374151'
                    }}>
                      {formatDeadline(program.application_deadline)}
                    </td>
                    <td style={{
                      padding: density === 'compact' ? '8px' : density === 'spacious' ? '20px' : '16px',
                      textAlign: 'center'
                    }}>
                      <button
                        onClick={() => handleViewProgram(program)}
                        style={{
                          background: '#667eea',
                          color: 'white',
                          border: 'none',
                          padding: density === 'compact' ? '4px 8px' : density === 'spacious' ? '12px 20px' : '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: density === 'compact' ? '12px' : '14px',
                          fontWeight: '500'
                        }}
                      >
                        {density === 'compact' ? 'View' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  First
                </button>
                
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Previous
                </button>
                
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          background: currentPage === pageNum ? '#667eea' : 'white',
                          color: currentPage === pageNum ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: currentPage === pageNum ? '600' : '400'
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Next
                </button>
                
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {paginatedPrograms.map((program, index) => (
            <div 
              key={program.id || index}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => handleViewProgram(program)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div style={{
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  margin: '0 0 8px 0',
                  lineHeight: '1.4'
                }}>
                  {program.program_name || 'Unknown Program'}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '0 0 12px 0'
                }}>
                  {program.organization?.name || 'Unknown Organization'}
                </p>
                {program.subject_area && (
                  <p style={{
                    fontSize: '12px',
                    color: '#9ca3af',
                    margin: '0 0 12px 0'
                  }}>
                    {program.subject_area}
                  </p>
                )}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <MapPin size={14} />
                  <span>
                    {program.location || 
                     (program.organization ? 
                       [program.organization.city, program.organization.state]
                         .filter(Boolean).join(', ') || 'Various' : 
                       'Various')}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <Clock size={14} />
                  <span>
                    {program.duration_weeks ? `${program.duration_weeks}w` : 'N/A'}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <GraduationCap size={14} />
                  <span>
                    {getGradeLevelRange(program.grade_level)}
                  </span>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  <Calendar size={14} />
                  <span>
                    {formatDeadline(program.application_deadline)}
                  </span>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
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
                
                <div style={{
                  fontSize: '12px',
                  color: '#374151',
                  fontWeight: '500'
                }}>
                  Tuition: {formatTuitionAmount(program)}
                  {getAccuracyDisclaimer(program) && (
                    <span style={{ 
                      fontSize: '10px', 
                      color: '#6b7280',
                      fontStyle: 'italic',
                      display: 'block',
                      marginTop: '2px'
                    }}>
                      *Refer to website for current pricing
                    </span>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleViewProgram(program)
                  }}
                  style={{
                    background: '#667eea',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
          </div>
          
          {/* Pagination Controls for Grid View */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              marginTop: '20px'
            }}>
              <div style={{
                display: 'flex',
                gap: '8px',
                alignItems: 'center'
              }}>
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  First
                </button>
                
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: currentPage === 1 ? '#f3f4f6' : 'white',
                    color: currentPage === 1 ? '#9ca3af' : '#374151',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Previous
                </button>
                
                <div style={{
                  display: 'flex',
                  gap: '4px'
                }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '8px 16px',
                          border: '1px solid #d1d5db',
                          borderRadius: '8px',
                          background: currentPage === pageNum ? '#667eea' : 'white',
                          color: currentPage === pageNum ? 'white' : '#374151',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: currentPage === pageNum ? '600' : '500'
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Next
                </button>
                
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    background: currentPage === totalPages ? '#f3f4f6' : 'white',
                    color: currentPage === totalPages ? '#9ca3af' : '#374151',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Last
                </button>
              </div>
              
              <div style={{
                marginLeft: '20px',
                fontSize: '14px',
                color: '#6b7280'
              }}>
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {filteredPrograms.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#6b7280'
        }}>
          <h3 style={{
            fontSize: '20px',
            margin: '0 0 12px 0',
            color: '#374151'
          }}>
            No programs found
          </h3>
          <p style={{
            fontSize: '16px',
            margin: '0 0 20px 0'
          }}>
            Try adjusting your search criteria or filters
          </p>
          <button
            onClick={clearAllFilters}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Program Details Modal */}
      <ProgramDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        program={selectedProgram}
      />

      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default ProgramsTable