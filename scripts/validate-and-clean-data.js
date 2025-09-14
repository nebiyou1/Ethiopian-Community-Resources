#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

class DataValidator {
  constructor() {
    this.validationResults = {
      total: 0,
      validated: 0,
      issues: [],
      corrections: [],
      skipped: []
    };
    
    // Known program mappings for validation
    this.knownPrograms = {
      'Fred Hutch SHIP': {
        organization: 'Fred Hutchinson Cancer Research Center',
        website: 'https://www.fredhutch.org/en/education-training/undergraduate-students/ship.html',
        location: { city: 'Seattle', state: 'WA' },
        type: 'Summer Research Program',
        cost_category: 'FREE_PLUS_STIPEND',
        description: 'Summer High School Internship Program in cancer research'
      },
      'All Star Code': {
        organization: 'All Star Code',
        website: 'https://www.allstarcode.org/',
        location: { city: 'New York', state: 'NY' },
        type: 'Summer Program',
        cost_category: 'FREE',
        description: 'Coding bootcamp for young men of color'
      },
      'Code Nation': {
        organization: 'Code Nation',
        website: 'https://codenation.org/',
        location: { city: 'New York', state: 'NY' },
        type: 'Year-Round Program',
        cost_category: 'FREE',
        description: 'Computer science education for students in under-resourced high schools'
      },
      'AI4ALL': {
        organization: 'AI4ALL',
        website: 'https://ai-4-all.org/',
        location: { city: 'Oakland', state: 'CA' },
        type: 'Summer Program',
        cost_category: 'FREE',
        description: 'AI education program for underrepresented students'
      },
      'MIT MITES': {
        organization: 'Massachusetts Institute of Technology',
        website: 'https://oeop.mit.edu/programs/mites',
        location: { city: 'Cambridge', state: 'MA' },
        type: 'Summer Program',
        cost_category: 'FREE',
        description: 'Minority Introduction to Engineering and Science'
      },
      'Stanford AI4ALL': {
        organization: 'Stanford University',
        website: 'https://ai-4-all.org/open-camp/stanford-ai4all/',
        location: { city: 'Stanford', state: 'CA' },
        type: 'Summer Program',
        cost_category: 'FREE',
        description: 'AI camp for high school students from underrepresented groups'
      },
      'Harvard Secondary School Program': {
        organization: 'Harvard University',
        website: 'https://www.summer.harvard.edu/high-school-programs',
        location: { city: 'Cambridge', state: 'MA' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Pre-college summer program at Harvard'
      },
      'Yale Young Global Scholars': {
        organization: 'Yale University',
        website: 'https://globalscholars.yale.edu/',
        location: { city: 'New Haven', state: 'CT' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Academic enrichment program for outstanding high school students'
      },
      'Columbia Summer Immersion': {
        organization: 'Columbia University',
        website: 'https://sps.columbia.edu/highschool/summer-immersion',
        location: { city: 'New York', state: 'NY' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Pre-college summer program at Columbia University'
      },
      'Johns Hopkins CTY': {
        organization: 'Johns Hopkins University',
        website: 'https://cty.jhu.edu/',
        location: { city: 'Baltimore', state: 'MD' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Center for Talented Youth summer programs'
      },
      'Carnegie Mellon SAMS': {
        organization: 'Carnegie Mellon University',
        website: 'https://www.cmu.edu/pre-college/academic-programs/sams.html',
        location: { city: 'Pittsburgh', state: 'PA' },
        type: 'Summer Program',
        cost_category: 'FREE',
        description: 'Summer Academy for Mathematics and Science'
      },
      'Duke TIP': {
        organization: 'Duke University',
        website: 'https://tip.duke.edu/',
        location: { city: 'Durham', state: 'NC' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Talent Identification Program summer studies'
      },
      'Northwestern CTD': {
        organization: 'Northwestern University',
        website: 'https://www.ctd.northwestern.edu/',
        location: { city: 'Evanston', state: 'IL' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Center for Talent Development programs'
      },
      'Brown Pre-College': {
        organization: 'Brown University',
        website: 'https://precollege.brown.edu/',
        location: { city: 'Providence', state: 'RI' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Pre-college summer programs at Brown University'
      },
      'Cornell Summer College': {
        organization: 'Cornell University',
        website: 'https://www.sce.cornell.edu/precollege/summer',
        location: { city: 'Ithaca', state: 'NY' },
        type: 'Summer Program',
        cost_category: 'PAID',
        description: 'Pre-college summer programs at Cornell'
      }
    };
  }

  async validateWebsite(url) {
    if (!url) return { valid: false, reason: 'No URL provided' };
    
    try {
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      return new Promise((resolve) => {
        const request = httpModule.get(url, { timeout: 5000 }, (response) => {
          if (response.statusCode >= 200 && response.statusCode < 400) {
            resolve({ valid: true, statusCode: response.statusCode });
          } else {
            resolve({ valid: false, reason: `HTTP ${response.statusCode}` });
          }
        });
        
        request.on('error', (error) => {
          resolve({ valid: false, reason: error.message });
        });
        
        request.on('timeout', () => {
          request.destroy();
          resolve({ valid: false, reason: 'Timeout' });
        });
      });
    } catch (error) {
      return { valid: false, reason: 'Invalid URL format' };
    }
  }

  validateProgramData(program) {
    const issues = [];
    const corrections = {};
    
    // Check if we have known data for this program
    const knownData = this.knownPrograms[program.program_name];
    
    if (knownData) {
      // Validate organization
      if (!program.organization && knownData.organization) {
        corrections.organization = knownData.organization;
        issues.push({
          field: 'organization',
          issue: 'Missing organization name',
          severity: 'error',
          suggested_fix: knownData.organization
        });
      } else if (program.organization !== knownData.organization && knownData.organization) {
        issues.push({
          field: 'organization',
          issue: `Organization mismatch: "${program.organization}" vs expected "${knownData.organization}"`,
          severity: 'warning',
          suggested_fix: knownData.organization
        });
      }
      
      // Validate website
      if (!program.website && knownData.website) {
        corrections.website = knownData.website;
        issues.push({
          field: 'website',
          issue: 'Missing website URL',
          severity: 'error',
          suggested_fix: knownData.website
        });
      }
      
      // Validate location
      if (!program.location_city && knownData.location.city) {
        corrections.location_city = knownData.location.city;
        issues.push({
          field: 'location_city',
          issue: 'Missing city',
          severity: 'error',
          suggested_fix: knownData.location.city
        });
      }
      
      if (!program.location_state && knownData.location.state) {
        corrections.location_state = knownData.location.state;
        issues.push({
          field: 'location_state',
          issue: 'Missing state',
          severity: 'error',
          suggested_fix: knownData.location.state
        });
      }
      
      // Validate cost category
      if (program.cost_category !== knownData.cost_category) {
        issues.push({
          field: 'cost_category',
          issue: `Cost category mismatch: "${program.cost_category}" vs expected "${knownData.cost_category}"`,
          severity: 'warning',
          suggested_fix: knownData.cost_category
        });
      }
      
      // Validate description
      if (!program.description && knownData.description) {
        corrections.description = knownData.description;
        issues.push({
          field: 'description',
          issue: 'Missing description',
          severity: 'warning',
          suggested_fix: knownData.description
        });
      }
    }
    
    // General validation rules
    if (!program.program_name || program.program_name.trim().length === 0) {
      issues.push({
        field: 'program_name',
        issue: 'Program name is required',
        severity: 'error'
      });
    }
    
    if (program.program_name && program.program_name.length > 255) {
      issues.push({
        field: 'program_name',
        issue: 'Program name too long (max 255 characters)',
        severity: 'error'
      });
    }
    
    // Validate selectivity percentage
    if (program.selectivity_percent !== null) {
      const selectivity = parseInt(program.selectivity_percent);
      if (isNaN(selectivity) || selectivity < 0 || selectivity > 100) {
        issues.push({
          field: 'selectivity_percent',
          issue: 'Selectivity percentage must be between 0 and 100',
          severity: 'error'
        });
      }
    }
    
    // Validate grade level
    if (program.grade_level !== null) {
      const grade = parseInt(program.grade_level);
      if (isNaN(grade) || grade < 1 || grade > 12) {
        issues.push({
          field: 'grade_level',
          issue: 'Grade level must be between 1 and 12',
          severity: 'warning'
        });
      }
    }
    
    // Validate duration
    if (program.duration_weeks !== null) {
      const duration = parseInt(program.duration_weeks);
      if (isNaN(duration) || duration < 1 || duration > 52) {
        issues.push({
          field: 'duration_weeks',
          issue: 'Duration must be between 1 and 52 weeks',
          severity: 'warning'
        });
      }
    }
    
    return { issues, corrections };
  }

  async validateAllPrograms() {
    console.log('🔍 Starting comprehensive data validation...\n');
    
    try {
      await client.connect();
      console.log('✅ Connected to database');
      
      // Get all programs
      const result = await client.query('SELECT * FROM programs ORDER BY id');
      const programs = result.rows;
      
      console.log(`📊 Found ${programs.length} programs to validate\n`);
      this.validationResults.total = programs.length;
      
      const corrections = [];
      
      for (let i = 0; i < programs.length; i++) {
        const program = programs[i];
        console.log(`🔍 Validating ${i + 1}/${programs.length}: ${program.program_name}`);
        
        // Validate program data
        const validation = this.validateProgramData(program);
        
        if (validation.issues.length > 0) {
          console.log(`  ⚠️  Found ${validation.issues.length} issues:`);
          validation.issues.forEach(issue => {
            console.log(`    - ${issue.severity.toUpperCase()}: ${issue.issue}`);
            if (issue.suggested_fix) {
              console.log(`      Suggested fix: ${issue.suggested_fix}`);
            }
          });
          
          this.validationResults.issues.push({
            program_id: program.id,
            program_name: program.program_name,
            issues: validation.issues
          });
        }
        
        // Collect corrections
        if (Object.keys(validation.corrections).length > 0) {
          corrections.push({
            id: program.id,
            program_name: program.program_name,
            corrections: validation.corrections
          });
          
          this.validationResults.corrections.push({
            program_id: program.id,
            program_name: program.program_name,
            corrections: validation.corrections
          });
        }
        
        // Validate website if present
        if (program.website) {
          const websiteValidation = await this.validateWebsite(program.website);
          if (!websiteValidation.valid) {
            console.log(`  🌐 Website issue: ${websiteValidation.reason}`);
            this.validationResults.issues.push({
              program_id: program.id,
              program_name: program.program_name,
              issues: [{
                field: 'website',
                issue: `Website not accessible: ${websiteValidation.reason}`,
                severity: 'warning'
              }]
            });
          }
        }
        
        if (validation.issues.length === 0) {
          this.validationResults.validated++;
          console.log('  ✅ No issues found');
        }
        
        console.log('');
      }
      
      // Apply corrections
      if (corrections.length > 0) {
        console.log(`🔧 Applying ${corrections.length} corrections...\n`);
        
        for (const correction of corrections) {
          const updateFields = [];
          const updateValues = [];
          let paramIndex = 1;
          
          for (const [field, value] of Object.entries(correction.corrections)) {
            updateFields.push(`${field} = $${paramIndex}`);
            updateValues.push(value);
            paramIndex++;
          }
          
          if (updateFields.length > 0) {
            const updateSQL = `
              UPDATE programs 
              SET ${updateFields.join(', ')}, updated_at = NOW()
              WHERE id = $${paramIndex}
            `;
            updateValues.push(correction.id);
            
            await client.query(updateSQL, updateValues);
            console.log(`✅ Updated ${correction.program_name}`);
          }
        }
      }
      
      // Generate validation report
      this.generateValidationReport();
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    } finally {
      await client.end();
    }
  }

  generateValidationReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 VALIDATION REPORT');
    console.log('='.repeat(60));
    
    console.log(`📊 Total programs: ${this.validationResults.total}`);
    console.log(`✅ Clean programs: ${this.validationResults.validated}`);
    console.log(`⚠️  Programs with issues: ${this.validationResults.issues.length}`);
    console.log(`🔧 Programs corrected: ${this.validationResults.corrections.length}`);
    
    if (this.validationResults.issues.length > 0) {
      console.log('\n🔍 ISSUES SUMMARY:');
      
      const issuesByType = {};
      const issuesBySeverity = { error: 0, warning: 0, info: 0 };
      
      this.validationResults.issues.forEach(programIssues => {
        programIssues.issues.forEach(issue => {
          issuesByType[issue.field] = (issuesByType[issue.field] || 0) + 1;
          issuesBySeverity[issue.severity] = (issuesBySeverity[issue.severity] || 0) + 1;
        });
      });
      
      console.log('\nBy Field:');
      Object.entries(issuesByType)
        .sort(([,a], [,b]) => b - a)
        .forEach(([field, count]) => {
          console.log(`  ${field}: ${count} issues`);
        });
      
      console.log('\nBy Severity:');
      Object.entries(issuesBySeverity).forEach(([severity, count]) => {
        if (count > 0) {
          const icon = severity === 'error' ? '🚨' : severity === 'warning' ? '⚠️' : 'ℹ️';
          console.log(`  ${icon} ${severity}: ${count}`);
        }
      });
    }
    
    if (this.validationResults.corrections.length > 0) {
      console.log('\n🔧 CORRECTIONS APPLIED:');
      this.validationResults.corrections.forEach(correction => {
        console.log(`  ${correction.program_name}:`);
        Object.entries(correction.corrections).forEach(([field, value]) => {
          console.log(`    - ${field}: "${value}"`);
        });
      });
    }
    
    // Save detailed report to file
    const reportPath = path.join(__dirname, '..', 'validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.validationResults, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. Review and fix all ERROR-level issues');
    console.log('2. Consider addressing WARNING-level issues for data quality');
    console.log('3. Verify website URLs that failed validation');
    console.log('4. Add missing organization and location data');
    console.log('5. Standardize cost categories and program types');
    
    console.log('\n✨ Validation completed!');
  }
}

// Run validation
const validator = new DataValidator();
validator.validateAllPrograms();
