#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function setupSupabase() {
    console.log('🚀 Supabase Setup for Ethiopian Community Resources\n');
    
    console.log('Please provide your Supabase project details:');
    console.log('(You can find these in your Supabase dashboard > Settings > API)\n');
    
    const supabaseUrl = await question('Supabase Project URL: ');
    const supabaseAnonKey = await question('Supabase Anon Key: ');
    const supabaseServiceKey = await question('Supabase Service Role Key (optional): ');
    
    console.log('\nGoogle OAuth Setup (optional):');
    const googleClientId = await question('Google Client ID (optional): ');
    const googleClientSecret = await question('Google Client Secret (optional): ');
    
    const sessionSecret = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const envContent = `# Supabase Configuration
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}
USE_SUPABASE=true

# Google OAuth Configuration
GOOGLE_CLIENT_ID=${googleClientId}
GOOGLE_CLIENT_SECRET=${googleClientSecret}

# Session Configuration
SESSION_SECRET=${sessionSecret}

# Environment
NODE_ENV=development
PORT=3000

# Frontend URLs
FRONTEND_URL=http://localhost:3000
CALLBACK_URL=http://localhost:3000/auth/google/callback
`;

    fs.writeFileSync('.env', envContent);
    console.log('\n✅ .env file created successfully!');
    
    console.log('\n📋 Next steps:');
    console.log('1. Run: npm run migrate:supabase (to create database tables)');
    console.log('2. Run: npm run setup:supabase (to migrate data)');
    console.log('3. Run: npm start (to start with Supabase)');
    
    rl.close();
}

if (require.main === module) {
    setupSupabase().catch(console.error);
}

module.exports = { setupSupabase };

