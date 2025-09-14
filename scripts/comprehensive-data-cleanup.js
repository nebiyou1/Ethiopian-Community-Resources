#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🧹 Starting comprehensive database cleanup...')

// Read the input data
const inputPath = path.join(__dirname, '..', 'docs', 'inputdata.json')
const backupPath = path.join(__dirname, '..', 'docs', 'inputdata-backup-' + Date.now() + '.json')

if (!fs.existsSync(inputPath)) {
  console.error('❌ inputdata.json not found!')
  process.exit(1)
}

const rawData = fs.readFileSync(inputPath, 'utf8')
let data
try {
  data = JSON.parse(rawData)
} catch (error) {
  console.error('❌ Invalid JSON in inputdata.json:', error.message)
  process.exit(1)
}

// Backup original data
console.log('💾 Creating backup...')
fs.writeFileSync(backupPath, rawData)
console.log(`✅ Backup created: ${backupPath}`)

if (!data.programs || !Array.isArray(data.programs)) {
  console.error('❌ No programs array found in data!')
  process.exit(1)
}

const originalCount = data.programs.length
console.log(`📊 Processing ${originalCount} programs...`)

// Data cleanup functions
const cleanupFunctions = {
  // Fix date formatting
  fixDates: (program) => {
    if (program.application_deadline) {
      const deadline = program.application_deadline.toString().trim()
      
      // Handle common bad values
      if (deadline === 'N/A' || 
          deadline === 'TBD' || 
          deadline === '' || 
          deadline === 'null' || 
          deadline === 'undefined' ||
          deadline.toLowerCase().includes('invalid') ||
          deadline.toLowerCase().includes('rolling') ||
          deadline.toLowerCase().includes('varies') ||
          deadline.toLowerCase().includes('see website')) {
        program.application_deadline = null
        program.deadline_note = 'Refer to website for current deadline'
        return
      }

      // Try to parse and validate the date
      const date = new Date(deadline)
      if (isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2030) {
        program.application_deadline = null
        program.deadline_note = 'Refer to website for current deadline'
      } else {
        // Format to ISO string for consistency
        program.application_deadline = date.toISOString().split('T')[0]
        if (program.deadline_note) {
          delete program.deadline_note
        }
      }
    } else {
      program.application_deadline = null
      program.deadline_note = 'Refer to website for current deadline'
    }
  },

  // Fix grade levels to include proper ranges
  fixGradeLevels: (program) => {
    if (!program.grade_level) {
      program.grade_level_min = null
      program.grade_level_max = null
      program.grade_level_note = 'Refer to website for grade requirements'
      return
    }

    const gradeStr = program.grade_level.toString().trim()
    
    // Handle common patterns
    if (gradeStr.match(/^\d+$/)) {
      // Single grade like "10"
      const grade = parseInt(gradeStr)
      if (grade >= 6 && grade <= 12) {
        program.grade_level_min = Math.max(6, grade - 1)
        program.grade_level_max = Math.min(12, grade + 1)
        program.grade_level = `${program.grade_level_min}-${program.grade_level_max}`
      }
    } else if (gradeStr.match(/^\d+-\d+$/)) {
      // Range like "9-11"
      const [min, max] = gradeStr.split('-').map(n => parseInt(n.trim()))
      if (min >= 6 && max <= 12 && min <= max) {
        program.grade_level_min = min
        program.grade_level_max = max
        program.grade_level = `${min}-${max}`
      }
    } else if (gradeStr.toLowerCase().includes('high school')) {
      program.grade_level_min = 9
      program.grade_level_max = 12
      program.grade_level = '9-12'
    } else if (gradeStr.toLowerCase().includes('middle school')) {
      program.grade_level_min = 6
      program.grade_level_max = 8
      program.grade_level = '6-8'
    } else {
      // Invalid or unclear grade level
      program.grade_level_min = null
      program.grade_level_max = null
      program.grade_level_note = 'Refer to website for grade requirements'
    }
  },

  // Clean program names
  cleanProgramName: (program) => {
    if (!program.program_name || program.program_name.trim() === '') {
      return false // Mark for removal
    }
    
    const name = program.program_name.toString().trim()
    
    // Remove programs with placeholder names
    if (name.toLowerCase() === 'unknown program' ||
        name.toLowerCase() === 'n/a' ||
        name.toLowerCase() === 'tbd' ||
        name === '' ||
        name === 'null' ||
        name === 'undefined') {
      return false
    }
    
    program.program_name = name
    return true
  },

  // Clean organization data
  cleanOrganization: (program) => {
    if (!program.organization) {
      program.organization = {}
    }

    if (!program.organization.name || 
        program.organization.name.toString().trim() === '' ||
        program.organization.name.toString().toLowerCase() === 'unknown organization' ||
        program.organization.name.toString().toLowerCase() === 'n/a') {
      
      // Try to extract from program name
      const programName = program.program_name || ''
      const words = programName.split(/\s+/)
      
      if (words.length >= 2) {
        // Take first 2-3 words as organization name
        program.organization.name = words.slice(0, Math.min(3, words.length - 1)).join(' ')
      } else {
        return false // Mark for removal if we can't determine organization
      }
    } else {
      program.organization.name = program.organization.name.toString().trim()
    }

    // Clean other organization fields
    if (program.organization.city && program.organization.city.toString().trim() === '') {
      delete program.organization.city
    }
    if (program.organization.state && program.organization.state.toString().trim() === '') {
      delete program.organization.state
    }

    return true
  },

  // Validate and clean cost category
  cleanCostCategory: (program) => {
    const validCategories = ['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID']
    
    if (!program.cost_category || !validCategories.includes(program.cost_category)) {
      // Try to infer from other fields
      if (program.financial_aid) {
        const aid = program.financial_aid.toString().toLowerCase()
        if (aid.includes('stipend')) {
          program.cost_category = 'FREE_PLUS_STIPEND'
        } else if (aid.includes('scholarship') || aid.includes('free')) {
          program.cost_category = 'FREE_PLUS_SCHOLARSHIP'
        } else if (aid.includes('low cost') || aid.includes('reduced')) {
          program.cost_category = 'LOW_COST'
        } else {
          program.cost_category = 'FREE'
        }
      } else {
        program.cost_category = 'FREE' // Default assumption
      }
    }
    
    return true
  },

  // Clean prestige level
  cleanPrestigeLevel: (program) => {
    const validLevels = ['elite', 'highly-selective', 'selective', 'accessible']
    
    if (!program.prestige_level || !validLevels.includes(program.prestige_level)) {
      // Default to accessible if not specified
      program.prestige_level = 'accessible'
    }
    
    return true
  },

  // Clean location data
  cleanLocation: (program) => {
    if (!program.location || program.location.toString().trim() === '') {
      // Try to build from organization data
      if (program.organization && (program.organization.city || program.organization.state)) {
        const locationParts = []
        if (program.organization.city) locationParts.push(program.organization.city)
        if (program.organization.state) locationParts.push(program.organization.state)
        program.location = locationParts.join(', ')
      } else {
        program.location = 'Various locations'
      }
    } else {
      program.location = program.location.toString().trim()
    }
    
    return true
  },

  // Clean financial aid information
  cleanFinancialAid: (program) => {
    if (program.financial_aid && program.financial_aid.toString().trim() !== '') {
      program.financial_aid = program.financial_aid.toString().trim()
    } else {
      program.financial_aid = 'Contact program for details'
    }
    
    return true
  },

  // Validate website URLs
  cleanWebsite: (program) => {
    if (program.website) {
      const url = program.website.toString().trim()
      if (url === '' || url === 'N/A' || url === 'null' || url === 'undefined') {
        delete program.website
      } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
        program.website = 'https://' + url
      }
    }
    
    return true
  }
}

// Apply cleanup functions
let validPrograms = []
let removedCount = 0

for (let i = 0; i < data.programs.length; i++) {
  const program = data.programs[i]
  let isValid = true

  try {
    // Apply all cleanup functions
    for (const [functionName, cleanupFn] of Object.entries(cleanupFunctions)) {
      const result = cleanupFn(program)
      if (result === false) {
        console.log(`❌ Removing program: ${program.program_name || 'Unknown'} (failed ${functionName})`)
        isValid = false
        removedCount++
        break
      }
    }

    if (isValid) {
      // Add metadata
      program.data_quality = {
        last_cleaned: new Date().toISOString(),
        cleaned_fields: Object.keys(cleanupFunctions)
      }
      
      validPrograms.push(program)
    }
  } catch (error) {
    console.log(`❌ Error processing program ${i}: ${error.message}`)
    removedCount++
  }
}

// Update the data structure
data.programs = validPrograms
data.metadata = {
  ...data.metadata,
  total_programs: validPrograms.length,
  last_updated: new Date().toISOString(),
  data_quality: {
    original_count: originalCount,
    cleaned_count: validPrograms.length,
    removed_count: removedCount,
    cleanup_date: new Date().toISOString(),
    cleanup_version: '2.0'
  }
}

// Write cleaned data
const outputPath = path.join(__dirname, '..', 'docs', 'inputdata-cleaned.json')
fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))

// Replace original with cleaned version
fs.writeFileSync(inputPath, JSON.stringify(data, null, 2))

console.log('\n✅ Database cleanup completed!')
console.log(`📊 Original programs: ${originalCount}`)
console.log(`✅ Valid programs: ${validPrograms.length}`)
console.log(`❌ Removed programs: ${removedCount}`)
console.log(`💾 Backup saved: ${path.basename(backupPath)}`)
console.log(`📝 Cleaned data saved: inputdata.json`)
console.log(`📝 Copy saved: inputdata-cleaned.json`)

console.log('\n🔧 Cleanup summary:')
console.log('- Fixed date formatting and validation')
console.log('- Implemented proper grade level ranges')
console.log('- Cleaned organization names')
console.log('- Validated cost categories')
console.log('- Standardized prestige levels')
console.log('- Cleaned location data')
console.log('- Validated website URLs')
console.log('- Removed invalid/incomplete entries')
