#!/usr/bin/env node

/**
 * CI/CD Deployment Monitor
 * 
 * This script helps monitor the CI/CD deployment process
 */

const https = require('https');

class DeploymentMonitor {
  constructor() {
    this.siteUrl = 'https://ethiopian-community-resources.netlify.app';
    this.githubUrl = 'https://github.com/nebiyou1/Ethiopian-Community-Resources/actions';
  }

  async checkDeploymentStatus() {
    console.log('🔍 CI/CD Deployment Monitor');
    console.log('============================');
    console.log('');
    
    console.log('📋 Manual Check Required:');
    console.log('=========================');
    console.log(`GitHub Actions: ${this.githubUrl}`);
    console.log('');
    
    console.log('🔍 Check These Steps:');
    console.log('====================');
    console.log('1. test-and-build: Should show build logs with correct files');
    console.log('2. migrate-database: Should complete with warnings (OK)');
    console.log('3. deploy-netlify: Should deploy successfully');
    console.log('4. notify: Should show success message');
    console.log('');
    
    console.log('📊 Expected Build Logs:');
    console.log('=======================');
    console.log('Build application step should show:');
    console.log('📁 Build contents:');
    console.log('📄 HTML content: (should show index-DQ-u3Bgn.js)');
    console.log('📦 JavaScript files: (should show index-DQ-u3Bgn.js)');
    console.log('');
    
    console.log('🧪 Testing Current Site:');
    console.log('=======================');
    
    try {
      const html = await this.fetchHTML();
      const jsFile = this.extractJSFile(html);
      
      console.log(`Current JavaScript file: ${jsFile}`);
      
      if (jsFile === 'index-DQ-u3Bgn.js') {
        console.log('✅ SUCCESS: Site is serving the correct file!');
        console.log('✅ The CI/CD deployment worked!');
        return true;
      } else if (jsFile === 'index-CVC1aS8X.js') {
        console.log('⚠️  WARNING: Site is still serving the old file');
        console.log('⚠️  This means:');
        console.log('   - GitHub Actions might still be running');
        console.log('   - Deployment might have failed');
        console.log('   - Netlify cache might not be cleared');
        return false;
      } else {
        console.log(`❓ UNKNOWN: Unexpected file ${jsFile}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      return false;
    }
  }

  async fetchHTML() {
    return new Promise((resolve, reject) => {
      const req = https.get(this.siteUrl, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve(body);
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  extractJSFile(html) {
    const match = html.match(/src="\/assets\/(index-[^"]*\.js)"/);
    return match ? match[1] : 'unknown';
  }

  async runMonitoring() {
    const success = await this.checkDeploymentStatus();
    
    console.log('');
    console.log('🎯 Next Steps:');
    console.log('==============');
    
    if (success) {
      console.log('✅ Deployment successful!');
      console.log('✅ Test the app - it should work without 404 errors');
      console.log('✅ Check browser console for client-side API messages');
    } else {
      console.log('⚠️  Deployment needs attention:');
      console.log('1. Check GitHub Actions for any failures');
      console.log('2. Wait for deployment to complete');
      console.log('3. If still failing, check Netlify dashboard');
      console.log('4. Consider manual redeploy if needed');
    }
    
    console.log('');
    console.log('📞 Support:');
    console.log('===========');
    console.log('GitHub Actions:', this.githubUrl);
    console.log('Netlify Site:', this.siteUrl);
    
    return success;
  }
}

// Run monitoring
const monitor = new DeploymentMonitor();
monitor.runMonitoring().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Monitoring failed:', error);
  process.exit(1);
});
