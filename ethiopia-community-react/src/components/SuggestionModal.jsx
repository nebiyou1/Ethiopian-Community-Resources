import React, { useState } from 'react'
import { X, Plus, Edit3, MessageSquare, Send } from 'lucide-react'

const SuggestionModal = ({ isOpen, onClose, program = null, type = 'new' }) => {
  const [formData, setFormData] = useState({
    programName: program?.program_name || '',
    organization: program?.organization?.name || '',
    description: program?.description || '',
    website: program?.website || '',
    costCategory: program?.cost_category || 'FREE',
    gradeLevel: program?.grade_level || '',
    applicationDeadline: program?.application_deadline || '',
    location: program?.location || '',
    prestigeLevel: program?.prestige_level || 'accessible',
    duration: program?.duration || '',
    financialAid: program?.financial_aid || '',
    additionalInfo: program?.additional_info || '',
    comment: ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)

  const costCategories = [
    { value: 'FREE', label: '🆓 Free' },
    { value: 'FREE_PLUS_STIPEND', label: '💰 Free + Stipend' },
    { value: 'FREE_PLUS_SCHOLARSHIP', label: '🎓 Free + Scholarship' },
    { value: 'LOW_COST', label: '💵 Low Cost' },
    { value: 'PAID', label: '💸 Paid' }
  ]

  const prestigeLevels = [
    { value: 'elite', label: '🏆 Elite' },
    { value: 'highly-selective', label: '⭐ Highly Selective' },
    { value: 'selective', label: '🎯 Selective' },
    { value: 'accessible', label: '🌍 Accessible' }
  ]

  const gradeLevels = [
    { value: '6', label: '6th Grade' },
    { value: '7', label: '7th Grade' },
    { value: '8', label: '8th Grade' },
    { value: '9', label: '9th Grade' },
    { value: '10', label: '10th Grade' },
    { value: '11', label: '11th Grade' },
    { value: '12', label: '12th Grade' },
    { value: '6-8', label: 'Middle School (6-8)' },
    { value: '9-12', label: 'High School (9-12)' }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.programName.trim()) {
      newErrors.programName = 'Program name is required'
    }
    
    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization is required'
    }
    
    if (formData.website && !isValidUrl(formData.website)) {
      newErrors.website = 'Please enter a valid URL'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      const endpoint = type === 'new' 
        ? '/api/suggestions/suggest-program'
        : `/api/suggestions/suggest-edit/${program.id}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
          setSuccess(false)
        }, 2000)
      } else {
        setErrors({ general: data.message || 'Failed to submit suggestion' })
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' })
    } finally {
      setIsSubmitting(false)
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
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          <X size={24} />
        </button>

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            margin: '0 0 8px 0',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {type === 'new' ? <Plus size={24} /> : <Edit3 size={24} />}
            {type === 'new' ? 'Suggest New Program' : 'Suggest Program Edit'}
          </h2>
          <p style={{
            color: '#6b7280',
            margin: 0,
            fontSize: '14px'
          }}>
            {type === 'new' 
              ? 'Help expand our database by suggesting a new program'
              : 'Suggest improvements to this program\'s information'
            }
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #0ea5e9',
            color: '#0369a1',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            ✅ Suggestion submitted successfully! A data admin will review it soon.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* General error */}
          {errors.general && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {errors.general}
            </div>
          )}

          {/* Program Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Program Name *
            </label>
            <input
              type="text"
              name="programName"
              value={formData.programName}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.programName ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter program name"
            />
            {errors.programName && (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.programName}
              </p>
            )}
          </div>

          {/* Organization */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Organization *
            </label>
            <input
              type="text"
              name="organization"
              value={formData.organization}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.organization ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="Enter organization name"
            />
            {errors.organization && (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.organization}
              </p>
            )}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Describe the program..."
            />
          </div>

          {/* Website */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Website
            </label>
            <input
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${errors.website ? '#dc2626' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none'
              }}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p style={{ color: '#dc2626', fontSize: '12px', margin: '4px 0 0 0' }}>
                {errors.website}
              </p>
            )}
          </div>

          {/* Cost Category and Prestige Level */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
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
                name="costCategory"
                value={formData.costCategory}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              >
                {costCategories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
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
                name="prestigeLevel"
                value={formData.prestigeLevel}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              >
                {prestigeLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Grade Level and Location */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
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
                name="gradeLevel"
                value={formData.gradeLevel}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              >
                <option value="">Select grade level</option>
                {gradeLevels.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
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
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="City, State"
              />
            </div>
          </div>

          {/* Application Deadline and Duration */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Application Deadline
              </label>
              <input
                type="date"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Duration
              </label>
              <input
                type="text"
                name="duration"
                value={formData.duration}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  outline: 'none'
                }}
                placeholder="e.g., 2 weeks, 1 month"
              />
            </div>
          </div>

          {/* Financial Aid */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Financial Aid Information
            </label>
            <textarea
              name="financialAid"
              value={formData.financialAid}
              onChange={handleInputChange}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Describe available financial aid..."
            />
          </div>

          {/* Additional Info */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              Additional Information
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              rows={2}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Any other relevant information..."
            />
          </div>

          {/* Comment */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              <MessageSquare size={16} style={{ display: 'inline', marginRight: '4px' }} />
              Comment (Optional)
            </label>
            <textarea
              name="comment"
              value={formData.comment}
              onChange={handleInputChange}
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px',
                outline: 'none',
                resize: 'vertical'
              }}
              placeholder="Add any additional comments or context..."
            />
          </div>

          {/* Submit button */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 24px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#374151',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Send size={16} />
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SuggestionModal
