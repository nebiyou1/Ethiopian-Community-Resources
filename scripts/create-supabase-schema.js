#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://qvqybobnsaikaknsdqhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAndPopulateDatabase() {
  console.log('🚀 Starting Supabase Database Setup...\n');

  try {
    // Step 1: Test connection
    console.log('📡 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('programs')
      .select('*')
      .limit(1);

    if (testError && testError.code === '42P01') {
      console.log('✅ Connection successful - tables need to be created');
    } else if (testError) {
      console.log('❌ Connection error:', testError.message);
      return;
    } else {
      console.log('✅ Connection successful - tables already exist');
      console.log('📊 Found', testData?.length || 0, 'existing records');
    }

    // Step 2: Load and migrate JSON data
    console.log('\n📂 Loading program data from JSON...');
    const jsonPath = path.join(__dirname, '..', 'docs', 'inputdata.json');
    
    if (!fs.existsSync(jsonPath)) {
      console.log('❌ JSON file not found:', jsonPath);
      return;
    }

    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ Loaded', jsonData.length, 'programs from JSON');

    // Step 3: Transform and insert data
    console.log('\n🔄 Transforming and inserting data...');
    
    const transformedPrograms = jsonData.map((program, index) => {
      // Transform the JSON data to match our schema
      return {
        program_name: program.program_name || program.name || `Program ${index + 1}`,
        organization: program.organization || program.host_organization,
        description: program.description || program.program_description,
        cost_category: program.cost_category || program.cost || 'UNKNOWN',
        program_type: program.program_type || program.type,
        subject_area: program.subject_area || program.focus_area,
        grade_level: program.grade_level ? parseInt(program.grade_level) : null,
        duration_weeks: program.duration_weeks ? parseInt(program.duration_weeks) : null,
        location_state: program.location_state || program.state,
        location_city: program.location_city || program.city,
        application_deadline: program.application_deadline ? new Date(program.application_deadline).toISOString().split('T')[0] : null,
        selectivity_percent: program.selectivity_percent ? parseInt(program.selectivity_percent) : null,
        financial_aid: program.financial_aid || program.aid_available,
        citizenship_required: program.citizenship_required || program.citizenship,
        special_eligibility: program.special_eligibility || program.eligibility,
        website: program.website || program.url,
        key_benefits: program.key_benefits || program.benefits,
        application_requirements: program.application_requirements || program.requirements,
        residential_day: program.residential_day || program.format,
        source: program.source || 'JSON_IMPORT'
      };
    });

    // Insert data in batches
    const batchSize = 50;
    let totalInserted = 0;
    
    for (let i = 0; i < transformedPrograms.length; i += batchSize) {
      const batch = transformedPrograms.slice(i, i + batchSize);
      
      console.log(`📤 Inserting batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transformedPrograms.length/batchSize)} (${batch.length} records)...`);
      
      const { data, error } = await supabase
        .from('programs')
        .insert(batch)
        .select('id');

      if (error) {
        console.log('❌ Error inserting batch:', error.message);
        console.log('🔍 Error details:', error);
        
        // If table doesn't exist, provide manual creation instructions
        if (error.code === '42P01') {
          console.log('\n🏗️ TABLE DOES NOT EXIST - Manual Creation Required');
          console.log('🔗 Please go to: https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw/sql');
          console.log('📝 Copy and paste this SQL:');
          console.log(`
CREATE TABLE programs (
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

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON programs FOR SELECT USING (true);
          `);
          return;
        }
        break;
      } else {
        totalInserted += data?.length || batch.length;
        console.log(`✅ Batch inserted successfully (${data?.length || batch.length} records)`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Database setup completed!`);
    console.log(`📊 Total records inserted: ${totalInserted}`);
    console.log(`🔗 View your data: https://supabase.com/dashboard/project/qvqybobnsaikaknsdqhw/editor`);

  } catch (error) {
    console.log('❌ Setup failed:', error.message);
    console.log('🔍 Full error:', error);
  }
}

// Run the setup
createAndPopulateDatabase();
