#!/usr/bin/env node

/**
 * Netlify Functions Diagnostic Script
 * 
 * This script helps diagnose why Netlify functions aren't working
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class NetlifyDiagnostic {
  constructor() {
    this.siteUrl = 'https://ethiopian-community-resources.netlify.app';
    this.functions = [
      'test',
      'api-simple',
      'auth'
    ];
  }

  async testFunction(functionName) {
    const urls = [
      `https://ethiopian-community-resources.netlify.app/.netlify/functions/${functionName}`,
      `https://ethiopian-community-resources.netlify.app/api/${functionName}`,
      `https://ethiopian-community-resources.netlify.app/${functionName}`
    ];

    console.log(`\n🔍 Testing function: ${functionName}`);
    console.log('='.repeat(50));

    for (const url of urls) {
      try {
        const result = await this.makeRequest(url);
        console.log(`📡 ${url}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Success: ${result.success ? '✅' : '❌'}`);
        
        if (result.success) {
          console.log(`   Response: ${result.body.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`📡 ${url}`);
        console.log(`   Error: ${error.message}`);
      }
    }
  }

  async makeRequest(url) {
    return new Promise((resolve) => {
      const req = https.get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 400,
            status: res.statusCode,
            body: body
          });
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          status: 'ERROR',
          body: error.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          status: 'TIMEOUT',
          body: 'Request timeout'
        });
      });
    });
  }

  checkLocalFiles() {
    console.log('\n📁 Checking Local Function Files');
    console.log('='.repeat(50));
    
    const functionsDir = path.join(__dirname, '..', 'netlify', 'functions');
    
    if (!fs.existsSync(functionsDir)) {
      console.log('❌ Functions directory not found');
      return false;
    }
    
    console.log(`✅ Functions directory exists: ${functionsDir}`);
    
    const files = fs.readdirSync(functionsDir);
    console.log(`📄 Files in functions directory: ${files.join(', ')}`);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(functionsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        console.log(`\n📝 ${file}:`);
        console.log(`   Size: ${content.length} characters`);
        console.log(`   Has exports.handler: ${content.includes('exports.handler') ? '✅' : '❌'}`);
        console.log(`   Has async function: ${content.includes('async') ? '✅' : '❌'}`);
      }
    }
    
    return true;
  }

  checkNetlifyConfig() {
    console.log('\n⚙️  Checking Netlify Configuration');
    console.log('='.repeat(50));
    
    const configPath = path.join(__dirname, '..', 'netlify.toml');
    
    if (!fs.existsSync(configPath)) {
      console.log('❌ netlify.toml not found');
      return false;
    }
    
    const config = fs.readFileSync(configPath, 'utf8');
    console.log('✅ netlify.toml exists');
    
    // Check for key configurations
    const checks = [
      { name: 'Functions directory', pattern: /directory\s*=\s*["']netlify\/functions["']/ },
      { name: 'API redirects', pattern: /from\s*=\s*["']\/api\/\*["']/ },
      { name: 'Functions section', pattern: /\[functions\]/ }
    ];
    
    for (const check of checks) {
      const found = check.pattern.test(config);
      console.log(`   ${check.name}: ${found ? '✅' : '❌'}`);
    }
    
    return true;
  }

  async runDiagnostic() {
    console.log('🔍 Netlify Functions Diagnostic');
    console.log('================================');
    
    // Check local files
    this.checkLocalFiles();
    
    // Check configuration
    this.checkNetlifyConfig();
    
    // Test each function
    for (const func of this.functions) {
      await this.testFunction(func);
    }
    
    console.log('\n📋 Diagnostic Summary');
    console.log('='.repeat(50));
    console.log('If all functions return 404:');
    console.log('1. Check Netlify dashboard for function deployment status');
    console.log('2. Verify site is connected to GitHub repository');
    console.log('3. Check build logs for function-related errors');
    console.log('4. Ensure functions directory is properly configured');
    console.log('5. Try redeploying the site manually');
    
    console.log('\n🔧 Potential Solutions:');
    console.log('1. Manual redeploy from Netlify dashboard');
    console.log('2. Check Netlify site settings');
    console.log('3. Verify GitHub integration');
    console.log('4. Use Netlify CLI for local testing');
    console.log('5. Consider alternative API approach');
  }
}

// Run diagnostic
const diagnostic = new NetlifyDiagnostic();
diagnostic.runDiagnostic().catch(console.error);
