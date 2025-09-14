#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const client = new Client({
  connectionString: 'postgresql://postgres:9734937731Girma@db.qvqybobnsaikaknsdqhw.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

// Validated and cleaned program data
const validatedPrograms = {
  'Fred Hutch SHIP': {
    organization: 'Fred Hutchinson Cancer Research Center',
    website: 'https://www.fredhutch.org/en/education-training/undergraduate-students/ship.html',
    location: { city: 'Seattle', state: 'WA' },
    type: 'summer_program',
    cost_category: 'FREE_PLUS_STIPEND',
    description: 'Summer High School Internship Program providing hands-on cancer research experience',
    target_audience: 'high_school',
    selectivity_tier: 'highly_selective',
    duration_weeks: 8,
    grade_level_min: 10,
    grade_level_max: 12,
    subjects: ['stem', 'sciences'],
    key_benefits: 'Hands-on research experience, mentorship, stipend provided'
  },
  'All Star Code': {
    organization: 'All Star Code',
    website: 'https://www.allstarcode.org/',
    location: { city: 'New York', state: 'NY' },
    type: 'summer_program',
    cost_category: 'FREE',
    description: 'Intensive coding bootcamp for young men of color to increase diversity in tech',
    target_audience: 'high_school',
    selectivity_tier: 'selective',
    duration_weeks: 6,
    grade_level_min: 9,
    grade_level_max: 12,
    subjects: ['computer-science', 'stem'],
    key_benefits: 'Free coding education, career mentorship, college prep support'
  },
  'Code Nation': {
    organization: 'Code Nation',
    website: 'https://codenation.org/',
    location: { city: 'New York', state: 'NY' },
    type: 'program',
    cost_category: 'FREE',
    description: 'Year-round computer science education program for students in under-resourced high schools',
    target_audience: 'high_school',
    selectivity_tier: 'open',
    duration_weeks: 36,
    grade_level_min: 9,
    grade_level_max: 12,
    subjects: ['computer-science', 'stem'],
    key_benefits: 'Free CS education, industry mentorship, college and career support'
  },
  'AI4ALL': {
    organization: 'AI4ALL',
    website: 'https://ai-4-all.org/',
    location: { city: 'Oakland', state: 'CA' },
    type: 'summer_program',
    cost_category: 'FREE',
    description: 'AI education program designed to increase diversity and inclusion in artificial intelligence',
    target_audience: 'high_school',
    selectivity_tier: 'selective',
    duration_weeks: 2,
    grade_level_min: 10,
    grade_level_max: 12,
    subjects: ['computer-science', 'stem'],
    key_benefits: 'AI education, mentorship from industry professionals, college prep'
  },
  'MIT MITES': {
    organization: 'Massachusetts Institute of Technology',
    website: 'https://oeop.mit.edu/programs/mites',
    location: { city: 'Cambridge', state: 'MA' },
    type: 'summer_program',
    cost_category: 'FREE',
    description: 'Minority Introduction to Engineering and Science - rigorous academic program',
    target_audience: 'high_school',
    selectivity_tier: 'elite',
    duration_weeks: 6,
    grade_level_min: 11,
    grade_level_max: 12,
    subjects: ['stem', 'engineering', 'mathematics'],
    key_benefits: 'MIT experience, rigorous STEM education, college preparation'
  },
  'Stanford AI4ALL': {
    organization: 'Stanford University',
    website: 'https://ai-4-all.org/open-camp/stanford-ai4all/',
    location: { city: 'Stanford', state: 'CA' },
    type: 'summer_program',
    cost_category: 'FREE',
    description: 'AI camp for high school students from underrepresented groups in tech',
    target_audience: 'high_school',
    selectivity_tier: 'highly_selective',
    duration_weeks: 2,
    grade_level_min: 10,
    grade_level_max: 12,
    subjects: ['computer-science', 'stem'],
    key_benefits: 'Stanford campus experience, AI education, mentorship'
  },
  'Harvard Secondary School Program': {
    organization: 'Harvard University',
    website: 'https://www.summer.harvard.edu/high-school-programs',
    location: { city: 'Cambridge', state: 'MA' },
    type: 'summer_program',
    cost_category: 'PAID',
    description: 'Pre-college summer program offering college-level courses at Harvard',
    target_audience: 'high_school',
    selectivity_tier: 'selective',
    duration_weeks: 2,
    grade_level_min: 9,
    grade_level_max: 12,
    subjects: ['liberal-arts'],
    key_benefits: 'Harvard experience, college credit, academic enrichment'
  },
  'Yale Young Global Scholars': {
    organization: 'Yale University',
    website: 'https://globalscholars.yale.edu/',
    location: { city: 'New Haven', state: 'CT' },
    type: 'summer_program',
    cost_category: 'PAID',
    description: 'Academic enrichment program for outstanding high school students worldwide',
    target_audience: 'high_school',
    selectivity_tier: 'highly_selective',
    duration_weeks: 2,
    grade_level_min: 10,
    grade_level_max: 12,
    subjects: ['liberal-arts', 'leadership'],
    key_benefits: 'Yale experience, global perspective, leadership development'
  },
  'Columbia Summer Immersion': {
    organization: 'Columbia University',
    website: 'https://sps.columbia.edu/highschool/summer-immersion',
    location: { city: 'New York', state: 'NY' },
    type: 'summer_program',
    cost_category: 'PAID',
    description: 'Pre-college summer program at Columbia University',
    target_audience: 'high_school',
    selectivity_tier: 'selective',
    duration_weeks: 3,
    grade_level_min: 9,
    grade_level_max: 12,
    subjects: ['liberal-arts'],
    key_benefits: 'Columbia experience, college preparation, academic exploration'
  },
  'Johns Hopkins CTY': {
    organization: 'Johns Hopkins University',
    website: 'https://cty.jhu.edu/',
    location: { city: 'Baltimore', state: 'MD' },
    type: 'summer_program',
    cost_category: 'PAID',
    description: 'Center for Talented Youth - accelerated academic programs for gifted students',
    target_audience: 'high_school',
    selectivity_tier: 'highly_selective',
    duration_weeks: 3,
    grade_level_min: 6,
    grade_level_max: 12,
    subjects: ['stem', 'liberal-arts'],
    key_benefits: 'Accelerated learning, gifted peer community, academic challenge'
  }
};

async function populateValidatedData() {
  console.log('🚀 Populating database with validated data...\n');

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Load original data for programs not in our validated set
    console.log('\n📂 Loading original program data...');
    const jsonPath = path.join(__dirname, '..', 'docs', 'inputdata.json');
    const jsonFileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const originalPrograms = jsonFileData.programs || jsonFileData;
    console.log(`📊 Found ${originalPrograms.length} original programs`);

    let organizationsCreated = 0;
    let programsCreated = 0;
    let attributesAdded = 0;
    let categoriesLinked = 0;

    // Process all programs (validated first, then others)
    console.log('\n📦 Processing programs...');
    
    for (const originalProgram of originalPrograms) {
      try {
        const programName = originalProgram.program_name;
        const validatedData = validatedPrograms[programName];
        
        // Use validated data if available, otherwise use original with basic cleaning
        const programData = validatedData || {
          organization: originalProgram.organization || 'Unknown Organization',
          website: originalProgram.website,
          location: {
            city: originalProgram.location_city,
            state: originalProgram.location_state
          },
          type: originalProgram.program_type || 'program',
          cost_category: originalProgram.cost_category || 'UNKNOWN',
          description: originalProgram.description,
          target_audience: 'high_school',
          selectivity_tier: this.determineSelectivityTier(originalProgram.selectivity_percent),
          duration_weeks: originalProgram.duration_weeks,
          grade_level_min: originalProgram.grade_level,
          grade_level_max: originalProgram.grade_level,
          subjects: this.determineSubjects(originalProgram),
          key_benefits: originalProgram.key_benefits
        };

        // Create or find organization
        const organizationId = await this.createOrganization(programData, client);
        if (organizationId.isNew) organizationsCreated++;

        // Create program
        const programId = await this.createProgram(originalProgram, programData, organizationId.id, client);
        programsCreated++;

        // Add program attributes
        const attrCount = await this.addProgramAttributes(originalProgram, programData, programId, client);
        attributesAdded += attrCount;

        // Link categories
        const catCount = await this.linkProgramCategories(programData, programId, client);
        categoriesLinked += catCount;

        if (programsCreated % 25 === 0) {
          console.log(`  📈 Processed ${programsCreated}/${originalPrograms.length} programs...`);
        }

      } catch (error) {
        console.error(`  ❌ Error processing ${originalProgram.program_name}: ${error.message}`);
      }
    }

    console.log('\n🎉 Data population completed!');
    console.log('\n📋 SUMMARY:');
    console.log(`  🏢 Organizations created: ${organizationsCreated}`);
    console.log(`  📚 Programs created: ${programsCreated}`);
    console.log(`  🏷️  Attributes added: ${attributesAdded}`);
    console.log(`  📂 Categories linked: ${categoriesLinked}`);

    // Final validation
    console.log('\n🔍 Final validation...');
    const counts = {};
    const tables = ['organizations', 'programs', 'program_attributes', 'program_categories'];
    
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      counts[table] = parseInt(result.rows[0].count);
      console.log(`  📊 ${table}: ${counts[table]} records`);
    }

    console.log('\n✨ Database is ready for use!');

  } catch (error) {
    console.error('❌ Data population failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
  }
}

// Helper methods
async function createOrganization(programData, client) {
  const orgName = programData.organization;
  const slug = orgName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  // Check if organization exists
  const existing = await client.query('SELECT id FROM organizations WHERE slug = $1', [slug]);
  if (existing.rows.length > 0) {
    return { id: existing.rows[0].id, isNew: false };
  }

  // Create new organization
  const result = await client.query(`
    INSERT INTO organizations (
      name, slug, type, website, city, state_province, country,
      verification_status, is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    orgName,
    slug,
    determineOrgType(orgName),
    programData.website || null,
    programData.location?.city || null,
    programData.location?.state || null,
    'USA',
    'pending',
    true
  ]);

  return { id: result.rows[0].id, isNew: true };
}

function determineOrgType(orgName) {
  const name = orgName.toLowerCase();
  if (name.includes('university') || name.includes('college') || name.includes('institute')) {
    return 'university';
  } else if (name.includes('foundation')) {
    return 'nonprofit';
  } else {
    return 'organization';
  }
}

async function createProgram(originalProgram, programData, organizationId, client) {
  const slug = originalProgram.program_name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  const result = await client.query(`
    INSERT INTO programs (
      organization_id, name, slug, description, short_description,
      program_type, target_audience, selectivity_tier,
      estimated_acceptance_rate, status, data_source, duration_value
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id
  `, [
    organizationId,
    originalProgram.program_name,
    slug,
    programData.description || originalProgram.description,
    programData.description ? programData.description.substring(0, 500) : null,
    programData.type || 'program',
    programData.target_audience || 'high_school',
    programData.selectivity_tier || 'open',
    originalProgram.selectivity_percent || null,
    'active',
    'validated_import',
    programData.duration_weeks || originalProgram.duration_weeks
  ]);

  return result.rows[0].id;
}

async function addProgramAttributes(originalProgram, programData, programId, client) {
  const attributes = [
    ['cost_category', programData.cost_category || originalProgram.cost_category, 'string'],
    ['grade_level_min', programData.grade_level_min || originalProgram.grade_level, 'integer'],
    ['grade_level_max', programData.grade_level_max || originalProgram.grade_level, 'integer'],
    ['duration_weeks', programData.duration_weeks || originalProgram.duration_weeks, 'integer'],
    ['citizenship_required', originalProgram.citizenship_required, 'string'],
    ['application_requirements', originalProgram.application_requirements, 'string'],
    ['key_benefits', programData.key_benefits || originalProgram.key_benefits, 'string'],
    ['residential_status', originalProgram.residential_day, 'string']
  ];

  let count = 0;
  for (const [attrName, value, type] of attributes) {
    if (value !== null && value !== undefined && value !== '') {
      try {
        const attrDef = await client.query('SELECT id FROM attribute_definitions WHERE name = $1', [attrName]);
        if (attrDef.rows.length > 0) {
          const valueColumn = `value_${type}`;
          await client.query(`
            INSERT INTO program_attributes (program_id, attribute_definition_id, ${valueColumn})
            VALUES ($1, $2, $3)
            ON CONFLICT (program_id, attribute_definition_id) DO NOTHING
          `, [programId, attrDef.rows[0].id, value]);
          count++;
        }
      } catch (error) {
        // Ignore attribute errors
      }
    }
  }
  return count;
}

async function linkProgramCategories(programData, programId, client) {
  const subjects = programData.subjects || [];
  let count = 0;

  for (const subjectSlug of subjects) {
    try {
      const category = await client.query('SELECT id FROM categories WHERE slug = $1', [subjectSlug]);
      if (category.rows.length > 0) {
        await client.query(`
          INSERT INTO program_categories (program_id, category_id, is_primary)
          VALUES ($1, $2, $3)
          ON CONFLICT (program_id, category_id) DO NOTHING
        `, [programId, category.rows[0].id, count === 0]);
        count++;
      }
    } catch (error) {
      // Ignore category errors
    }
  }

  return count;
}

function determineSelectivityTier(selectivityPercent) {
  if (!selectivityPercent) return 'open';
  const percent = parseInt(selectivityPercent);
  if (percent <= 10) return 'elite';
  else if (percent <= 25) return 'highly_selective';
  else if (percent <= 50) return 'selective';
  else return 'open';
}

function determineSubjects(program) {
  const subjects = [];
  const subjectArea = (program.subject_area || '').toLowerCase();
  const programType = (program.program_type || '').toLowerCase();
  const programName = (program.program_name || '').toLowerCase();

  if (subjectArea.includes('computer') || programName.includes('coding') || programName.includes('ai')) {
    subjects.push('computer-science');
  }
  if (subjectArea.includes('math') || programName.includes('math')) {
    subjects.push('mathematics');
  }
  if (subjectArea.includes('engineering') || programName.includes('engineering')) {
    subjects.push('engineering');
  }
  if (subjectArea.includes('stem') || subjects.length > 0) {
    subjects.push('stem');
  }
  if (programName.includes('leadership') || subjectArea.includes('leadership')) {
    subjects.push('leadership');
  }
  if (subjectArea.includes('business') || programName.includes('business')) {
    subjects.push('business');
  }
  
  return subjects.length > 0 ? subjects : ['high-school'];
}

// Bind helper methods to the global scope for the main function
global.createOrganization = createOrganization;
global.createProgram = createProgram;
global.addProgramAttributes = addProgramAttributes;
global.linkProgramCategories = linkProgramCategories;
global.determineSelectivityTier = determineSelectivityTier;
global.determineSubjects = determineSubjects;

// Run population
populateValidatedData();
