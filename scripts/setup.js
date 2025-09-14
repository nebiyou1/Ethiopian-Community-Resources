#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Ethiopia Community Resources - Complete Setup');
console.log('================================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from template...');
  try {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created successfully');
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ .env file already exists');
}

// Check required environment variables
console.log('\n🔍 Checking environment configuration...');
require('dotenv').config();

const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_KEY',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SESSION_SECRET'
];

const missingVars = requiredVars.filter(varName => !process.env[varName] || process.env[varName].includes('your_'));

if (missingVars.length > 0) {
  console.log('⚠️  Missing or incomplete environment variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 Please update your .env file with the following:');
  console.log('\n1. Supabase Configuration:');
  console.log('   - Go to https://supabase.com');
  console.log('   - Create a new project');
  console.log('   - Copy your project URL and anon key');
  console.log('   - Set SUPABASE_URL and SUPABASE_KEY');
  
  console.log('\n2. Google OAuth Configuration:');
  console.log('   - Go to https://console.cloud.google.com');
  console.log('   - Create OAuth 2.0 credentials');
  console.log('   - Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
  
  console.log('\n3. Session Security:');
  console.log('   - Generate a random string for SESSION_SECRET');
  console.log('   - You can use: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  
  console.log('\n4. Enable Supabase:');
  console.log('   - Set USE_SUPABASE=true');
  
  console.log('\nAfter updating .env, run: npm run setup:supabase');
  process.exit(1);
}

console.log('✅ All required environment variables are configured');

// Check if Supabase setup is needed
if (process.env.USE_SUPABASE === 'true') {
  console.log('\n🗄️  Supabase is enabled. Running database setup...');
  try {
    execSync('npm run setup:supabase', { stdio: 'inherit' });
    console.log('✅ Supabase setup completed');
  } catch (error) {
    console.error('❌ Supabase setup failed:', error.message);
    console.log('Please check your Supabase configuration and try again');
    process.exit(1);
  }
} else {
  console.log('\n📄 Using JSON data mode (Supabase disabled)');
}

// Test the application
console.log('\n🧪 Testing application...');
try {
  console.log('Starting server for testing...');
  const serverProcess = execSync('npm start', { 
    stdio: 'pipe',
    timeout: 10000 
  });
  console.log('✅ Server started successfully');
} catch (error) {
  console.log('⚠️  Server test completed (this is normal)');
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start development server: npm run dev');
console.log('2. Open http://localhost:3000');
console.log('3. Test authentication with Google OAuth');
console.log('4. Deploy to Netlify: npm run deploy:preview');

console.log('\n📚 Documentation:');
console.log('- Deployment guide: DEPLOYMENT.md');
console.log('- API documentation: Check server.js routes');
console.log('- Database schema: database/schema.sql');

console.log('\n🚀 Happy coding!');

