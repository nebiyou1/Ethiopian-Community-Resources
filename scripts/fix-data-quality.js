#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://qvqybobnsaikaknsdqhw.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class DataQualityFixer {
    constructor() {
        this.originalData = null;
        this.processedPrograms = [];
        this.organizationMap = new Map();
        this.validationResults = {
            total: 0,
            fixed: 0,
            errors: 0,
            warnings: 0
        };
    }

    async run() {
        console.log('🚀 Starting data quality improvement process...');
        
        try {
            // Load original JSON data
            await this.loadOriginalData();
            
            // Process and validate each program
            await this.processPrograms();
            
            // Update database with improved data
            await this.updateDatabase();
            
            // Report results
            this.reportResults();
            
        } catch (error) {
            console.error('❌ Data quality improvement failed:', error);
            process.exit(1);
        }
    }

    async loadOriginalData() {
        console.log('📚 Loading original JSON data...');
        
        const dataPath = path.join(__dirname, '../docs/inputdata.json');
        const rawData = fs.readFileSync(dataPath, 'utf8');
        this.originalData = JSON.parse(rawData);
        
        console.log(`✅ Loaded ${this.originalData.programs.length} programs from original JSON`);
    }

    async processPrograms() {
        console.log('🔧 Processing and validating programs...');
        
        for (const program of this.originalData.programs) {
            this.validationResults.total++;
            
            try {
                const processedProgram = await this.processProgram(program);
                this.processedPrograms.push(processedProgram);
                this.validationResults.fixed++;
                
                if (this.validationResults.total % 20 === 0) {
                    console.log(`📊 Processed ${this.validationResults.total} programs...`);
                }
                
            } catch (error) {
                console.error(`❌ Error processing program ${program.id}: ${error.message}`);
                this.validationResults.errors++;
            }
        }
    }

    async processProgram(program) {
        // Extract organization name from program name or website
        const organizationName = this.extractOrganizationName(program);
        const organizationSlug = this.createSlug(organizationName);
        
        // Create or get organization
        let organization = this.organizationMap.get(organizationSlug);
        if (!organization) {
            organization = await this.createOrganization(program, organizationName, organizationSlug);
            this.organizationMap.set(organizationSlug, organization);
        }

        // Create program description from available fields
        const description = this.createDescription(program);
        
        // Map selectivity to tier
        const selectivityTier = this.mapSelectivityTier(program.selectivity_percent);
        
        // Clean and validate website
        const website = this.validateWebsite(program.website);
        
        return {
            // Core program info
            name: program.program_name,
            slug: this.createSlug(program.program_name),
            description: description,
            short_description: program.key_benefits || program.special_eligibility || null,
            
            // Program classification
            program_type: this.mapProgramType(program.program_type),
            target_audience: 'high_school',
            selectivity_tier: selectivityTier,
            estimated_acceptance_rate: this.parseSelectivity(program.selectivity_percent),
            
            // Duration info
            duration_type: 'weeks',
            duration_value: this.parseDuration(program.duration_weeks),
            
            // Organization reference
            organization_id: organization.id,
            
            // Status
            status: 'active',
            
            // Attributes to store in program_attributes table
            attributes: {
                cost_category: program.cost_category,
                grade_level: program.grade_level,
                subject_area: program.subject_area,
                location_state: program.location_state,
                residential_status: program.residential_day,
                financial_aid: program.financial_aid,
                citizenship_required: program.citizenship_required,
                application_requirements: program.application_requirements,
                key_benefits: program.key_benefits,
                special_eligibility: program.special_eligibility,
                application_deadline: program.application_deadline,
                website: website
            }
        };
    }

    extractOrganizationName(program) {
        // Try to extract organization from program name
        const programName = program.program_name;
        
        // Common patterns for organization extraction
        const patterns = [
            // "MIT PRIMES" -> "MIT"
            /^([A-Z]{2,5})\s+/,
            // "Harvard Summer School" -> "Harvard"
            /^(\w+)\s+(Summer|Program|School|Institute|Foundation|Center|Academy)/i,
            // "Fred Hutch SHIP" -> "Fred Hutch"
            /^([^-]+?)\s+[A-Z]{2,}/,
            // "All Star Code" -> "All Star Code"
            /^([^-\(]+)/
        ];

        for (const pattern of patterns) {
            const match = programName.match(pattern);
            if (match) {
                let orgName = match[1].trim();
                // Clean up common suffixes
                orgName = orgName.replace(/\s+(Program|Summer|School)$/i, '');
                if (orgName.length > 2) {
                    return orgName;
                }
            }
        }

        // Fallback: use first 2-3 words
        const words = programName.split(' ');
        return words.slice(0, Math.min(3, words.length)).join(' ');
    }

    async createOrganization(program, name, slug) {
        // Extract location info
        const city = this.extractCityFromState(program.location_state);
        const state = program.location_state === 'Various' ? 'National' : program.location_state;
        
        const organization = {
            name: name,
            slug: slug,
            type: this.determineOrganizationType(name, program),
            website: this.validateWebsite(program.website),
            city: city,
            state_province: state,
            country: 'USA',
            verification_status: 'pending',
            trust_score: 0,
            is_active: true
        };

        // Insert into database and return with ID
        const { data, error } = await supabase
            .from('organizations')
            .insert(organization)
            .select()
            .single();

        if (error) {
            console.warn(`⚠️ Could not create organization ${name}: ${error.message}`);
            // Return a mock organization for processing
            return { ...organization, id: `temp-${Date.now()}` };
        }

        return data;
    }

    createDescription(program) {
        const parts = [];
        
        if (program.key_benefits) {
            parts.push(program.key_benefits);
        }
        
        if (program.special_eligibility) {
            parts.push(`Eligibility: ${program.special_eligibility}`);
        }
        
        if (program.subject_area && program.subject_area !== 'General') {
            parts.push(`Focus: ${program.subject_area.replace(/_/g, ' ')}`);
        }
        
        if (program.financial_aid && program.financial_aid !== 'None') {
            parts.push(`Financial Aid: ${program.financial_aid}`);
        }

        return parts.length > 0 ? parts.join('. ') : null;
    }

    mapSelectivityTier(selectivityPercent) {
        const percent = this.parseSelectivity(selectivityPercent);
        if (!percent) return 'open';
        
        if (percent <= 10) return 'elite';
        if (percent <= 25) return 'highly_selective';
        if (percent <= 50) return 'selective';
        return 'open';
    }

    parseSelectivity(value) {
        if (!value || value === 'N/A' || value === 'Various') return null;
        const num = parseInt(value);
        return isNaN(num) ? null : num;
    }

    parseDuration(value) {
        if (!value || value === 'N/A' || value === 'Various') return null;
        const num = parseInt(value);
        return isNaN(num) ? null : num;
    }

    mapProgramType(type) {
        const typeMap = {
            'Summer_Program': 'summer_program',
            'Competition': 'competition',
            'Scholarship': 'scholarship',
            'Award': 'award',
            'Workshop': 'workshop',
            'Conference': 'conference',
            'Multi_Year': 'multi_year',
            'Year_Program': 'year_program',
            'Camp': 'camp'
        };
        
        return typeMap[type] || 'program';
    }

    determineOrganizationType(name, program) {
        const nameUpper = name.toUpperCase();
        
        if (nameUpper.includes('UNIVERSITY') || nameUpper.includes('COLLEGE') || 
            nameUpper.includes('MIT') || nameUpper.includes('HARVARD') || 
            nameUpper.includes('STANFORD')) {
            return 'university';
        }
        
        if (nameUpper.includes('FOUNDATION') || nameUpper.includes('INSTITUTE') || 
            nameUpper.includes('CENTER') || nameUpper.includes('SOCIETY')) {
            return 'nonprofit';
        }
        
        if (nameUpper.includes('GOVERNMENT') || nameUpper.includes('NASA') || 
            nameUpper.includes('NIH') || nameUpper.includes('NSF')) {
            return 'government';
        }
        
        return 'organization';
    }

    extractCityFromState(locationState) {
        const cityStateMap = {
            'CA': 'California',
            'NY': 'New York',
            'MA': 'Boston',
            'WA': 'Seattle',
            'TX': 'Texas',
            'DC': 'Washington DC',
            'Various': 'Various',
            'National': 'Various'
        };
        
        return cityStateMap[locationState] || null;
    }

    validateWebsite(url) {
        if (!url || url === 'N/A' || url === 'Various') return null;
        
        // Clean up URL
        let cleanUrl = url.trim();
        if (!cleanUrl.startsWith('http')) {
            cleanUrl = 'https://' + cleanUrl;
        }
        
        try {
            new URL(cleanUrl);
            return cleanUrl;
        } catch {
            return null;
        }
    }

    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async updateDatabase() {
        console.log('💾 Updating database with improved data...');
        
        // Clear existing data
        console.log('🗑️ Clearing existing program data...');
        await supabase.from('program_attributes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('programs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        // Insert improved programs
        for (const program of this.processedPrograms) {
            try {
                // Insert program
                const { data: programData, error: programError } = await supabase
                    .from('programs')
                    .insert({
                        name: program.name,
                        slug: program.slug,
                        description: program.description,
                        short_description: program.short_description,
                        program_type: program.program_type,
                        target_audience: program.target_audience,
                        selectivity_tier: program.selectivity_tier,
                        estimated_acceptance_rate: program.estimated_acceptance_rate,
                        duration_type: program.duration_type,
                        duration_value: program.duration_value,
                        organization_id: program.organization_id,
                        status: program.status
                    })
                    .select()
                    .single();

                if (programError) {
                    console.warn(`⚠️ Could not insert program ${program.name}: ${programError.message}`);
                    continue;
                }

                // Insert attributes
                await this.insertProgramAttributes(programData.id, program.attributes);
                
            } catch (error) {
                console.error(`❌ Error updating program ${program.name}: ${error.message}`);
                this.validationResults.errors++;
            }
        }
    }

    async insertProgramAttributes(programId, attributes) {
        // Get attribute definitions
        const { data: attrDefs } = await supabase
            .from('attribute_definitions')
            .select('id, name, data_type');

        const attrDefMap = new Map(attrDefs.map(def => [def.name, def]));

        for (const [attrName, value] of Object.entries(attributes)) {
            if (!value) continue;

            const attrDef = attrDefMap.get(attrName);
            if (!attrDef) continue;

            const attrValue = {
                program_id: programId,
                attribute_definition_id: attrDef.id
            };

            // Set value based on data type
            switch (attrDef.data_type) {
                case 'string':
                    attrValue.value_string = String(value);
                    break;
                case 'integer':
                    const intVal = parseInt(value);
                    if (!isNaN(intVal)) attrValue.value_integer = intVal;
                    break;
                case 'boolean':
                    attrValue.value_boolean = Boolean(value);
                    break;
                case 'date':
                    try {
                        attrValue.value_date = new Date(value).toISOString();
                    } catch {
                        // Skip invalid dates
                    }
                    break;
            }

            await supabase.from('program_attributes').insert(attrValue);
        }
    }

    reportResults() {
        console.log('\n📊 Data Quality Improvement Results:');
        console.log('=====================================');
        console.log(`Total programs processed: ${this.validationResults.total}`);
        console.log(`Successfully improved: ${this.validationResults.fixed}`);
        console.log(`Errors encountered: ${this.validationResults.errors}`);
        console.log(`Organizations created: ${this.organizationMap.size}`);
        console.log('\n✅ Data quality improvement completed!');
    }
}

// Run the data quality fixer
if (require.main === module) {
    const fixer = new DataQualityFixer();
    fixer.run().catch(console.error);
}

module.exports = DataQualityFixer;
