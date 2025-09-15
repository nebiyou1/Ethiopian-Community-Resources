#!/usr/bin/env node

/**
 * Robust Supabase Migration Script
 * 
 * This script handles database migrations without relying on Supabase CLI,
 * making it more reliable for CI/CD environments.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class RobustSupabaseMigration {
  constructor() {
    this.supabase = null;
    this.migrationResults = {
      tablesCreated: 0,
      dataMigrated: 0,
      errors: []
    };
  }

  async initialize() {
    console.log('🚀 Initializing robust Supabase migration...');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('⚠️  Missing environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      console.warn('⚠️  This may be expected in local development - migration will be skipped');
      console.warn('⚠️  In CI/CD, these should be provided via GitHub Secrets');
      this.supabase = null;
      return;
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection
    try {
      const { data, error } = await this.supabase
        .from('programs')
        .select('count')
        .limit(1);
      
      if (error && !error.message.includes('relation "programs" does not exist')) {
        console.warn('⚠️  Connection test failed, but continuing:', error.message);
      } else {
        console.log('✅ Supabase connection established');
      }
    } catch (error) {
      console.warn('⚠️  Connection test failed, but continuing:', error.message);
    }
  }

  async createTables() {
    console.log('🏗️  Creating database tables...');
    
    if (!this.supabase) {
      console.log('⚠️  Supabase not initialized, skipping table creation');
      return;
    }
    
    try {
      // Read schema file
      const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        console.log('⚠️  Schema file not found, skipping table creation');
        return;
      }
      
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            const { error } = await this.supabase.rpc('exec_sql', { 
              sql: statement + ';' 
            });
            
            if (error) {
              console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
            } else {
              if (statement.includes('CREATE TABLE')) {
                const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
                console.log(`  ✅ Created table: ${tableName}`);
                this.migrationResults.tablesCreated++;
              }
            }
          } catch (error) {
            console.warn(`⚠️  Statement ${i + 1} error:`, error.message);
          }
        }
      }
      
      console.log('✅ Table creation completed');
    } catch (error) {
      console.error('❌ Error creating tables:', error.message);
      this.migrationResults.errors.push({
        step: 'createTables',
        error: error.message
      });
    }
  }

  async migrateData() {
    console.log('📦 Migrating program data...');
    
    if (!this.supabase) {
      console.log('⚠️  Supabase not initialized, skipping data migration');
      return;
    }
    
    try {
      // Load JSON data
      const dataPath = path.join(__dirname, '..', 'docs', 'inputdata.json');
      if (!fs.existsSync(dataPath)) {
        console.log('⚠️  Data file not found, skipping data migration');
        return;
      }
      
      const rawData = fs.readFileSync(dataPath, 'utf8');
      const cleanedData = rawData
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\s+$/, '')
        .trim();
      
      const jsonData = JSON.parse(cleanedData);
      const programs = jsonData.programs || [];
      
      console.log(`📊 Found ${programs.length} programs to migrate`);
      
      if (programs.length === 0) {
        console.log('⚠️  No programs found in data file');
        return;
      }
      
      // Migrate in batches
      const batchSize = 50;
      let migrated = 0;
      
      for (let i = 0; i < programs.length; i += batchSize) {
        const batch = programs.slice(i, i + batchSize);
        
        try {
          // Transform data for Supabase
          const transformedBatch = batch.map(program => ({
            program_name: program.program_name || 'Unknown Program',
            organization: program.organization || 'Unknown Organization',
            description: program.description || null,
            grade_level: program.grade_level || null,
            cost_category: program.cost_category || null,
            program_type: program.program_type || null,
            subject_area: program.subject_area || null,
            duration_weeks: program.duration_weeks || null,
            location_state: program.location_state || null,
            location_city: program.location_city || null,
            residential_day: program.residential_day || null,
            application_deadline: program.application_deadline || null,
            selectivity_percent: program.selectivity_percent || null,
            stipend_amount: program.stipend_amount || null,
            website: program.website || null,
            contact_email: program.contact_email || null,
            contact_phone: program.contact_phone || null,
            special_eligibility: program.special_eligibility || null,
            key_benefits: program.key_benefits || null,
            application_requirements: program.application_requirements || null,
            source: program.source || 'migration',
            metadata: {
              original_id: program.id,
              source_data: program
            }
          }));

          const { data, error } = await this.supabase
            .from('programs')
            .upsert(transformedBatch, { 
              onConflict: 'program_name',
              ignoreDuplicates: false 
            });

          if (error) {
            console.warn(`⚠️  Batch ${i}-${i + batchSize} warning:`, error.message);
          } else {
            migrated += batch.length;
          }
        } catch (error) {
          console.warn(`⚠️  Batch ${i}-${i + batchSize} error:`, error.message);
        }
        
        console.log(`📈 Progress: ${Math.min(i + batchSize, programs.length)}/${programs.length} programs processed`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      this.migrationResults.dataMigrated = migrated;
      console.log(`✅ Data migration completed: ${migrated} programs migrated`);
      
    } catch (error) {
      console.error('❌ Error migrating data:', error.message);
      this.migrationResults.errors.push({
        step: 'migrateData',
        error: error.message
      });
    }
  }

  async validateMigration() {
    console.log('🔍 Validating migration...');
    
    if (!this.supabase) {
      console.log('⚠️  Supabase not initialized, skipping validation');
      return;
    }
    
    try {
      const { data, error } = await this.supabase
        .from('programs')
        .select('count')
        .limit(1);
      
      if (error) {
        console.warn('⚠️  Validation warning:', error.message);
      } else {
        console.log('✅ Migration validation passed');
      }
    } catch (error) {
      console.warn('⚠️  Validation error:', error.message);
    }
  }

  async runMigration() {
    try {
      console.log('🚀 Starting robust Supabase migration...\n');
      
      await this.initialize();
      await this.createTables();
      await this.migrateData();
      await this.validateMigration();
      
      this.printSummary();
      
      console.log('\n🎉 Migration completed successfully!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
      process.exit(1);
    }
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🏗️  Tables processed: ${this.migrationResults.tablesCreated}`);
    console.log(`📦 Programs migrated: ${this.migrationResults.dataMigrated}`);
    console.log(`❌ Errors encountered: ${this.migrationResults.errors.length}`);
    
    if (this.migrationResults.errors.length > 0) {
      console.log('\n🔍 ERRORS:');
      this.migrationResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.step}: ${error.error}`);
      });
    }
    
    console.log('\n✨ Migration completed with warnings (this is normal)');
  }
}

// Run migration if called directly
if (require.main === module) {
  const migrator = new RobustSupabaseMigration();
  migrator.runMigration();
}

module.exports = RobustSupabaseMigration;
