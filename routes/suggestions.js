const express = require('express')
const { v4: uuidv4 } = require('uuid')
const jwt = require('jsonwebtoken')
const db = require('../services/database')

const router = express.Router()

// Helper function to verify user role
const verifyRole = async (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    })
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.userId])
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    req.user = result.rows[0]
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    })
  }
}

// Helper function to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      })
    }

    next()
  }
}

// Routes

// Submit a new program suggestion
router.post('/suggest-program', verifyRole, async (req, res) => {
  try {
    const {
      programName,
      organization,
      description,
      website,
      costCategory,
      gradeLevel,
      applicationDeadline,
      location,
      prestigeLevel,
      duration,
      financialAid,
      additionalInfo,
      comment
    } = req.body

    // Validation
    if (!programName || !organization) {
      return res.status(400).json({
        success: false,
        message: 'Program name and organization are required'
      })
    }

    const result = await db.query(`
      INSERT INTO program_suggestions (
        type, program_data, comment, submitted_by, status
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      'new_program',
      JSON.stringify({
        program_name: programName,
        organization: {
          name: organization,
          website: website || null,
          city: null,
          state: null
        },
        description: description || null,
        website: website || null,
        cost_category: costCategory || 'FREE',
        grade_level: gradeLevel || null,
        application_deadline: applicationDeadline || null,
        location: location || null,
        prestige_level: prestigeLevel || 'accessible',
        duration: duration || null,
        financial_aid: financialAid || null,
        additional_info: additionalInfo || null
      }),
      comment || null,
      req.user.id,
      'pending'
    ])

    const suggestionId = result.rows[0].id

    res.json({
      success: true,
      message: 'Program suggestion submitted successfully',
      suggestionId: suggestionId
    })

  } catch (error) {
    console.error('Suggest program error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit program suggestion'
    })
  }
})

// Suggest an edit to an existing program
router.post('/suggest-edit/:programId', verifyRole, async (req, res) => {
  try {
    const { programId } = req.params
    const {
      field,
      oldValue,
      newValue,
      reason,
      comment
    } = req.body

    // Validation
    if (!field || !newValue) {
      return res.status(400).json({
        success: false,
        message: 'Field and new value are required'
      })
    }

    const suggestion = {
      id: uuidv4(),
      type: 'edit_program',
      programId: programId,
      field: field,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason || null,
      submittedBy: req.user.id,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      reviewComment: null,
      comment: comment || null
    }

    suggestions.push(suggestion)

    res.json({
      success: true,
      message: 'Edit suggestion submitted successfully',
      suggestionId: suggestion.id
    })

  } catch (error) {
    console.error('Suggest edit error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to submit edit suggestion'
    })
  }
})

// Get all suggestions (for data admins and admins)
router.get('/suggestions', verifyRole, requireRole(['data_admin', 'admin']), async (req, res) => {
  try {
    const { status, type } = req.query
    
    let filteredSuggestions = suggestions
    
    if (status) {
      filteredSuggestions = filteredSuggestions.filter(s => s.status === status)
    }
    
    if (type) {
      filteredSuggestions = filteredSuggestions.filter(s => s.type === type)
    }

    // Sort by submission date (newest first)
    filteredSuggestions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    res.json({
      success: true,
      suggestions: filteredSuggestions,
      count: filteredSuggestions.length
    })

  } catch (error) {
    console.error('Get suggestions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestions'
    })
  }
})

// Get suggestions submitted by current user
router.get('/my-suggestions', verifyRole, async (req, res) => {
  try {
    const userSuggestions = suggestions.filter(s => s.submittedBy === req.user.id)
    
    // Sort by submission date (newest first)
    userSuggestions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))

    res.json({
      success: true,
      suggestions: userSuggestions,
      count: userSuggestions.length
    })

  } catch (error) {
    console.error('Get my suggestions error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your suggestions'
    })
  }
})

// Review/approve/reject a suggestion (data admins and admins)
router.post('/suggestions/:suggestionId/review', verifyRole, requireRole(['data_admin', 'admin']), async (req, res) => {
  try {
    const { suggestionId } = req.params
    const { action, comment } = req.body // action: 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "approve" or "reject"'
      })
    }

    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      })
    }

    if (suggestion.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Suggestion has already been reviewed'
      })
    }

    // Update suggestion
    suggestion.status = action === 'approve' ? 'approved' : 'rejected'
    suggestion.reviewedBy = req.user.id
    suggestion.reviewedAt = new Date().toISOString()
    suggestion.reviewComment = comment || null

    // If approved and it's a new program, add to programs database
    if (action === 'approve' && suggestion.type === 'new_program') {
      // In a real app, you'd add to the actual programs database
      console.log('New program approved:', suggestion.programData)
    }

    // If approved and it's an edit, apply the edit
    if (action === 'approve' && suggestion.type === 'edit_program') {
      // In a real app, you'd update the actual program in the database
      console.log('Program edit approved:', {
        programId: suggestion.programId,
        field: suggestion.field,
        newValue: suggestion.newValue
      })
    }

    res.json({
      success: true,
      message: `Suggestion ${action}d successfully`,
      suggestion: suggestion
    })

  } catch (error) {
    console.error('Review suggestion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to review suggestion'
    })
  }
})

// Get suggestion details
router.get('/suggestions/:suggestionId', verifyRole, async (req, res) => {
  try {
    const { suggestionId } = req.params

    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      })
    }

    // Check if user can view this suggestion
    const canView = req.user.role === 'admin' || 
                   req.user.role === 'data_admin' || 
                   suggestion.submittedBy === req.user.id

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this suggestion'
      })
    }

    res.json({
      success: true,
      suggestion: suggestion
    })

  } catch (error) {
    console.error('Get suggestion error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suggestion'
    })
  }
})

// Add comment to a suggestion
router.post('/suggestions/:suggestionId/comments', verifyRole, async (req, res) => {
  try {
    const { suggestionId } = req.params
    const { comment } = req.body

    if (!comment) {
      return res.status(400).json({
        success: false,
        message: 'Comment is required'
      })
    }

    const suggestion = suggestions.find(s => s.id === suggestionId)
    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: 'Suggestion not found'
      })
    }

    const commentObj = {
      id: uuidv4(),
      suggestionId: suggestionId,
      userId: req.user.id,
      userName: `${req.user.firstName} ${req.user.lastName}`,
      comment: comment,
      createdAt: new Date().toISOString()
    }

    comments.push(commentObj)

    res.json({
      success: true,
      message: 'Comment added successfully',
      comment: commentObj
    })

  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add comment'
    })
  }
})

// Get comments for a suggestion
router.get('/suggestions/:suggestionId/comments', verifyRole, async (req, res) => {
  try {
    const { suggestionId } = req.params

    const suggestionComments = comments.filter(c => c.suggestionId === suggestionId)
    
    // Sort by creation date (oldest first)
    suggestionComments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

    res.json({
      success: true,
      comments: suggestionComments,
      count: suggestionComments.length
    })

  } catch (error) {
    console.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments'
    })
  }
})

// Admin: Promote user to data admin
router.post('/admin/promote-user', verifyRole, requireRole(['admin']), async (req, res) => {
  try {
    const { userId, role } = req.body

    if (!userId || !role || !['user', 'data_admin', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Valid userId and role are required'
      })
    }

    // In a real app, you'd update the user in the database
    const users = require('./auth').users || []
    const user = users.find(u => u.id === userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    user.role = role
    user.updatedAt = new Date().toISOString()

    res.json({
      success: true,
      message: `User promoted to ${role} successfully`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })

  } catch (error) {
    console.error('Promote user error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to promote user'
    })
  }
})

// Get all users (admin only)
router.get('/admin/users', verifyRole, requireRole(['admin']), async (req, res) => {
  try {
    const users = require('./auth').users || []
    
    // Remove sensitive information
    const safeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }))

    res.json({
      success: true,
      users: safeUsers,
      count: safeUsers.length
    })

  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    })
  }
})

module.exports = router
