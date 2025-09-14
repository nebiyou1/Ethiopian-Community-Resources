#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

class SchemaMigrator {
  constructor() {
    this.migrationResults = {
      tablesCreated: 0,
      dataTransferred: 0,
      errors: []
    };
  }

  async migrate() {
    console.log('🚀 Starting migration to dynamic schema...\n');

    try {
      await client.connect();
      console.log('✅ Connected to database');

      // Step 1: Backup existing data
      console.log('\n📋 Step 1: Backing up existing data...');
      const existingPrograms = await this.backupExistingData();
      console.log(`✅ Backed up ${existingPrograms.length} programs`);

      // Step 2: Drop existing tables (careful!)
      console.log('\n🗑️  Step 2: Dropping old schema...');
      await this.dropOldSchema();
      console.log('✅ Old schema dropped');

      // Step 3: Create new dynamic schema
      console.log('\n🏗️  Step 3: Creating new dynamic schema...');
      await this.createNewSchema();
      console.log('✅ New schema created');

      // Step 4: Migrate data to new schema
      console.log('\n📦 Step 4: Migrating data to new schema...');
      await this.migrateData(existingPrograms);
      console.log(`✅ Migrated ${existingPrograms.length} programs`);

      // Step 5: Validate migration
      console.log('\n🔍 Step 5: Validating migration...');
      await this.validateMigration();
      console.log('✅ Migration validated');

      console.log('\n🎉 Migration completed successfully!');
      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      console.error('Stack trace:', error.stack);
    } finally {
      await client.end();
    }
  }

  async backupExistingData() {
    const result = await client.query('SELECT * FROM programs ORDER BY id');
    
    // Save backup to file
    const backupPath = path.join(__dirname, '..', 'backup-programs.json');
    fs.writeFileSync(backupPath, JSON.stringify(result.rows, null, 2));
    console.log(`💾 Backup saved to: ${backupPath}`);
    
    return result.rows;
  }

  async dropOldSchema() {
    const dropQueries = [
      'DROP TABLE IF EXISTS programs CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS program_categories CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS user_favorites CASCADE',
      'DROP TABLE IF EXISTS user_applications CASCADE',
      'DROP TABLE IF EXISTS program_reviews CASCADE',
      'DROP TABLE IF EXISTS organizations CASCADE',
      'DROP TABLE IF EXISTS program_organizations CASCADE',
      'DROP TABLE IF EXISTS community_events CASCADE',
      'DROP TABLE IF EXISTS data_imports CASCADE'
    ];

    for (const query of dropQueries) {
      try {
        await client.query(query);
        console.log(`  ✅ ${query.split(' ')[4]} dropped`);
      } catch (error) {
        console.log(`  ⚠️  ${query.split(' ')[4]} not found (OK)`);
      }
    }
  }

  async createNewSchema() {
    const schemaPath = path.join(__dirname, '..', 'database', 'dynamic-schema-v2.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('COMMENT'));

    console.log(`  📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await client.query(statement + ';');
        
        // Log major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          console.log(`    ✅ Created table: ${tableName}`);
          this.migrationResults.tablesCreated++;
        } else if (statement.includes('CREATE INDEX')) {
          const indexName = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          console.log(`    📊 Created index: ${indexName}`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO (\w+)/i)?.[1];
          console.log(`    📥 Inserted data into: ${tableName}`);
        }
      } catch (error) {
        console.error(`    ❌ Error in statement ${i + 1}:`, error.message);
        console.error(`    Statement: ${statement.substring(0, 100)}...`);
        this.migrationResults.errors.push({
          statement: i + 1,
          error: error.message,
          sql: statement.substring(0, 200)
        });
      }
    }
  }

  async migrateData(oldPrograms) {
    console.log(`  📊 Processing ${oldPrograms.length} programs...`);
    
    let migratedCount = 0;
    
    for (const oldProgram of oldPrograms) {
      try {
        // Step 1: Create or find organization
        const organizationId = await this.createOrganization(oldProgram);
        
        // Step 2: Create program
        const programId = await this.createProgram(oldProgram, organizationId);
        
        // Step 3: Add program attributes
        await this.addProgramAttributes(oldProgram, programId);
        
        // Step 4: Add categories
        await this.addProgramCategories(oldProgram, programId);
        
        migratedCount++;
        
        if (migratedCount % 20 === 0) {
          console.log(`    📈 Migrated ${migratedCount}/${oldPrograms.length} programs...`);
        }
        
      } catch (error) {
        console.error(`    ❌ Error migrating ${oldProgram.program_name}:`, error.message);
        this.migrationResults.errors.push({
          program: oldProgram.program_name,
          error: error.message
        });
      }
    }
    
    this.migrationResults.dataTransferred = migratedCount;
    console.log(`  ✅ Successfully migrated ${migratedCount} programs`);
  }

  async createOrganization(program) {
    // Extract organization name (use a default if missing)
    let orgName = program.organization || 'Unknown Organization';
    
    // Map some common organization names
    const orgMappings = {
      'Fred Hutch SHIP': 'Fred Hutchinson Cancer Research Center',
      'All Star Code': 'All Star Code',
      'Code Nation': 'Code Nation',
      'AI4ALL': 'AI4ALL',
      'MIT MITES': 'Massachusetts Institute of Technology',
      'Stanford AI4ALL': 'Stanford University',
      'Harvard Secondary School Program': 'Harvard University',
      'Yale Young Global Scholars': 'Yale University',
      'Columbia Summer Immersion': 'Columbia University',
      'Johns Hopkins CTY': 'Johns Hopkins University',
      'Carnegie Mellon SAMS': 'Carnegie Mellon University',
      'Duke TIP': 'Duke University',
      'Northwestern CTD': 'Northwestern University',
      'Brown Pre-College': 'Brown University',
      'Cornell Summer College': 'Cornell University'
    };
    
    if (orgMappings[program.program_name]) {
      orgName = orgMappings[program.program_name];
    }
    
    // Create slug from name
    const slug = orgName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Check if organization already exists
    const existingOrg = await client.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [slug]
    );
    
    if (existingOrg.rows.length > 0) {
      return existingOrg.rows[0].id;
    }
    
    // Create new organization
    const orgResult = await client.query(`
      INSERT INTO organizations (
        name, slug, type, website, city, state_province, country,
        verification_status, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      orgName,
      slug,
      this.determineOrgType(orgName),
      program.website || null,
      program.location_city || null,
      program.location_state || null,
      'USA',
      'pending',
      true
    ]);
    
    return orgResult.rows[0].id;
  }

  determineOrgType(orgName) {
    const name = orgName.toLowerCase();
    if (name.includes('university') || name.includes('college') || name.includes('institute')) {
      return 'university';
    } else if (name.includes('government') || name.includes('state') || name.includes('federal')) {
      return 'government';
    } else if (name.includes('foundation') || name.includes('nonprofit')) {
      return 'nonprofit';
    } else {
      return 'organization';
    }
  }

  async createProgram(oldProgram, organizationId) {
    // Create program slug
    const slug = oldProgram.program_name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    // Determine program type
    const programType = this.determineProgramType(oldProgram);
    
    // Determine target audience
    const targetAudience = this.determineTargetAudience(oldProgram);
    
    // Determine selectivity tier
    const selectivityTier = this.determineSelectivityTier(oldProgram);
    
    const programResult = await client.query(`
      INSERT INTO programs (
        organization_id, name, slug, description, short_description,
        program_type, target_audience, selectivity_tier,
        estimated_acceptance_rate, status, data_source
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `, [
      organizationId,
      oldProgram.program_name,
      slug,
      oldProgram.description || null,
      oldProgram.description ? oldProgram.description.substring(0, 500) : null,
      programType,
      targetAudience,
      selectivityTier,
      oldProgram.selectivity_percent || null,
      'active',
      'migration_v1'
    ]);
    
    return programResult.rows[0].id;
  }

  determineProgramType(program) {
    const name = program.program_name.toLowerCase();
    const type = (program.program_type || '').toLowerCase();
    
    if (name.includes('scholarship') || type.includes('scholarship')) {
      return 'scholarship';
    } else if (name.includes('internship') || type.includes('internship')) {
      return 'internship';
    } else if (name.includes('camp') || type.includes('camp')) {
      return 'camp';
    } else if (name.includes('summer') || type.includes('summer')) {
      return 'summer_program';
    } else {
      return 'program';
    }
  }

  determineTargetAudience(program) {
    const grade = program.grade_level;
    if (grade && grade <= 8) {
      return 'middle_school';
    } else if (grade && grade <= 12) {
      return 'high_school';
    } else {
      return 'high_school'; // Default assumption
    }
  }

  determineSelectivityTier(program) {
    const selectivity = program.selectivity_percent;
    if (!selectivity) return 'open';
    
    if (selectivity <= 10) return 'elite';
    else if (selectivity <= 25) return 'highly_selective';
    else if (selectivity <= 50) return 'selective';
    else return 'open';
  }

  async addProgramAttributes(oldProgram, programId) {
    const attributes = [
      { name: 'cost_category', value: oldProgram.cost_category, type: 'string' },
      { name: 'grade_level_min', value: oldProgram.grade_level, type: 'integer' },
      { name: 'grade_level_max', value: oldProgram.grade_level, type: 'integer' },
      { name: 'duration_weeks', value: oldProgram.duration_weeks, type: 'integer' },
      { name: 'financial_aid_available', value: oldProgram.financial_aid ? true : false, type: 'boolean' },
      { name: 'citizenship_required', value: oldProgram.citizenship_required, type: 'string' },
      { name: 'application_requirements', value: oldProgram.application_requirements, type: 'string' },
      { name: 'key_benefits', value: oldProgram.key_benefits, type: 'string' },
      { name: 'residential_status', value: oldProgram.residential_day, type: 'string' }
    ];

    for (const attr of attributes) {
      if (attr.value !== null && attr.value !== undefined && attr.value !== '') {
        try {
          // Get attribute definition ID
          const attrDef = await client.query(
            'SELECT id FROM attribute_definitions WHERE name = $1',
            [attr.name]
          );
          
          if (attrDef.rows.length > 0) {
            const valueColumn = `value_${attr.type}`;
            
            await client.query(`
              INSERT INTO program_attributes (program_id, attribute_definition_id, ${valueColumn})
              VALUES ($1, $2, $3)
              ON CONFLICT (program_id, attribute_definition_id) DO NOTHING
            `, [programId, attrDef.rows[0].id, attr.value]);
          }
        } catch (error) {
          console.error(`    ⚠️  Error adding attribute ${attr.name}:`, error.message);
        }
      }
    }
  }

  async addProgramCategories(oldProgram, programId) {
    const categories = [];
    
    // Map subject areas to categories
    if (oldProgram.subject_area) {
      const subjectMap = {
        'Computer_Science': 'computer-science',
        'Mathematics': 'mathematics',
        'Engineering': 'engineering',
        'STEM': 'stem',
        'Leadership': 'leadership',
        'Business': 'business'
      };
      
      const categorySlug = subjectMap[oldProgram.subject_area];
      if (categorySlug) {
        categories.push(categorySlug);
      }
    }
    
    // Add demographic categories based on target audience
    if (oldProgram.grade_level && oldProgram.grade_level <= 12) {
      categories.push('high-school');
    }
    
    // Add categories to program
    for (const categorySlug of categories) {
      try {
        const category = await client.query(
          'SELECT id FROM categories WHERE slug = $1',
          [categorySlug]
        );
        
        if (category.rows.length > 0) {
          await client.query(`
            INSERT INTO program_categories (program_id, category_id, is_primary)
            VALUES ($1, $2, $3)
            ON CONFLICT (program_id, category_id) DO NOTHING
          `, [programId, category.rows[0].id, categories.indexOf(categorySlug) === 0]);
        }
      } catch (error) {
        console.error(`    ⚠️  Error adding category ${categorySlug}:`, error.message);
      }
    }
  }

  async validateMigration() {
    // Count records in new schema
    const counts = {};
    const tables = ['organizations', 'programs', 'program_attributes', 'program_categories'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
      console.log(`  📊 ${table}: ${counts[table]} records`);
    }
    
    // Basic validation checks
    if (counts.programs === 0) {
      throw new Error('No programs were migrated!');
    }
    
    if (counts.organizations === 0) {
      throw new Error('No organizations were created!');
    }
    
    console.log('  ✅ Migration validation passed');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`🏗️  Tables created: ${this.migrationResults.tablesCreated}`);
    console.log(`📦 Programs migrated: ${this.migrationResults.dataTransferred}`);
    console.log(`❌ Errors encountered: ${this.migrationResults.errors.length}`);
    
    if (this.migrationResults.errors.length > 0) {
      console.log('\n🔍 ERRORS:');
      this.migrationResults.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.program || error.statement}: ${error.error}`);
      });
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Update the database service to use the new schema');
    console.log('2. Update the API endpoints for the new structure');
    console.log('3. Test the frontend with the new data structure');
    console.log('4. Run data validation on the migrated data');
    
    console.log('\n✨ Migration completed successfully!');
  }
}

// Run migration
const migrator = new SchemaMigrator();
migrator.migrate();
