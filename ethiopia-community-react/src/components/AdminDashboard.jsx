import React, { useState, useEffect } from 'react'
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  MessageSquare,
  UserCheck,
  Shield,
  Filter,
  Search
} from 'lucide-react'

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('suggestions')
  const [suggestions, setSuggestions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (activeTab === 'suggestions') {
      fetchSuggestions()
    } else if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/suggestions/suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setSuggestions(data.suggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReviewSuggestion = async (suggestionId, action, comment = '') => {
    try {
      const response = await fetch(`/api/suggestions/suggestions/${suggestionId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, comment })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchSuggestions() // Refresh suggestions
      } else {
        alert(data.message || 'Failed to review suggestion')
      }
    } catch (error) {
      console.error('Failed to review suggestion:', error)
      alert('Network error. Please try again.')
    }
  }

  const handlePromoteUser = async (userId, newRole) => {
    try {
      const response = await fetch('/api/admin/promote-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId, role: newRole })
      })
      
      const data = await response.json()
      if (data.success) {
        fetchUsers() // Refresh users
      } else {
        alert(data.message || 'Failed to promote user')
      }
    } catch (error) {
      console.error('Failed to promote user:', error)
      alert('Network error. Please try again.')
    }
  }

  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesFilter = filter === 'all' || suggestion.status === filter
    const matchesSearch = searchTerm === '' || 
      suggestion.programData?.program_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.programData?.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const filteredUsers = users.filter(user => {
    return searchTerm === '' || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#dc2626'
      case 'data_admin': return '#2563eb'
      case 'user': return '#059669'
      default: return '#6b7280'
    }
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      margin: '20px'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          margin: '0 0 8px 0',
          color: '#1f2937',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Shield size={32} />
          Admin Dashboard
        </h1>
        <p style={{
          color: '#6b7280',
          margin: 0,
          fontSize: '16px'
        }}>
          Manage suggestions and users
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <button
          onClick={() => setActiveTab('suggestions')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'suggestions' ? '#667eea' : 'transparent',
            color: activeTab === 'suggestions' ? 'white' : '#6b7280',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'suggestions' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          Suggestions ({suggestions.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'users' ? '#667eea' : 'transparent',
            color: activeTab === 'users' ? 'white' : '#6b7280',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer',
            borderBottom: activeTab === 'users' ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          Users ({users.length})
        </button>
      </div>

      {/* Search and Filter */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af'
          }} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
        </div>
        
        {activeTab === 'suggestions' && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              backgroundColor: 'white'
            }}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6b7280'
        }}>
          Loading...
        </div>
      ) : (
        <>
          {activeTab === 'suggestions' && (
            <div>
              {filteredSuggestions.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  No suggestions found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {filteredSuggestions.map(suggestion => (
                    <div key={suggestion.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#f9fafb'
                    }}>
                      {/* Suggestion Header */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '16px'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: '0 0 8px 0',
                            color: '#1f2937'
                          }}>
                            {suggestion.type === 'new_program' ? 'New Program' : 'Program Edit'}
                          </h3>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '8px'
                          }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: '500',
                              backgroundColor: getStatusColor(suggestion.status),
                              color: 'white'
                            }}>
                              {suggestion.status}
                            </span>
                            <span style={{ color: '#6b7280', fontSize: '14px' }}>
                              {new Date(suggestion.submittedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        
                        {suggestion.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => handleReviewSuggestion(suggestion.id, 'approve')}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <CheckCircle size={16} />
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const comment = prompt('Rejection reason (optional):')
                                handleReviewSuggestion(suggestion.id, 'reject', comment)
                              }}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Suggestion Details */}
                      <div style={{ marginBottom: '16px' }}>
                        {suggestion.type === 'new_program' ? (
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                              <strong>Program:</strong> {suggestion.programData.program_name}
                            </p>
                            <p style={{ margin: '0 0 8px 0' }}>
                              <strong>Organization:</strong> {suggestion.programData.organization.name}
                            </p>
                            {suggestion.programData.description && (
                              <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Description:</strong> {suggestion.programData.description}
                              </p>
                            )}
                            {suggestion.programData.website && (
                              <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Website:</strong> 
                                <a href={suggestion.programData.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', marginLeft: '4px' }}>
                                  {suggestion.programData.website}
                                </a>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                              <strong>Field:</strong> {suggestion.field}
                            </p>
                            <p style={{ margin: '0 0 8px 0' }}>
                              <strong>Old Value:</strong> {suggestion.oldValue || 'N/A'}
                            </p>
                            <p style={{ margin: '0 0 8px 0' }}>
                              <strong>New Value:</strong> {suggestion.newValue}
                            </p>
                            {suggestion.reason && (
                              <p style={{ margin: '0 0 8px 0' }}>
                                <strong>Reason:</strong> {suggestion.reason}
                              </p>
                            )}
                          </div>
                        )}
                        
                        {suggestion.comment && (
                          <div style={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '12px',
                            marginTop: '12px'
                          }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: '500', fontSize: '14px' }}>
                              <MessageSquare size={14} style={{ display: 'inline', marginRight: '4px' }} />
                              Comment:
                            </p>
                            <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                              {suggestion.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              {filteredUsers.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#6b7280'
                }}>
                  No users found
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '16px'
                }}>
                  {filteredUsers.map(user => (
                    <div key={user.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px',
                      backgroundColor: '#f9fafb'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '16px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#667eea',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            margin: '0 0 4px 0',
                            color: '#1f2937'
                          }}>
                            {user.firstName} {user.lastName}
                          </h3>
                          <p style={{
                            fontSize: '14px',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getRoleColor(user.role),
                          color: 'white'
                        }}>
                          {user.role.replace('_', ' ')}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          {user.emailVerified ? '✓ Verified' : '⚠ Unverified'}
                        </span>
                      </div>

                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '16px'
                      }}>
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </div>

                      {user.role !== 'admin' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {user.role !== 'data_admin' && (
                            <button
                              onClick={() => handlePromoteUser(user.id, 'data_admin')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Promote to Data Admin
                            </button>
                          )}
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handlePromoteUser(user.id, 'admin')}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: '#dc2626',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500',
                                cursor: 'pointer'
                              }}
                            >
                              Promote to Admin
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminDashboard
