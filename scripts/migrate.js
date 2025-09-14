#!/usr/bin/env node

const SupabaseMigration = require('../services/supabaseMigration');
require('dotenv').config();

async function migrateData() {
  console.log('🔄 Running Supabase data migration...');
  
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error('❌ Supabase configuration missing!');
      console.log('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
      process.exit(1);
    }

    const migration = new SupabaseMigration();
    
    // Test connection
    console.log('🔍 Testing Supabase connection...');
    const connected = await migration.checkConnection();
    
    if (!connected) {
      console.error('❌ Cannot connect to Supabase. Please check your configuration.');
      process.exit(1);
    }

    // Run migration
    console.log('📊 Starting data migration...');
    const result = await migration.runFullMigration();
    
    console.log('✅ Migration completed successfully!');
    console.log(`📈 Results:`);
    console.log(`   - Programs processed: ${result.processed}`);
    console.log(`   - Programs created: ${result.created}`);
    console.log(`   - Programs failed: ${result.failed}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateData();
}

module.exports = migrateData;

