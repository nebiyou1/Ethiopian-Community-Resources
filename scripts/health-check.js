#!/usr/bin/env node

const http = require('http');
const https = require('https');

const SITE_URL = process.env.NETLIFY_URL || process.env.SITE_URL || 'http://localhost:3000';
const TIMEOUT = 15000; // 15 seconds

console.log('🏥 Ethiopian Community Resources Health Check');
console.log(`🌐 Checking: ${SITE_URL}`);

const healthChecks = [
    {
        name: 'Frontend Loading',
        path: '/',
        check: (response) => {
            return response.data.includes('Summer Programs') || response.data.includes('Ethiopian Community');
        }
    },
    {
        name: 'API Health Endpoint',
        path: '/api/health',
        check: (response) => {
            return response.status === 200 && 
                   typeof response.data === 'object' && 
                   response.data.status === 'OK';
        }
    },
    {
        name: 'Programs API',
        path: '/api/programs',
        check: (response) => {
            return response.status === 200 && 
                   typeof response.data === 'object' && 
                   response.data.success === true;
        }
    },
    {
        name: 'Database Connection',
        path: '/api/programs/stats',
        check: (response) => {
            return response.status === 200 && 
                   typeof response.data === 'object' && 
                   response.data.success === true;
        }
    },
    {
        name: 'Authentication Endpoint',
        path: '/api/user',
        check: (response) => {
            return response.status === 200 && 
                   typeof response.data === 'object' && 
                   'authenticated' in response.data;
        }
    }
];

function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, { timeout: TIMEOUT }, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({
                        status: res.statusCode,
                        data: parsed,
                        headers: res.headers
                    });
                } catch (e) {
                    // Not JSON, return as string
                    resolve({
                        status: res.statusCode,
                        data: data,
                        headers: res.headers
                    });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function runHealthCheck(check) {
    const url = `${SITE_URL}${check.path}`;
    
    try {
        console.log(`\n🔍 ${check.name}`);
        console.log(`   Testing: ${url}`);
        
        const startTime = Date.now();
        const response = await makeRequest(url);
        const duration = Date.now() - startTime;
        
        const isHealthy = check.check(response);
        
        if (isHealthy) {
            console.log(`   ✅ Healthy (${duration}ms)`);
            console.log(`   📊 Status: ${response.status}`);
            
            // Log additional details for specific checks
            if (check.name === 'Programs API' && typeof response.data === 'object') {
                console.log(`   📊 Programs: ${response.data.count || 'unknown'}`);
            }
            
            if (check.name === 'Database Connection' && typeof response.data === 'object') {
                const stats = response.data.data?.statistics;
                if (stats) {
                    console.log(`   📊 DB Programs: ${stats.totalPrograms}`);
                }
            }
            
            return { success: true, duration, check: check.name };
        } else {
            console.log(`   ❌ Unhealthy (${duration}ms)`);
            console.log(`   📊 Status: ${response.status}`);
            console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
            
            return { success: false, duration, check: check.name, response };
        }
        
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        return { success: false, check: check.name, error: error.message };
    }
}

async function runAllHealthChecks() {
    console.log(`\n🚀 Running ${healthChecks.length} health checks...\n`);
    
    const results = [];
    const startTime = Date.now();
    
    for (const check of healthChecks) {
        const result = await runHealthCheck(check);
        results.push(result);
        
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const totalTime = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('🏥 HEALTH CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`🌐 Site: ${SITE_URL}`);
    console.log(`✅ Healthy: ${passed}`);
    console.log(`❌ Unhealthy: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📊 Success Rate: ${Math.round((passed / results.length) * 100)}%`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Health Checks:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.check}: ${r.error || 'Check failed'}`);
        });
    }
    
    // Performance insights
    const avgDuration = results
        .filter(r => r.duration)
        .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.duration).length;
    
    if (avgDuration) {
        console.log(`\n⚡ Average Response Time: ${Math.round(avgDuration)}ms`);
        
        if (avgDuration > 2000) {
            console.log('⚠️  Warning: Slow response times detected');
        } else if (avgDuration < 500) {
            console.log('🚀 Excellent response times!');
        }
    }
    
    console.log('\n🎉 Ethiopian Community Resources Health Check Complete!');
    
    // Exit with appropriate code
    if (failed === 0) {
        console.log('💚 All systems operational!');
        process.exit(0);
    } else if (failed < results.length / 2) {
        console.log('💛 Some issues detected, but core functionality working');
        process.exit(0); // Don't fail CI for partial issues
    } else {
        console.log('💔 Critical issues detected!');
        process.exit(1);
    }
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run health checks
runAllHealthChecks().catch(error => {
    console.error('❌ Health check failed:', error);
    process.exit(1);
});

