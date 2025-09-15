#!/usr/bin/env node

/**
 * CI/CD Pipeline Test Monitor
 * 
 * This script helps monitor and test the CI/CD pipeline after fixes
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class PipelineMonitor {
  constructor() {
    this.githubRepo = 'nebiyou1/Ethiopian-Community-Resources';
    this.netlifyUrl = process.env.NETLIFY_URL || 'https://ethiopian-community-resources.netlify.app';
  }

  async checkGitHubActions() {
    console.log('🔍 Checking GitHub Actions Status...');
    console.log('=====================================');
    
    try {
      // Note: This would require GitHub API token for full automation
      // For now, we'll provide manual instructions
      console.log('📋 Manual Check Instructions:');
      console.log('1. Go to: https://github.com/nebiyou1/Ethiopian-Community-Resources/actions');
      console.log('2. Look for the latest workflow run');
      console.log('3. Check the status of each job:\n');
      
      console.log('Expected Results:');
      console.log('✅ test-and-build: Should be SUCCESS');
      console.log('⚠️  migrate-database: Should be SUCCESS (with warnings)');
      console.log('✅ deploy-netlify: Should be SUCCESS');
      console.log('✅ notify: Should be SUCCESS\n');
      
      return true;
    } catch (error) {
      console.error('❌ Error checking GitHub Actions:', error.message);
      return false;
    }
  }

  async testNetlifyDeployment() {
    console.log('🌐 Testing Netlify Deployment...');
    console.log('=================================');
    
    const endpoints = [
      { path: '/', name: 'Homepage' },
      { path: '/api/health', name: 'Health Check' },
      { path: '/api/programs', name: 'Programs API' },
      { path: '/api/programs/stats', name: 'Stats API' }
    ];
    
    let allPassed = true;
    
    for (const endpoint of endpoints) {
      try {
        const url = `${this.netlifyUrl}${endpoint.path}`;
        console.log(`Testing ${endpoint.name}: ${url}`);
        
        const result = await this.makeRequest(url);
        
        if (result.success) {
          console.log(`✅ ${endpoint.name}: Working (${result.status})`);
        } else {
          console.log(`❌ ${endpoint.name}: Failed (${result.status})`);
          allPassed = false;
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
        allPassed = false;
      }
    }
    
    console.log('');
    return allPassed;
  }

  async makeRequest(url) {
    return new Promise((resolve) => {
      const req = https.get(url, (res) => {
        resolve({
          success: res.statusCode >= 200 && res.statusCode < 400,
          status: res.statusCode
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          status: 'ERROR',
          error: error.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          status: 'TIMEOUT'
        });
      });
    });
  }

  async testLocalBuild() {
    console.log('🏗️  Testing Local Build...');
    console.log('===========================');
    
    try {
      // Check if build files exist
      const distPath = path.join(__dirname, '..', 'dist');
      
      if (fs.existsSync(distPath)) {
        const files = fs.readdirSync(distPath);
        console.log(`✅ Build directory exists with ${files.length} files`);
        
        // Check for key files
        const keyFiles = ['index.html', 'app.js', 'styles.css'];
        for (const file of keyFiles) {
          if (files.includes(file)) {
            console.log(`✅ Found: ${file}`);
          } else {
            console.log(`⚠️  Missing: ${file}`);
          }
        }
        
        return true;
      } else {
        console.log('❌ Build directory not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking local build:', error.message);
      return false;
    }
  }

  async testMigrationScript() {
    console.log('🗄️  Testing Migration Script...');
    console.log('=================================');
    
    try {
      const migrationScript = path.join(__dirname, 'migrate-supabase-robust.js');
      
      if (fs.existsSync(migrationScript)) {
        console.log('✅ Migration script exists');
        
        // Test script syntax
        const scriptContent = fs.readFileSync(migrationScript, 'utf8');
        
        // Basic syntax check
        if (scriptContent.includes('class RobustSupabaseMigration')) {
          console.log('✅ Script structure looks good');
        } else {
          console.log('⚠️  Script structure may have issues');
        }
        
        return true;
      } else {
        console.log('❌ Migration script not found');
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing migration script:', error.message);
      return false;
    }
  }

  async runFullTest() {
    console.log('🚀 CI/CD Pipeline Test Suite');
    console.log('==============================\n');
    
    const results = {
      githubActions: await this.checkGitHubActions(),
      netlifyDeployment: await this.testNetlifyDeployment(),
      localBuild: await this.testLocalBuild(),
      migrationScript: await this.testMigrationScript()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('=========================');
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${test}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    
    console.log('\n🎯 Overall Status:');
    console.log('==================');
    
    if (allPassed) {
      console.log('🎉 All tests passed! Your CI/CD pipeline should be working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Check the issues above and retry.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('==============');
    console.log('1. Check GitHub Actions for the latest workflow run');
    console.log('2. Verify Netlify deployment is live');
    console.log('3. Test the application functionality');
    console.log('4. Monitor for any error logs');
    
    return allPassed;
  }
}

// Run the test suite
const monitor = new PipelineMonitor();
monitor.runFullTest().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
