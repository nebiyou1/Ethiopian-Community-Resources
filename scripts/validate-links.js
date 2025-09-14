const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load the data
const dataPath = path.join(__dirname, '../docs/inputdata.json');
const rawData = fs.readFileSync(dataPath, 'utf8');
const data = JSON.parse(rawData);

console.log(`🔍 Validating links for ${data.programs.length} programs...`);

const results = {
  valid: [],
  invalid: [],
  errors: []
};

const validateUrl = (url) => {
  return new Promise((resolve) => {
    if (!url || url.trim() === '') {
      resolve({ valid: false, error: 'Empty URL' });
      return;
    }

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    const protocol = url.startsWith('https://') ? https : http;
    const timeout = 10000; // 10 seconds timeout

    const req = protocol.get(url, { timeout }, (res) => {
      resolve({ 
        valid: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        url: url
      });
    });

    req.on('error', (error) => {
      resolve({ 
        valid: false, 
        error: error.message,
        url: url
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        valid: false, 
        error: 'Timeout',
        url: url
      });
    });
  });
};

const validateAllLinks = async () => {
  const programs = data.programs;
  const batchSize = 10; // Process in batches to avoid overwhelming servers
  
  for (let i = 0; i < programs.length; i += batchSize) {
    const batch = programs.slice(i, i + batchSize);
    console.log(`📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(programs.length/batchSize)} (${i + 1}-${Math.min(i + batchSize, programs.length)})`);
    
    const promises = batch.map(async (program) => {
      const result = await validateUrl(program.website);
      
      const programResult = {
        id: program.id,
        name: program.program_name,
        website: program.website,
        ...result
      };

      if (result.valid) {
        results.valid.push(programResult);
      } else {
        results.invalid.push(programResult);
      }

      return programResult;
    });

    await Promise.all(promises);
    
    // Small delay between batches to be respectful
    if (i + batchSize < programs.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};

const generateReport = () => {
  console.log('\n📋 LINK VALIDATION REPORT');
  console.log('='.repeat(50));
  
  console.log(`✅ Valid links: ${results.valid.length}`);
  console.log(`❌ Invalid links: ${results.invalid.length}`);
  console.log(`📊 Success rate: ${((results.valid.length / data.programs.length) * 100).toFixed(1)}%`);

  if (results.invalid.length > 0) {
    console.log('\n❌ INVALID LINKS:');
    console.log('-'.repeat(30));
    results.invalid.forEach(program => {
      console.log(`ID ${program.id}: ${program.name}`);
      console.log(`  URL: ${program.url || program.website}`);
      console.log(`  Error: ${program.error || `HTTP ${program.statusCode}`}`);
      console.log('');
    });
  }

  // Generate detailed report file
  const reportPath = path.join(__dirname, '../docs/link-validation-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: data.programs.length,
      valid: results.valid.length,
      invalid: results.invalid.length,
      successRate: (results.valid.length / data.programs.length) * 100
    },
    valid: results.valid,
    invalid: results.invalid
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);

  // Update programs with validation status
  const updatedPrograms = data.programs.map(program => {
    const validationResult = [...results.valid, ...results.invalid]
      .find(r => r.id === program.id);
    
    return {
      ...program,
      linkValidation: {
        isValid: validationResult?.valid || false,
        lastChecked: new Date().toISOString(),
        statusCode: validationResult?.statusCode || null,
        error: validationResult?.error || null
      }
    };
  });

  // Create backup and update data
  const backupPath = path.join(__dirname, '../docs/inputdata-with-validation.json');
  fs.writeFileSync(backupPath, JSON.stringify({
    ...data,
    programs: updatedPrograms
  }, null, 2));
  
  console.log(`💾 Updated data with validation saved to: ${backupPath}`);
};

// Run validation
validateAllLinks()
  .then(() => {
    generateReport();
  })
  .catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
