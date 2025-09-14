#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Direct PostgreSQL connection
const client = new Client({
  connectionString: 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTablesAndPopulateData() {
  console.log('🚀 Starting Direct PostgreSQL Database Setup...\n');

  try {
    // Connect to database
    console.log('📡 Connecting to PostgreSQL...');
    await client.connect();
    console.log('✅ Connected successfully!');

    // Step 1: Create the programs table
    console.log('\n🏗️ Creating programs table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS programs (
        id SERIAL PRIMARY KEY,
        program_name VARCHAR(255) NOT NULL,
        organization VARCHAR(255),
        description TEXT,
        cost_category VARCHAR(50),
        program_type VARCHAR(100),
        subject_area VARCHAR(100),
        grade_level INTEGER,
        duration_weeks INTEGER,
        location_state VARCHAR(50),
        location_city VARCHAR(100),
        application_deadline DATE,
        selectivity_percent INTEGER,
        financial_aid TEXT,
        citizenship_required VARCHAR(50),
        special_eligibility TEXT,
        website VARCHAR(255),
        key_benefits TEXT,
        application_requirements TEXT,
        residential_day VARCHAR(50),
        source VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ Programs table created successfully!');

    // Step 2: Enable RLS and create policies
    console.log('\n🔒 Setting up Row Level Security...');
    
    const rlsSQL = `
      ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Allow public read access" ON programs;
      CREATE POLICY "Allow public read access" ON programs FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Allow authenticated insert" ON programs;
      CREATE POLICY "Allow authenticated insert" ON programs FOR INSERT WITH CHECK (true);
      
      DROP POLICY IF EXISTS "Allow authenticated update" ON programs;
      CREATE POLICY "Allow authenticated update" ON programs FOR UPDATE USING (true);
    `;

    await client.query(rlsSQL);
    console.log('✅ RLS policies created successfully!');

    // Step 3: Create indexes for better performance
    console.log('\n📊 Creating indexes...');
    
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(program_name);
      CREATE INDEX IF NOT EXISTS idx_programs_cost_category ON programs(cost_category);
      CREATE INDEX IF NOT EXISTS idx_programs_program_type ON programs(program_type);
      CREATE INDEX IF NOT EXISTS idx_programs_grade_level ON programs(grade_level);
      CREATE INDEX IF NOT EXISTS idx_programs_location ON programs(location_city, location_state);
      CREATE INDEX IF NOT EXISTS idx_programs_deadline ON programs(application_deadline);
      CREATE INDEX IF NOT EXISTS idx_programs_selectivity ON programs(selectivity_percent);
    `;

    await client.query(indexSQL);
    console.log('✅ Indexes created successfully!');

    // Step 4: Check if data already exists
    console.log('\n📋 Checking existing data...');
    const countResult = await client.query('SELECT COUNT(*) FROM programs');
    const existingCount = parseInt(countResult.rows[0].count);
    console.log('📊 Found ' + existingCount + ' existing records');

    if (existingCount > 0) {
      console.log('⚠️ Data already exists. Skipping data import.');
      console.log('🔗 View your data: https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw/editor');
      return;
    }

    // Step 5: Load and insert JSON data
    console.log('\n📂 Loading program data from JSON...');
    const jsonPath = path.join(__dirname, '..', 'docs', 'inputdata.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ JSON file not found:', jsonPath);
      return;
    }

    const jsonFileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const jsonData = jsonFileData.programs || jsonFileData; // Handle both formats
    console.log('✅ Loaded ' + jsonData.length + ' programs from JSON');

    // Step 6: Transform and insert data
    console.log('\n🔄 Inserting data...');
    
    let insertedCount = 0;
    const batchSize = 100;

    for (let i = 0; i < jsonData.length; i += batchSize) {
      const batch = jsonData.slice(i, i + batchSize);
      
      const batchNum = Math.floor(i/batchSize) + 1;
      const totalBatches = Math.ceil(jsonData.length/batchSize);
      console.log('📤 Processing batch ' + batchNum + '/' + totalBatches + ' (' + batch.length + ' records)...');
      
      // Prepare batch insert
      const values = [];
      const placeholders = [];
      let paramIndex = 1;

      batch.forEach((program, batchIndex) => {
        const rowPlaceholders = [];
        
        // Add values in the correct order
        values.push(
          program.program_name || program.name || ('Program ' + (i + batchIndex + 1)),
          program.organization || program.host_organization || null,
          program.description || program.program_description || null,
          program.cost_category || program.cost || null,
          program.program_type || program.type || null,
          program.subject_area || program.focus_area || null,
          (() => {
            const grade = parseInt(program.grade_level);
            return isNaN(grade) ? null : grade;
          })(),
          (() => {
            const weeks = parseInt(program.duration_weeks);
            return isNaN(weeks) ? null : weeks;
          })(),
          program.location_state || program.state || null,
          program.location_city || program.city || null,
          (() => {
            const deadline = program.application_deadline;
            if (!deadline || deadline === 'Varies by school' || deadline === 'Rolling' || deadline === 'TBD' || deadline === 'N/A') {
              return null;
            }
            try {
              const date = new Date(deadline);
              return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
            } catch {
              return null;
            }
          })(),
          (() => {
            const selectivity = parseInt(program.selectivity_percent);
            return isNaN(selectivity) ? null : selectivity;
          })(),
          program.financial_aid || program.aid_available || null,
          program.citizenship_required || program.citizenship || null,
          program.special_eligibility || program.eligibility || null,
          program.website || program.url || null,
          program.key_benefits || program.benefits || null,
          program.application_requirements || program.requirements || null,
          program.residential_day || program.format || null,
          program.source || 'JSON_IMPORT'
        );

        // Create placeholders for this row
        for (let j = 0; j < 20; j++) {
          rowPlaceholders.push('$' + paramIndex++);
        }
        
        placeholders.push('(' + rowPlaceholders.join(', ') + ')');
      });

      const insertSQL = `
        INSERT INTO programs (
          program_name, organization, description, cost_category, program_type,
          subject_area, grade_level, duration_weeks, location_state, location_city,
          application_deadline, selectivity_percent, financial_aid, citizenship_required,
          special_eligibility, website, key_benefits, application_requirements,
          residential_day, source
        ) VALUES ` + placeholders.join(', ');

      try {
        const result = await client.query(insertSQL, values);
        insertedCount += result.rowCount;
        console.log('✅ Batch inserted: ' + result.rowCount + ' records');
      } catch (error) {
        console.log('❌ Error inserting batch:', error.message);
        console.log('🔍 First few values:', values.slice(0, 5));
        break;
      }
    }

    console.log('\n🎉 Database setup completed!');
    console.log('📊 Total records inserted: ' + insertedCount);
    console.log('🔗 View your data: https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw/editor');

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('🔍 Full error:', error);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
createTablesAndPopulateData();