#!/usr/bin/env node

const SupabaseMigration = require('../services/supabaseMigration');
require('dotenv').config();

async function setupSupabase() {
  console.log('🚀 Setting up Supabase for Ethiopia Community Resources...');
  
  try {
    // Check if Supabase is configured
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      console.error('❌ Supabase configuration missing!');
      console.log('Please set SUPABASE_URL and SUPABASE_KEY in your .env file');
      console.log('You can get these from your Supabase project dashboard');
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

    // Run full migration
    console.log('📊 Starting database migration...');
    const result = await migration.runFullMigration();
    
    console.log('✅ Supabase setup completed successfully!');
    console.log(`📈 Migration results:`);
    console.log(`   - Programs processed: ${result.processed}`);
    console.log(`   - Programs created: ${result.created}`);
    console.log(`   - Programs failed: ${result.failed}`);
    
    console.log('\n🎉 Your Supabase database is ready!');
    console.log('You can now set USE_SUPABASE=true in your .env file to use Supabase.');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSupabase();
}

module.exports = setupSupabase;

