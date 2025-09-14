const { Pool } = require('pg')
require('dotenv').config()

class DatabaseConnection {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'ethiopian_community',
      user: process.env.DB_USER || 'nebiyougirma',
      password: process.env.DB_PASSWORD || '',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
    })
  }

  async query(text, params) {
    const start = Date.now()
    try {
      const res = await this.pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: res.rowCount })
      return res
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async getClient() {
    return await this.pool.connect()
  }

  async transaction(callback) {
    const client = await this.getClient()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async close() {
    await this.pool.end()
  }

  // Health check
  async healthCheck() {
    try {
      const result = await this.query('SELECT NOW() as current_time')
      return {
        status: 'healthy',
        timestamp: result.rows[0].current_time,
        connectionCount: this.pool.totalCount,
        idleCount: this.pool.idleCount,
        waitingCount: this.pool.waitingCount
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      }
    }
  }

  // Initialize database schema
  async initializeSchema() {
    try {
      const fs = require('fs')
      const path = require('path')
      const schemaPath = path.join(__dirname, '../database/schema.sql')
      const schema = fs.readFileSync(schemaPath, 'utf8')
      
      await this.query(schema)
      console.log('✅ Database schema initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error)
      throw error
    }
  }

  // Migrate data from JSON to database
  async migrateFromJson(jsonData) {
    try {
      await this.transaction(async (client) => {
        console.log('🔄 Starting data migration from JSON...')
        
        // Clear existing data
        await client.query('DELETE FROM programs')
        await client.query('DELETE FROM organizations')
        
        // Insert organizations first
        const orgMap = new Map()
        for (const program of jsonData.programs) {
          // Extract organization name from program name or use a default
          let orgName = 'Unknown Organization'
          if (program.program_name) {
            // Try to extract organization from program name
            const words = program.program_name.split(' ')
            if (words.length > 1) {
              orgName = words.slice(0, Math.min(3, words.length - 1)).join(' ')
            }
          }
          
          if (!orgMap.has(orgName)) {
            const orgResult = await client.query(
              `INSERT INTO organizations (name, website, state, description) 
               VALUES ($1, $2, $3, $4) RETURNING id`,
              [
                orgName,
                program.website || null,
                program.location_state || null,
                program.key_benefits || null
              ]
            )
            orgMap.set(orgName, orgResult.rows[0].id)
          }
        }
        
        // Insert programs
        for (const program of jsonData.programs) {
          if (program.program_name) {
            // Extract organization name the same way
            let orgName = 'Unknown Organization'
            if (program.program_name) {
              const words = program.program_name.split(' ')
              if (words.length > 1) {
                orgName = words.slice(0, Math.min(3, words.length - 1)).join(' ')
              }
            }
            
            const orgId = orgMap.get(orgName)
            
            // Clean and validate data
            const cleanedProgram = this.cleanProgramData(program)
            
            await client.query(
              `INSERT INTO programs (
                program_name, organization_id, description, website, cost_category,
                grade_level, application_deadline, deadline_note, location, prestige_level,
                duration, financial_aid, additional_info, is_estimated_deadline
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
              [
                cleanedProgram.program_name,
                orgId,
                cleanedProgram.description || null,
                cleanedProgram.website || null,
                cleanedProgram.cost_category || 'FREE',
                cleanedProgram.grade_level || null,
                cleanedProgram.application_deadline || null,
                cleanedProgram.deadline_note || null,
                cleanedProgram.location || null,
                cleanedProgram.prestige_level || 'accessible',
                cleanedProgram.duration || null,
                cleanedProgram.financial_aid || null,
                cleanedProgram.additional_info || null,
                cleanedProgram.is_estimated_deadline || false
              ]
            )
          }
        }
        
        console.log(`✅ Migrated ${jsonData.programs.length} programs successfully`)
      })
      
      return true
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    }
  }

  // Clean program data (same logic as before)
  cleanProgramData(program) {
    // Remove programs with invalid names
    if (!program.program_name || 
        program.program_name.trim() === '' ||
        program.program_name.toLowerCase() === 'unknown program' ||
        program.program_name.toLowerCase() === 'n/a') {
      return null
    }
    
    const cleaned = { ...program }
    
    // Clean program name
    cleaned.program_name = program.program_name.toString().trim()
    
    // Clean dates
    if (program.application_deadline) {
      const deadline = program.application_deadline.toString().trim()
      if (deadline === 'N/A' || deadline === 'TBD' || deadline === '' || 
          deadline.toLowerCase().includes('invalid') ||
          deadline.toLowerCase().includes('rolling')) {
        cleaned.application_deadline = null
        cleaned.deadline_note = 'Refer to website for current deadline'
      } else {
        const date = new Date(deadline)
        if (isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2030) {
          cleaned.application_deadline = null
          cleaned.deadline_note = 'Refer to website for current deadline'
        } else {
          cleaned.application_deadline = date.toISOString().split('T')[0]
          cleaned.is_estimated_deadline = deadline.toLowerCase().includes('estimated')
        }
      }
    }
    
    // Clean grade levels
    if (program.grade_level) {
      const gradeStr = program.grade_level.toString().trim()
      if (gradeStr.match(/^\d+$/)) {
        const grade = parseInt(gradeStr)
        if (grade < 6 || grade > 12) {
          cleaned.grade_level = null
        }
      } else if (gradeStr.match(/^\d+-\d+$/)) {
        const [min, max] = gradeStr.split('-').map(n => parseInt(n.trim()))
        if (min < 6 || max > 12 || min > max) {
          cleaned.grade_level = null
        }
      } else if (gradeStr.toLowerCase().includes('high school')) {
        cleaned.grade_level = '9-12'
      } else if (gradeStr.toLowerCase().includes('middle school')) {
        cleaned.grade_level = '6-8'
      } else {
        cleaned.grade_level = null
      }
    }
    
    // Clean cost category
    const validCategories = ['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID']
    if (!program.cost_category || !validCategories.includes(program.cost_category)) {
      cleaned.cost_category = 'FREE'
    }
    
    // Clean prestige level
    const validLevels = ['elite', 'highly-selective', 'selective', 'accessible']
    if (!program.prestige_level || !validLevels.includes(program.prestige_level)) {
      cleaned.prestige_level = 'accessible'
    }
    
    // Clean location
    if (!program.location || program.location.trim() === '') {
      if (program.organization && (program.organization.city || program.organization.state)) {
        const locationParts = []
        if (program.organization.city) locationParts.push(program.organization.city)
        if (program.organization.state) locationParts.push(program.organization.state)
        cleaned.location = locationParts.join(', ')
      } else {
        cleaned.location = 'Various locations'
      }
    }
    
    return cleaned
  }

  // Search programs with filters
  async searchPrograms(searchTerm = '', filters = {}) {
    try {
      let query = `
        SELECT 
          p.*,
          o.name as organization_name,
          o.website as organization_website,
          o.city as organization_city,
          o.state as organization_state,
          o.description as organization_description
        FROM programs p
        LEFT JOIN organizations o ON p.organization_id = o.id
        WHERE 1=1
      `
      
      const params = []
      let paramCount = 0
      
      // Add search term
      if (searchTerm) {
        paramCount++
        query += ` AND (
          p.program_name ILIKE $${paramCount} OR
          p.description ILIKE $${paramCount} OR
          p.location ILIKE $${paramCount} OR
          o.name ILIKE $${paramCount}
        )`
        params.push(`%${searchTerm}%`)
      }
      
      // Add filters
      if (filters.costCategory) {
        paramCount++
        query += ` AND p.cost_category = $${paramCount}`
        params.push(filters.costCategory)
      }
      
      if (filters.prestige) {
        paramCount++
        query += ` AND p.prestige_level = $${paramCount}`
        params.push(filters.prestige)
      }
      
      if (filters.gradeLevel) {
        paramCount++
        query += ` AND p.grade_level = $${paramCount}`
        params.push(filters.gradeLevel)
      }
      
      if (filters.location) {
        paramCount++
        query += ` AND p.location ILIKE $${paramCount}`
        params.push(`%${filters.location}%`)
      }
      
      query += ` ORDER BY p.program_name ASC`
      
      const result = await this.query(query, params)
      
      // Transform results to match expected format
      return result.rows.map(row => ({
        id: row.id,
        program_name: row.program_name,
        organization: {
          name: row.organization_name,
          website: row.organization_website,
          city: row.organization_city,
          state: row.organization_state,
          description: row.organization_description
        },
        description: row.description,
        website: row.website,
        cost_category: row.cost_category,
        grade_level: row.grade_level,
        application_deadline: row.application_deadline,
        deadline_note: row.deadline_note,
        location: row.location,
        prestige_level: row.prestige_level,
        duration: row.duration,
        financial_aid: row.financial_aid,
        additional_info: row.additional_info,
        is_estimated_deadline: row.is_estimated_deadline,
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
      
    } catch (error) {
      console.error('Search programs error:', error)
      throw error
    }
  }

  // Get program by ID
  async getProgramById(id) {
    try {
      const result = await this.query(`
        SELECT 
          p.*,
          o.name as organization_name,
          o.website as organization_website,
          o.city as organization_city,
          o.state as organization_state,
          o.description as organization_description
        FROM programs p
        LEFT JOIN organizations o ON p.organization_id = o.id
        WHERE p.id = $1
      `, [id])
      
      if (result.rows.length === 0) return null
      
      const row = result.rows[0]
      return {
        id: row.id,
        program_name: row.program_name,
        organization: {
          name: row.organization_name,
          website: row.organization_website,
          city: row.organization_city,
          state: row.organization_state,
          description: row.organization_description
        },
        description: row.description,
        website: row.website,
        cost_category: row.cost_category,
        grade_level: row.grade_level,
        application_deadline: row.application_deadline,
        deadline_note: row.deadline_note,
        location: row.location,
        prestige_level: row.prestige_level,
        duration: row.duration,
        financial_aid: row.financial_aid,
        additional_info: row.additional_info,
        is_estimated_deadline: row.is_estimated_deadline,
        created_at: row.created_at,
        updated_at: row.updated_at
      }
    } catch (error) {
      console.error('Get program by ID error:', error)
      throw error
    }
  }

  // Get filter options
  async getFilterOptions() {
    try {
      const [costCategories, prestigeLevels, gradeLevels, locations] = await Promise.all([
        this.query('SELECT DISTINCT cost_category FROM programs WHERE cost_category IS NOT NULL ORDER BY cost_category'),
        this.query('SELECT DISTINCT prestige_level FROM programs WHERE prestige_level IS NOT NULL ORDER BY prestige_level'),
        this.query('SELECT DISTINCT grade_level FROM programs WHERE grade_level IS NOT NULL ORDER BY grade_level'),
        this.query('SELECT DISTINCT location FROM programs WHERE location IS NOT NULL ORDER BY location')
      ])
      
      return {
        costCategories: costCategories.rows.map(row => row.cost_category),
        prestigeLevels: prestigeLevels.rows.map(row => row.prestige_level),
        gradeLevels: gradeLevels.rows.map(row => row.grade_level),
        locations: locations.rows.map(row => row.location)
      }
    } catch (error) {
      console.error('Get filter options error:', error)
      throw error
    }
  }

  // Get statistics
  async getStatistics() {
    try {
      const [totalPrograms, totalOrganizations, costStats, prestigeStats] = await Promise.all([
        this.query('SELECT COUNT(*) as count FROM programs'),
        this.query('SELECT COUNT(*) as count FROM organizations'),
        this.query('SELECT cost_category, COUNT(*) as count FROM programs GROUP BY cost_category'),
        this.query('SELECT prestige_level, COUNT(*) as count FROM programs GROUP BY prestige_level')
      ])
      
      return {
        totalPrograms: parseInt(totalPrograms.rows[0].count),
        totalOrganizations: parseInt(totalOrganizations.rows[0].count),
        costDistribution: costStats.rows.reduce((acc, row) => {
          acc[row.cost_category] = parseInt(row.count)
          return acc
        }, {}),
        prestigeDistribution: prestigeStats.rows.reduce((acc, row) => {
          acc[row.prestige_level] = parseInt(row.count)
          return acc
        }, {})
      }
    } catch (error) {
      console.error('Get statistics error:', error)
      throw error
    }
  }
}

// Create singleton instance
const db = new DatabaseConnection()

module.exports = db
