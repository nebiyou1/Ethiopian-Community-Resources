const { supabase } = require('../config/supabase');
const fs = require('fs');
const path = require('path');

class SupabaseMigration {
  constructor() {
    this.jsonData = null;
    this.loadJsonData();
  }

  loadJsonData() {
    try {
      const dataPath = path.join(__dirname, '../../docs/inputdata.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      
      // Clean the JSON data
      const cleanedData = rawData
        .replace(/,(\s*[}\]])/g, '$1')
        .replace(/\s+$/, '')
        .trim();
      
      this.jsonData = JSON.parse(cleanedData);
      console.log(`✅ Loaded ${this.jsonData.programs.length} programs from JSON`);
    } catch (error) {
      console.error('❌ Error loading JSON data:', error.message);
      throw error;
    }
  }

  async createTables() {
    console.log('🔄 Creating database tables...');
    
    try {
      // Read and execute schema
      const schemaPath = path.join(__dirname, '../../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      
      // Split schema into individual statements
      const statements = schema
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          if (error) {
            console.warn(`⚠️ Statement warning: ${error.message}`);
          }
        }
      }
      
      console.log('✅ Database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error.message);
      throw error;
    }
  }

  async migratePrograms() {
    console.log('🔄 Starting programs migration...');
    
    const programs = this.jsonData.programs;
    const batchSize = 50;
    let processed = 0;
    let created = 0;
    let failed = 0;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      
      try {
        // Transform data for Supabase
        const transformedBatch = batch.map(program => ({
          program_name: program.program_name,
          organization: program.organization,
          description: program.description,
          grade_level: program.grade_level,
          cost_category: program.cost_category,
          program_type: program.program_type,
          subject_area: program.subject_area,
          duration_weeks: program.duration_weeks,
          location_state: program.location_state,
          location_city: program.location_city,
          residential_day: program.residential_day,
          application_deadline: program.application_deadline,
          selectivity_percent: program.selectivity_percent,
          stipend_amount: program.stipend_amount,
          website: program.website,
          contact_email: program.contact_email,
          contact_phone: program.contact_phone,
          special_eligibility: program.special_eligibility,
          key_benefits: program.key_benefits,
          application_requirements: program.application_requirements,
          source: program.source,
          metadata: {
            original_id: program.id,
            source_data: program
          }
        }));

        const { data, error } = await supabase
          .from('programs')
          .insert(transformedBatch);

        if (error) {
          console.error(`❌ Batch ${i}-${i + batchSize} failed:`, error);
          failed += batch.length;
        } else {
          created += batch.length;
        }
      } catch (error) {
        console.error(`❌ Batch ${i}-${i + batchSize} failed:`, error);
        failed += batch.length;
      }

      processed += batch.length;
      console.log(`📊 Progress: ${processed}/${programs.length} programs processed`);
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`✅ Migration completed: ${created} created, ${failed} failed`);
    return { processed, created, failed };
  }

  async migrateCategories() {
    console.log('🔄 Migrating categories...');
    
    try {
      const categories = [
        // Cost categories
        { name: 'FREE', type: 'cost', description: 'Completely free programs', display_order: 1 },
        { name: 'FREE_PLUS_STIPEND', type: 'cost', description: 'Free programs with stipend', display_order: 2 },
        { name: 'FREE_PLUS_SCHOLARSHIP', type: 'cost', description: 'Free programs with scholarship', display_order: 3 },
        { name: 'FREE_TO_LOW', type: 'cost', description: 'Free to low cost programs', display_order: 4 },
        { name: 'FREE_TO_PAID', type: 'cost', description: 'Free to paid programs', display_order: 5 },
        { name: 'LOW_COST', type: 'cost', description: 'Low cost programs', display_order: 6 },
        { name: 'PAID', type: 'cost', description: 'Paid programs', display_order: 7 },
        
        // Program types
        { name: 'Summer_Program', type: 'program_type', description: 'Summer programs', display_order: 1 },
        { name: 'Competition', type: 'program_type', description: 'Competitions', display_order: 2 },
        { name: 'Multi_Year', type: 'program_type', description: 'Multi-year programs', display_order: 3 },
        { name: 'Year_Program', type: 'program_type', description: 'Year-long programs', display_order: 4 },
        { name: 'Online_Course', type: 'program_type', description: 'Online courses', display_order: 5 },
        { name: 'Conference', type: 'program_type', description: 'Conferences', display_order: 6 },
        { name: 'Hybrid_Program', type: 'program_type', description: 'Hybrid programs', display_order: 7 },
        { name: 'Scholarship', type: 'program_type', description: 'Scholarships', display_order: 8 },
        { name: 'Award', type: 'program_type', description: 'Awards', display_order: 9 },
        { name: 'Workshop', type: 'program_type', description: 'Workshops', display_order: 10 },
        { name: 'Camp', type: 'program_type', description: 'Camps', display_order: 11 }
      ];

      const { data, error } = await supabase
        .from('categories')
        .upsert(categories, { onConflict: 'name' });

      if (error) {
        console.error('❌ Categories migration failed:', error);
        throw error;
      }

      console.log('✅ Categories migrated successfully');
      return data;
    } catch (error) {
      console.error('❌ Error migrating categories:', error.message);
      throw error;
    }
  }

  async runFullMigration() {
    try {
      console.log('🚀 Starting full Supabase migration...');
      
      // Step 1: Create tables
      await this.createTables();
      
      // Step 2: Migrate categories
      await this.migrateCategories();
      
      // Step 3: Migrate programs
      const result = await this.migratePrograms();
      
      console.log('🎉 Full migration completed successfully!');
      return result;
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  }

  async checkConnection() {
    try {
      const { data, error } = await supabase
        .from('programs')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase connection failed:', error.message);
        return false;
      }
      
      console.log('✅ Supabase connection successful');
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
  }
}

module.exports = SupabaseMigration;

