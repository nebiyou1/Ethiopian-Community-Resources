#!/usr/bin/env node

/**
 * Fix Grade Level Data Migration Script
 * Converts single grade levels to proper ranges
 */

const { Pool } = require('pg');
const fs = require('fs');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres'
});

// Grade level mapping - convert single grades to ranges
const gradeLevelMapping = {
  '9': { min: 9, max: 9 },
  '10': { min: 10, max: 10 },
  '11': { min: 11, max: 11 },
  '12': { min: 12, max: 12 },
  'High School': { min: 9, max: 12 },
  'Middle School': { min: 6, max: 8 },
  'Elementary': { min: 1, max: 5 },
  'College': { min: 13, max: 16 }, // Assuming college years
  'Graduate': { min: 17, max: 20 },
  'All Grades': { min: 1, max: 20 },
  '9-12': { min: 9, max: 12 },
  '10-12': { min: 10, max: 12 },
  '11-12': { min: 11, max: 12 },
  '6-12': { min: 6, max: 12 },
  'K-12': { min: 0, max: 12 },
};

async function fixGradeLevels() {
  console.log('🔧 Starting grade level data migration...');
  
  try {
    // First, let's check what grade level data we currently have
    const checkQuery = `
      SELECT 
        pa.program_id,
        p.name as program_name,
        COALESCE(pa.value_string, pa.value_integer::text, pa.value_decimal::text) as grade_value,
        ad.name as attribute_name
      FROM program_attributes pa
      JOIN attribute_definitions ad ON pa.attribute_definition_id = ad.id
      JOIN programs p ON pa.program_id = p.id
      WHERE ad.name IN ('grade_level_min', 'grade_level_max', 'grade_level')
      ORDER BY p.name;
    `;
    
    const existingData = await pool.query(checkQuery);
    console.log(`📊 Found ${existingData.rows.length} grade level records`);
    
    // Group by program
    const programsByGrade = {};
    existingData.rows.forEach(row => {
      if (!programsByGrade[row.program_id]) {
        programsByGrade[row.program_id] = {
          program_name: row.program_name,
          attributes: {}
        };
      }
      programsByGrade[row.program_id].attributes[row.attribute_name] = row.grade_value;
    });
    
    console.log(`📋 Processing ${Object.keys(programsByGrade).length} programs...`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const [programId, programData] of Object.entries(programsByGrade)) {
      try {
        const { attributes } = programData;
        
        // Determine grade range
        let gradeMin = null;
        let gradeMax = null;
        
        // Check if we already have min/max
        if (attributes.grade_level_min && attributes.grade_level_max) {
          gradeMin = parseInt(attributes.grade_level_min);
          gradeMax = parseInt(attributes.grade_level_max);
        } else if (attributes.grade_level) {
          // Convert single grade or range to min/max
          const gradeValue = attributes.grade_level.toString();
          const mapping = gradeLevelMapping[gradeValue];
          
          if (mapping) {
            gradeMin = mapping.min;
            gradeMax = mapping.max;
          } else {
            // Try to parse as number
            const numGrade = parseInt(gradeValue);
            if (!isNaN(numGrade)) {
              gradeMin = numGrade;
              gradeMax = numGrade;
            } else {
              console.log(`⚠️  Unknown grade format: ${gradeValue} for program: ${programData.program_name}`);
              continue;
            }
          }
        }
        
        if (gradeMin !== null && gradeMax !== null) {
          // Update or insert grade level attributes
          await pool.query(`
            INSERT INTO program_attributes (program_id, attribute_definition_id, value_integer, created_at, updated_at)
            SELECT 
              $1,
              (SELECT id FROM attribute_definitions WHERE name = 'grade_level_min'),
              $2,
              NOW(),
              NOW()
            ON CONFLICT (program_id, attribute_definition_id) 
            DO UPDATE SET 
              value_integer = EXCLUDED.value_integer,
              updated_at = NOW()
          `, [programId, gradeMin]);
          
          await pool.query(`
            INSERT INTO program_attributes (program_id, attribute_definition_id, value_integer, created_at, updated_at)
            SELECT 
              $1,
              (SELECT id FROM attribute_definitions WHERE name = 'grade_level_max'),
              $2,
              NOW(),
              NOW()
            ON CONFLICT (program_id, attribute_definition_id) 
            DO UPDATE SET 
              value_integer = EXCLUDED.value_integer,
              updated_at = NOW()
          `, [programId, gradeMax]);
          
          // Remove old single grade_level attribute if it exists
          await pool.query(`
            DELETE FROM program_attributes 
            WHERE program_id = $1 
            AND attribute_definition_id = (SELECT id FROM attribute_definitions WHERE name = 'grade_level')
          `, [programId]);
          
          updatedCount++;
          console.log(`✅ Updated ${programData.program_name}: Grade ${gradeMin}-${gradeMax}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing program ${programData.program_name}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n📈 Migration Summary:`);
    console.log(`✅ Successfully updated: ${updatedCount} programs`);
    console.log(`❌ Errors: ${errorCount} programs`);
    
    // Verify the results
    const verifyQuery = `
      SELECT 
        p.name as program_name,
        pa_min.value_integer as grade_min,
        pa_max.value_integer as grade_max
      FROM programs p
      JOIN program_attributes pa_min ON p.id = pa_min.program_id
      JOIN program_attributes pa_max ON p.id = pa_max.program_id
      JOIN attribute_definitions ad_min ON pa_min.attribute_definition_id = ad_min.id
      JOIN attribute_definitions ad_max ON pa_max.attribute_definition_id = ad_max.id
      WHERE ad_min.name = 'grade_level_min' 
      AND ad_max.name = 'grade_level_max'
      ORDER BY p.name
      LIMIT 10;
    `;
    
    const verifyResults = await pool.query(verifyQuery);
    console.log(`\n🔍 Sample results:`);
    verifyResults.rows.forEach(row => {
      console.log(`   ${row.program_name}: Grade ${row.grade_min}-${row.grade_max}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
if (require.main === module) {
  fixGradeLevels()
    .then(() => {
      console.log('🎉 Grade level migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { fixGradeLevels };
