#!/usr/bin/env node

const db = require('../services/database')
const fs = require('fs')
const path = require('path')

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database schema...')
    await db.initializeSchema()
    console.log('✅ Database schema initialized successfully')
    
    // Check if we have JSON data to migrate
    const jsonPath = path.join(__dirname, '../docs/inputdata.json')
    if (fs.existsSync(jsonPath)) {
      console.log('🔄 Migrating data from JSON...')
      const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
      await db.migrateFromJson(jsonData)
      console.log('✅ Data migration completed successfully')
    } else {
      console.log('ℹ️  No JSON data found to migrate')
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    process.exit(1)
  }
}

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...')
    
    // Drop all tables
    await db.query('DROP TABLE IF EXISTS search_analytics CASCADE')
    await db.query('DROP TABLE IF EXISTS program_views CASCADE')
    await db.query('DROP TABLE IF EXISTS user_favorites CASCADE')
    await db.query('DROP TABLE IF EXISTS suggestion_comments CASCADE')
    await db.query('DROP TABLE IF EXISTS program_suggestions CASCADE')
    await db.query('DROP TABLE IF EXISTS password_reset_tokens CASCADE')
    await db.query('DROP TABLE IF EXISTS email_verification_tokens CASCADE')
    await db.query('DROP TABLE IF EXISTS programs CASCADE')
    await db.query('DROP TABLE IF EXISTS organizations CASCADE')
    await db.query('DROP TABLE IF EXISTS users CASCADE')
    
    console.log('✅ Database reset completed')
    
    // Reinitialize
    await initializeDatabase()
    
  } catch (error) {
    console.error('❌ Database reset failed:', error)
    process.exit(1)
  }
}

async function migrateData() {
  try {
    console.log('🔄 Migrating data from JSON...')
    const jsonPath = path.join(__dirname, '../docs/inputdata.json')
    
    if (!fs.existsSync(jsonPath)) {
      console.error('❌ JSON data file not found:', jsonPath)
      process.exit(1)
    }
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    await db.migrateFromJson(jsonData)
    console.log('✅ Data migration completed successfully')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Data migration failed:', error)
    process.exit(1)
  }
}

async function healthCheck() {
  try {
    console.log('🔄 Checking database health...')
    const health = await db.healthCheck()
    console.log('📊 Database Health:', JSON.stringify(health, null, 2))
    process.exit(0)
  } catch (error) {
    console.error('❌ Health check failed:', error)
    process.exit(1)
  }
}

async function backupData() {
  try {
    console.log('🔄 Creating database backup...')
    
    // Get all programs
    const programs = await db.query(`
      SELECT 
        p.*,
        o.name as organization_name,
        o.website as organization_website,
        o.city as organization_city,
        o.state as organization_state,
        o.description as organization_description
      FROM programs p
      LEFT JOIN organizations o ON p.organization_id = o.id
      ORDER BY p.program_name
    `)
    
    // Transform to expected format
    const backupData = {
      programs: programs.rows.map(row => ({
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
      })),
      metadata: {
        backup_date: new Date().toISOString(),
        total_programs: programs.rows.length
      }
    }
    
    // Write backup file
    const backupPath = path.join(__dirname, `../backups/backup-${new Date().toISOString().split('T')[0]}.json`)
    fs.mkdirSync(path.dirname(backupPath), { recursive: true })
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2))
    
    console.log(`✅ Backup created: ${backupPath}`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Backup failed:', error)
    process.exit(1)
  }
}

// Command line interface
const command = process.argv[2]

switch (command) {
  case 'init':
    initializeDatabase()
    break
  case 'reset':
    resetDatabase()
    break
  case 'migrate':
    migrateData()
    break
  case 'health':
    healthCheck()
    break
  case 'backup':
    backupData()
    break
  default:
    console.log(`
📚 Database Management Script

Usage: node scripts/db-manager.js <command>

Commands:
  init     - Initialize database schema and migrate data
  reset    - Reset database and reinitialize
  migrate  - Migrate data from JSON file
  health   - Check database health
  backup   - Create backup of current data

Examples:
  node scripts/db-manager.js init
  node scripts/db-manager.js reset
  node scripts/db-manager.js migrate
  node scripts/db-manager.js health
  node scripts/db-manager.js backup
`)
    process.exit(1)
}
