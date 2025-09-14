#!/usr/bin/env node

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 10000; // 10 seconds

console.log('🧪 Running API Integration Tests for Ethiopian Community Resources');
console.log(`🔗 Testing against: ${BASE_URL}`);

const tests = [
    {
        name: 'Health Check',
        path: '/api/health',
        expectedStatus: 200,
        expectedContent: 'status'
    },
    {
        name: 'Programs List',
        path: '/api/programs',
        expectedStatus: 200,
        expectedContent: 'success'
    },
    {
        name: 'Programs Statistics',
        path: '/api/programs/stats',
        expectedStatus: 200,
        expectedContent: 'data'
    },
    {
        name: 'Filter Options',
        path: '/api/programs/filters',
        expectedStatus: 200,
        expectedContent: 'data'
    },
    {
        name: 'Search Programs (Free)',
        path: '/api/programs/search?costCategory=FREE',
        expectedStatus: 200,
        expectedContent: 'success'
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

async function runTest(test) {
    const url = `${BASE_URL}${test.path}`;
    
    try {
        console.log(`\n🔍 Testing: ${test.name}`);
        console.log(`   URL: ${url}`);
        
        const result = await makeRequest(url);
        
        // Check status code
        if (result.status !== test.expectedStatus) {
            throw new Error(`Expected status ${test.expectedStatus}, got ${result.status}`);
        }
        
        // Check content
        const responseText = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
        if (!responseText.includes(test.expectedContent)) {
            throw new Error(`Expected content containing '${test.expectedContent}', got: ${responseText.substring(0, 200)}...`);
        }
        
        console.log(`   ✅ Status: ${result.status}`);
        console.log(`   ✅ Content: Contains '${test.expectedContent}'`);
        
        // Log additional info for some endpoints
        if (test.name === 'Programs List' && typeof result.data === 'object') {
            console.log(`   📊 Programs found: ${result.data.count || 'unknown'}`);
        }
        
        if (test.name === 'Programs Statistics' && typeof result.data === 'object') {
            const stats = result.data.data?.statistics;
            if (stats) {
                console.log(`   📊 Total programs: ${stats.totalPrograms}`);
                console.log(`   📊 Free programs: ${stats.freePrograms}`);
            }
        }
        
        return { success: true, test: test.name };
        
    } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        return { success: false, test: test.name, error: error.message };
    }
}

async function runAllTests() {
    console.log(`\n🚀 Starting ${tests.length} API tests...\n`);
    
    const results = [];
    
    for (const test of tests) {
        const result = await runTest(test);
        results.push(result);
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total:  ${results.length}`);
    
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`   - ${r.test}: ${r.error}`);
        });
    }
    
    console.log('\n🎉 Ethiopian Community Resources API Tests Complete!');
    
    // Exit with error code if any tests failed
    process.exit(failed > 0 ? 1 : 0);
}

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
});

