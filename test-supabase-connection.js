// Test Supabase connection and data
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qvqybobnsaikaknsdqhw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2cXlib2Juc2Fpa2FrbnNkcWh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTY0NjIsImV4cCI6MjA3MzM5MjQ2Mn0.nsNKVO_tfcQjTmz2xLhtjHW3Wdno_lob-3JnwqdWm8Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data: programs, error } = await supabase
      .from('programs')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return;
    }
    
    console.log('✅ Supabase connected successfully!');
    console.log(`📊 Found ${programs.length} programs in database`);
    
    if (programs.length > 0) {
      console.log('📋 Sample program:', programs[0]);
    } else {
      console.log('⚠️  No programs found in database');
    }
    
    // Test statistics
    const { data: allPrograms, error: statsError } = await supabase
      .from('programs')
      .select('*');
    
    if (!statsError && allPrograms) {
      console.log(`📈 Total programs: ${allPrograms.length}`);
      
      const orgs = new Set(allPrograms.map(p => p.organization));
      console.log(`🏢 Unique organizations: ${orgs.size}`);
      
      const types = {};
      allPrograms.forEach(p => {
        types[p.program_type] = (types[p.program_type] || 0) + 1;
      });
      console.log('📊 Program types:', types);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSupabaseConnection();
