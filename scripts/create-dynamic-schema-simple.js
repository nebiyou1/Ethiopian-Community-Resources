#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function createDynamicSchema() {
  console.log('🚀 Creating Dynamic Schema...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Step 1: Backup existing data
    console.log('\n📋 Backing up existing data...');
    let existingPrograms = [];
    try {
      const result = await client.query('SELECT * FROM programs ORDER BY id');
      existingPrograms = result.rows;
      
      const backupPath = path.join(__dirname, '..', 'backup-programs-simple.json');
      fs.writeFileSync(backupPath, JSON.stringify(existingPrograms, null, 2));
      console.log(`💾 Backed up ${existingPrograms.length} programs to: ${backupPath}`);
    } catch (error) {
      console.log('⚠️  No existing programs table found (OK for fresh install)');
    }

    // Step 2: Drop existing tables
    console.log('\n🗑️  Dropping existing tables...');
    const dropTables = [
      'DROP TABLE IF EXISTS programs CASCADE',
      'DROP TABLE IF EXISTS organizations CASCADE',
      'DROP TABLE IF EXISTS categories CASCADE',
      'DROP TABLE IF EXISTS program_categories CASCADE',
      'DROP TABLE IF EXISTS attribute_definitions CASCADE',
      'DROP TABLE IF EXISTS program_attributes CASCADE',
      'DROP TABLE IF EXISTS organization_attributes CASCADE',
      'DROP TABLE IF EXISTS program_sessions CASCADE',
      'DROP TABLE IF EXISTS program_costs CASCADE',
      'DROP TABLE IF EXISTS users CASCADE',
      'DROP TABLE IF EXISTS user_favorites CASCADE',
      'DROP TABLE IF EXISTS program_reviews CASCADE',
      'DROP TABLE IF EXISTS data_sources CASCADE',
      'DROP TABLE IF EXISTS validation_rules CASCADE',
      'DROP TABLE IF EXISTS data_quality_issues CASCADE',
      'DROP TABLE IF EXISTS audit_log CASCADE'
    ];

    for (const dropSQL of dropTables) {
      try {
        await client.query(dropSQL);
        console.log(`  ✅ ${dropSQL.split(' ')[4]} dropped`);
      } catch (error) {
        console.log(`  ⚠️  ${dropSQL.split(' ')[4]} not found (OK)`);
      }
    }

    // Step 3: Enable extensions
    console.log('\n🔧 Enabling extensions...');
    const extensions = [
      'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
      'CREATE EXTENSION IF NOT EXISTS "pg_trgm"'
    ];

    for (const ext of extensions) {
      try {
        await client.query(ext);
        console.log(`  ✅ ${ext.split('"')[1]} enabled`);
      } catch (error) {
        console.log(`  ⚠️  Extension error: ${error.message}`);
      }
    }

    // Step 4: Create core tables
    console.log('\n🏗️  Creating core tables...');

    // Organizations table
    await client.query(`
      CREATE TABLE organizations (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'organization',
        website TEXT,
        email VARCHAR(255),
        phone VARCHAR(20),
        address_line1 TEXT,
        city VARCHAR(100),
        state_province VARCHAR(100),
        country VARCHAR(3) DEFAULT 'USA',
        postal_code VARCHAR(20),
        founded_year INTEGER,
        verification_status VARCHAR(20) DEFAULT 'pending',
        verification_date TIMESTAMP WITH TIME ZONE,
        trust_score DECIMAL(3,2) DEFAULT 0.00,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        search_vector tsvector,
        CONSTRAINT valid_trust_score CHECK (trust_score >= 0.00 AND trust_score <= 5.00)
      )
    `);
    console.log('  ✅ organizations table created');

    // Programs table
    await client.query(`
      CREATE TABLE programs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        description TEXT,
        short_description VARCHAR(500),
        program_type VARCHAR(50) NOT NULL DEFAULT 'program',
        target_audience VARCHAR(50) DEFAULT 'high_school',
        duration_type VARCHAR(20) DEFAULT 'weeks',
        duration_value INTEGER,
        is_recurring BOOLEAN DEFAULT false,
        application_process TEXT,
        selection_criteria TEXT,
        selectivity_tier VARCHAR(20) DEFAULT 'open',
        estimated_acceptance_rate DECIMAL(5,2),
        min_participants INTEGER,
        max_participants INTEGER,
        typical_participants INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        first_offered_year INTEGER,
        rating_average DECIMAL(3,2) DEFAULT 0.00,
        rating_count INTEGER DEFAULT 0,
        completion_rate DECIMAL(5,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_source VARCHAR(100),
        last_verified TIMESTAMP WITH TIME ZONE,
        search_vector tsvector,
        UNIQUE(organization_id, slug),
        CONSTRAINT valid_rating CHECK (rating_average >= 0.00 AND rating_average <= 5.00),
        CONSTRAINT valid_acceptance_rate CHECK (estimated_acceptance_rate >= 0.00 AND estimated_acceptance_rate <= 100.00)
      )
    `);
    console.log('  ✅ programs table created');

    // Attribute definitions table
    await client.query(`
      CREATE TABLE attribute_definitions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        display_name VARCHAR(150) NOT NULL,
        description TEXT,
        data_type VARCHAR(20) NOT NULL,
        is_required BOOLEAN DEFAULT false,
        is_searchable BOOLEAN DEFAULT true,
        is_filterable BOOLEAN DEFAULT true,
        max_length INTEGER,
        allowed_values TEXT[],
        min_value DECIMAL,
        max_value DECIMAL,
        input_type VARCHAR(30),
        placeholder_text VARCHAR(255),
        help_text TEXT,
        display_order INTEGER DEFAULT 0,
        category VARCHAR(50),
        applies_to VARCHAR(20) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('  ✅ attribute_definitions table created');

    // Program attributes table
    await client.query(`
      CREATE TABLE program_attributes (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        attribute_definition_id UUID NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
        value_string TEXT,
        value_integer INTEGER,
        value_decimal DECIMAL,
        value_boolean BOOLEAN,
        value_date DATE,
        value_timestamp TIMESTAMP WITH TIME ZONE,
        value_json JSONB,
        value_array TEXT[],
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(program_id, attribute_definition_id)
      )
    `);
    console.log('  ✅ program_attributes table created');

    // Categories table
    await client.query(`
      CREATE TABLE categories (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT,
        parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
        level INTEGER NOT NULL DEFAULT 0,
        path TEXT NOT NULL,
        category_type VARCHAR(30) NOT NULL,
        icon VARCHAR(50),
        color VARCHAR(7),
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        UNIQUE(slug, category_type)
      )
    `);
    console.log('  ✅ categories table created');

    // Program categories table
    await client.query(`
      CREATE TABLE program_categories (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
        category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        relevance_score DECIMAL(3,2) DEFAULT 1.00,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(program_id, category_id),
        CONSTRAINT valid_relevance CHECK (relevance_score >= 0.00 AND relevance_score <= 1.00)
      )
    `);
    console.log('  ✅ program_categories table created');

    // Users table (simplified for now)
    await client.query(`
      CREATE TABLE users (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        display_name VARCHAR(150),
        avatar_url TEXT,
        bio TEXT,
        community_affiliations TEXT[],
        languages_spoken TEXT[],
        city VARCHAR(100),
        state_province VARCHAR(100),
        country VARCHAR(3) DEFAULT 'USA',
        preferred_language VARCHAR(10) DEFAULT 'en',
        role VARCHAR(20) DEFAULT 'user',
        is_verified BOOLEAN DEFAULT false,
        trust_score DECIMAL(3,2) DEFAULT 0.00,
        last_login TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_active BOOLEAN DEFAULT true,
        CONSTRAINT valid_user_trust_score CHECK (trust_score >= 0.00 AND trust_score <= 5.00)
      )
    `);
    console.log('  ✅ users table created');

    // Step 5: Create indexes
    console.log('\n📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX idx_organizations_type ON organizations(type)',
      'CREATE INDEX idx_organizations_slug ON organizations(slug)',
      'CREATE INDEX idx_organizations_active ON organizations(is_active)',
      'CREATE INDEX idx_programs_organization ON programs(organization_id)',
      'CREATE INDEX idx_programs_type ON programs(program_type)',
      'CREATE INDEX idx_programs_status ON programs(status)',
      'CREATE INDEX idx_programs_slug ON programs(organization_id, slug)',
      'CREATE INDEX idx_program_attributes_program ON program_attributes(program_id)',
      'CREATE INDEX idx_program_attributes_definition ON program_attributes(attribute_definition_id)',
      'CREATE INDEX idx_categories_type ON categories(category_type)',
      'CREATE INDEX idx_categories_parent ON categories(parent_id)',
      'CREATE INDEX idx_program_categories_program ON program_categories(program_id)',
      'CREATE INDEX idx_program_categories_category ON program_categories(category_id)',
      'CREATE INDEX idx_users_email ON users(email)',
      'CREATE INDEX idx_users_active ON users(is_active)'
    ];

    for (const indexSQL of indexes) {
      try {
        await client.query(indexSQL);
        const indexName = indexSQL.match(/CREATE INDEX (\w+)/)[1];
        console.log(`  ✅ ${indexName} created`);
      } catch (error) {
        console.log(`  ❌ Index error: ${error.message}`);
      }
    }

    // Step 6: Insert default data
    console.log('\n📥 Inserting default data...');

    // Insert attribute definitions
    const attributeDefinitions = [
      ['cost_amount', 'Program Cost', 'Total cost of the program in USD', 'decimal', 'financial', 'programs'],
      ['cost_category', 'Cost Category', 'General cost category', 'string', 'financial', 'programs'],
      ['financial_aid_available', 'Financial Aid Available', 'Whether financial aid is offered', 'boolean', 'financial', 'programs'],
      ['grade_level_min', 'Minimum Grade Level', 'Minimum grade level for participants', 'integer', 'eligibility', 'programs'],
      ['grade_level_max', 'Maximum Grade Level', 'Maximum grade level for participants', 'integer', 'eligibility', 'programs'],
      ['citizenship_required', 'Citizenship Requirement', 'Citizenship or residency requirements', 'string', 'eligibility', 'programs'],
      ['application_requirements', 'Application Requirements', 'What is needed to apply', 'string', 'basic', 'programs'],
      ['key_benefits', 'Key Benefits', 'Main benefits of the program', 'string', 'basic', 'programs'],
      ['residential_status', 'Residential Status', 'Whether program is residential, day program, or hybrid', 'string', 'basic', 'programs'],
      ['duration_weeks', 'Duration in Weeks', 'Program duration in weeks', 'integer', 'basic', 'programs']
    ];

    for (const [name, displayName, description, dataType, category, appliesTo] of attributeDefinitions) {
      await client.query(`
        INSERT INTO attribute_definitions (name, display_name, description, data_type, category, applies_to)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (name) DO NOTHING
      `, [name, displayName, description, dataType, category, appliesTo]);
    }
    console.log('  ✅ Attribute definitions inserted');

    // Insert categories
    const categories = [
      ['STEM', 'stem', 'Science, Technology, Engineering, Mathematics', 'subject', 0, 'stem'],
      ['Computer Science', 'computer-science', 'Programming, software development, AI', 'subject', 1, 'stem.computer-science'],
      ['Mathematics', 'mathematics', 'Pure and applied mathematics', 'subject', 1, 'stem.mathematics'],
      ['Engineering', 'engineering', 'Various engineering disciplines', 'subject', 1, 'stem.engineering'],
      ['Liberal Arts', 'liberal-arts', 'Humanities, social sciences, arts', 'subject', 0, 'liberal-arts'],
      ['Business', 'business', 'Business, entrepreneurship, finance', 'subject', 0, 'business'],
      ['Leadership', 'leadership', 'Leadership development programs', 'subject', 0, 'leadership'],
      ['High School Students', 'high-school', 'Programs for high school students', 'demographic', 0, 'high-school'],
      ['College Students', 'college', 'Programs for college students', 'demographic', 0, 'college'],
      ['Ethiopian Community', 'ethiopian', 'Programs for Ethiopian community', 'demographic', 0, 'ethiopian'],
      ['Eritrean Community', 'eritrean', 'Programs for Eritrean community', 'demographic', 0, 'eritrean']
    ];

    for (const [name, slug, description, categoryType, level, path] of categories) {
      await client.query(`
        INSERT INTO categories (name, slug, description, category_type, level, path)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (slug, category_type) DO NOTHING
      `, [name, slug, description, categoryType, level, path]);
    }
    console.log('  ✅ Categories inserted');

    // Step 7: Migrate existing data if available
    if (existingPrograms.length > 0) {
      console.log(`\n📦 Migrating ${existingPrograms.length} existing programs...`);
      
      let migratedCount = 0;
      for (const oldProgram of existingPrograms) {
        try {
          // Create organization
          const orgName = oldProgram.organization || 'Unknown Organization';
          const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          
          let organizationId;
          const existingOrg = await client.query('SELECT id FROM organizations WHERE slug = $1', [orgSlug]);
          
          if (existingOrg.rows.length > 0) {
            organizationId = existingOrg.rows[0].id;
          } else {
            const orgResult = await client.query(`
              INSERT INTO organizations (name, slug, type, website, city, state_province)
              VALUES ($1, $2, $3, $4, $5, $6)
              RETURNING id
            `, [orgName, orgSlug, 'organization', oldProgram.website, oldProgram.location_city, oldProgram.location_state]);
            organizationId = orgResult.rows[0].id;
          }

          // Create program
          const programSlug = oldProgram.program_name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
          
          const programResult = await client.query(`
            INSERT INTO programs (
              organization_id, name, slug, description, program_type, 
              target_audience, data_source, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            organizationId,
            oldProgram.program_name,
            programSlug,
            oldProgram.description,
            oldProgram.program_type || 'program',
            'high_school',
            'migration_v1',
            'active'
          ]);
          
          const programId = programResult.rows[0].id;

          // Add attributes
          const attributes = [
            ['cost_category', oldProgram.cost_category, 'string'],
            ['grade_level_min', oldProgram.grade_level, 'integer'],
            ['duration_weeks', oldProgram.duration_weeks, 'integer'],
            ['citizenship_required', oldProgram.citizenship_required, 'string'],
            ['application_requirements', oldProgram.application_requirements, 'string'],
            ['key_benefits', oldProgram.key_benefits, 'string']
          ];

          for (const [attrName, value, type] of attributes) {
            if (value !== null && value !== undefined && value !== '') {
              const attrDef = await client.query('SELECT id FROM attribute_definitions WHERE name = $1', [attrName]);
              if (attrDef.rows.length > 0) {
                const valueColumn = `value_${type}`;
                await client.query(`
                  INSERT INTO program_attributes (program_id, attribute_definition_id, ${valueColumn})
                  VALUES ($1, $2, $3)
                  ON CONFLICT (program_id, attribute_definition_id) DO NOTHING
                `, [programId, attrDef.rows[0].id, value]);
              }
            }
          }

          migratedCount++;
          if (migratedCount % 20 === 0) {
            console.log(`  📈 Migrated ${migratedCount}/${existingPrograms.length} programs...`);
          }

        } catch (error) {
          console.log(`  ❌ Error migrating ${oldProgram.program_name}: ${error.message}`);
        }
      }
      
      console.log(`  ✅ Successfully migrated ${migratedCount} programs`);
    }

    // Step 8: Enable RLS
    console.log('\n🔒 Enabling Row Level Security...');
    await client.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY');
    await client.query(`
      CREATE POLICY "Organizations are publicly readable" ON organizations
      FOR SELECT USING (is_active = true)
    `);
    await client.query(`
      CREATE POLICY "Programs are publicly readable" ON programs
      FOR SELECT USING (status = 'active')
    `);
    console.log('  ✅ RLS policies created');

    // Step 9: Validate
    console.log('\n🔍 Validating schema...');
    const counts = {};
    const tables = ['organizations', 'programs', 'attribute_definitions', 'categories'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
      console.log(`  📊 ${table}: ${counts[table]} records`);
    }

    console.log('\n🎉 Dynamic schema created successfully!');
    console.log('\n📋 SUMMARY:');
    console.log(`  🏗️  Tables created: ${Object.keys(counts).length}`);
    console.log(`  🏢 Organizations: ${counts.organizations}`);
    console.log(`  📚 Programs: ${counts.programs}`);
    console.log(`  🏷️  Attributes: ${counts.attribute_definitions}`);
    console.log(`  📂 Categories: ${counts.categories}`);

  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
  }
}

// Run schema creation
createDynamicSchema();
