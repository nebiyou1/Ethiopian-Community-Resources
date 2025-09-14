const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

class DatabaseServiceProduction {
  constructor() {
    this.jsonData = null;
    this.useSupabase = process.env.USE_SUPABASE === 'true';
    this.loadJsonData();
  }

  loadJsonData() {
    try {
      const dataPath = path.join(__dirname, '../docs/inputdata.json');
      const rawData = fs.readFileSync(dataPath, 'utf8');
      
      // Clean the JSON data - remove any trailing commas or invalid characters
      const cleanedData = rawData
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\s+$/, '') // Remove trailing whitespace
        .trim();
      
      this.jsonData = JSON.parse(cleanedData);
      
      // Clean the data after loading
      this.cleanProgramData();
      
      console.log(`✅ Loaded ${this.jsonData.programs?.length || 0} programs from JSON`);
    } catch (error) {
      console.error('❌ Error loading JSON data:', error.message);
      
      // Try to load a minimal fallback
      this.jsonData = { 
        programs: [], 
        metadata: {
          database_name: "ethiopia_community_resources",
          version: "2.0.0",
          last_updated: new Date().toISOString(),
          total_programs: 0,
          description: "Fallback data due to JSON parsing error"
        }
      };
    }
  }

  cleanProgramData() {
    if (!this.jsonData.programs) return;
    
    const originalCount = this.jsonData.programs.length;
    
    this.jsonData.programs = this.jsonData.programs.filter(program => {
      // Remove programs with invalid names
      if (!program.program_name || 
          program.program_name.trim() === '' ||
          program.program_name.toLowerCase() === 'unknown program' ||
          program.program_name.toLowerCase() === 'n/a') {
        return false;
      }
      
      // Clean program name
      program.program_name = program.program_name.toString().trim();
      
      // Clean organization
      if (!program.organization) {
        program.organization = {};
      }
      if (!program.organization.name || 
          program.organization.name.toLowerCase() === 'unknown organization') {
        // Try to extract from program name
        const words = program.program_name.split(/\s+/);
        program.organization.name = words.slice(0, Math.min(3, words.length - 1)).join(' ');
      }
      
      // Clean dates
      if (program.application_deadline) {
        const deadline = program.application_deadline.toString().trim();
        if (deadline === 'N/A' || deadline === 'TBD' || deadline === '' || 
            deadline.toLowerCase().includes('invalid') ||
            deadline.toLowerCase().includes('rolling')) {
          program.application_deadline = null;
          program.deadline_note = 'Refer to website for current deadline';
        } else {
          const date = new Date(deadline);
          if (isNaN(date.getTime()) || date.getFullYear() < 2020 || date.getFullYear() > 2030) {
            program.application_deadline = null;
            program.deadline_note = 'Refer to website for current deadline';
          } else {
            program.application_deadline = date.toISOString().split('T')[0];
          }
        }
      }
      
      // Clean grade levels
      if (program.grade_level) {
        const gradeStr = program.grade_level.toString().trim();
        if (gradeStr.match(/^\d+$/)) {
          // Single grade - keep as is
          const grade = parseInt(gradeStr);
          if (grade < 6 || grade > 12) {
            program.grade_level = null;
          }
        } else if (gradeStr.match(/^\d+-\d+$/)) {
          // Range - validate
          const [min, max] = gradeStr.split('-').map(n => parseInt(n.trim()));
          if (min < 6 || max > 12 || min > max) {
            program.grade_level = null;
          }
        } else if (gradeStr.toLowerCase().includes('high school')) {
          program.grade_level = '9-12';
        } else if (gradeStr.toLowerCase().includes('middle school')) {
          program.grade_level = '6-8';
        } else {
          program.grade_level = null;
        }
      }
      
      // Clean cost category
      const validCategories = ['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID'];
      if (!program.cost_category || !validCategories.includes(program.cost_category)) {
        program.cost_category = 'FREE'; // Default
      }
      
      // Clean prestige level
      const validLevels = ['elite', 'highly-selective', 'selective', 'accessible'];
      if (!program.prestige_level || !validLevels.includes(program.prestige_level)) {
        program.prestige_level = 'accessible'; // Default
      }
      
      // Clean location
      if (!program.location || program.location.trim() === '') {
        if (program.organization && (program.organization.city || program.organization.state)) {
          const locationParts = [];
          if (program.organization.city) locationParts.push(program.organization.city);
          if (program.organization.state) locationParts.push(program.organization.state);
          program.location = locationParts.join(', ');
        } else {
          program.location = 'Various locations';
        }
      }
      
      return true; // Keep this program
    });
    
    console.log(`🧹 Cleaned data: ${originalCount} → ${this.jsonData.programs.length} valid programs`);
  }

  async getAllPrograms(filters = {}) {
    if (this.useSupabase) {
      return await this.getProgramsFromSupabase(filters);
    } else {
      return this.getProgramsFromJson(filters);
    }
  }

  async getProgramsFromSupabase(filters = {}) {
    try {
      console.log('🔍 Fetching programs from Supabase...');
      
      // Start with a simple query
      let query = supabase
        .from('programs')
        .select(`
          *,
          organizations(
            id,
            name,
            slug,
            type,
            website,
            city,
            state_province,
            country,
            is_active
          ),
          program_attributes(
            attribute_definition_id,
            value_string,
            value_integer,
            value_decimal,
            value_boolean,
            value_date,
            value_timestamp,
            value_json,
            value_array,
            attribute_definitions(
              name,
              display_name,
              data_type
            )
          )
        `)
        .eq('status', 'active');

      // Apply filters
      if (filters.program_type) {
        query = query.eq('program_type', filters.program_type);
      }

      if (filters.target_audience) {
        query = query.eq('target_audience', filters.target_audience);
      }

      if (filters.selectivity_tier) {
        query = query.eq('selectivity_tier', filters.selectivity_tier);
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply sorting
      if (filters.sort) {
        switch (filters.sort) {
          case 'name':
            query = query.order('name');
            break;
          case 'rating':
            query = query.order('rating_average', { ascending: false });
            break;
          case 'newest':
            query = query.order('created_at', { ascending: false });
            break;
          default:
            query = query.order('name');
        }
      } else {
        query = query.order('name');
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      if (filters.offset) {
        query = query.range(parseInt(filters.offset), parseInt(filters.offset) + parseInt(filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase query error:', error);
        throw error;
      }

      console.log(`✅ Fetched ${data?.length || 0} programs from Supabase`);
      
      // Transform the data to match the expected format
      return this.transformSupabasePrograms(data || []);

    } catch (error) {
      console.error('❌ Error fetching programs from Supabase:', error);
      // Fallback to JSON data
      console.log('🔄 Falling back to JSON data...');
      return this.getProgramsFromJson(filters);
    }
  }

  transformSupabasePrograms(programs) {
    return programs.map(program => {
      // Extract attributes
      const attributes = {};
      if (program.program_attributes) {
        program.program_attributes.forEach(attr => {
          const attrName = attr.attribute_definitions?.name;
          if (attrName) {
            // Get the appropriate value based on data type
            let value = null;
            if (attr.value_string !== null) value = attr.value_string;
            else if (attr.value_integer !== null) value = attr.value_integer;
            else if (attr.value_decimal !== null) value = attr.value_decimal;
            else if (attr.value_boolean !== null) value = attr.value_boolean;
            else if (attr.value_date !== null) value = attr.value_date;
            else if (attr.value_timestamp !== null) value = attr.value_timestamp;
            else if (attr.value_json !== null) value = attr.value_json;
            else if (attr.value_array !== null) value = attr.value_array;
            
            attributes[attrName] = value;
          }
        });
      }

      // Return transformed program with simplified structure
      return {
        id: program.id,
        program_name: program.name,
        slug: program.slug,
        description: program.description,
        short_description: program.short_description,
        program_type: program.program_type,
        target_audience: program.target_audience,
        selectivity_tier: program.selectivity_tier,
        // Grade level attributes
        grade_level_min: attributes.grade_level_min,
        grade_level_max: attributes.grade_level_max,
        estimated_acceptance_rate: program.estimated_acceptance_rate,
        duration_type: program.duration_type,
        duration_value: program.duration_value,
        rating_average: program.rating_average,
        rating_count: program.rating_count,
        status: program.status,
        created_at: program.created_at,
        updated_at: program.updated_at,
        
        // Organization data - handle missing gracefully
        organization: program.organizations ? {
          id: program.organizations.id,
          name: program.organizations.name || 'N/A',
          slug: program.organizations.slug,
          type: program.organizations.type || 'organization',
          website: program.organizations.website,
          city: program.organizations.city,
          state: program.organizations.state_province,
          country: program.organizations.country || 'USA'
        } : null,
        
        // Legacy field mappings for backward compatibility - only show if available
        organization_name: program.organizations?.name || null,
        location_city: program.organizations?.city || null,
        location_state: program.organizations?.state_province || null,
        website: program.organizations?.website || null,
        duration_weeks: program.duration_value || null,
        selectivity_percent: program.estimated_acceptance_rate || null,
        
        // Only show fields that have meaningful values
        cost_category: this.getCostCategory(program),
        grade_level: this.getGradeLevel(program),
        financial_aid: this.getFinancialAid(program),
        citizenship_required: this.getCitizenshipRequired(program),
        application_requirements: this.getApplicationRequirements(program),
        key_benefits: this.getKeyBenefits(program),
        residential_day: this.getResidentialDay(program)
      };
    });
  }

  getProgramsFromJson(filters) {
    let results = [...(this.jsonData.programs || [])];
    
    // Transform JSON data to match expected frontend structure
    results = results.map(program => ({
      id: program.id,
      program_name: program.program_name,
      slug: this.createSlug(program.program_name),
      description: this.createDescription(program),
      short_description: program.key_benefits || program.special_eligibility || null,
      program_type: program.program_type,
      target_audience: 'high_school',
      selectivity_tier: this.getSelectivityTier(program.selectivity_percent),
      estimated_acceptance_rate: program.selectivity_percent,
      duration_type: 'weeks',
      duration_value: program.duration_weeks,
      rating_average: 0,
      rating_count: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      
      // Organization data (derived from program info)
      organization: {
        name: this.extractOrganizationFromName(program.program_name),
        website: program.website,
        city: this.extractCityFromState(program.location_state),
        state: program.location_state,
        country: 'USA'
      },
      
      // Legacy field mappings for backward compatibility
      organization_name: this.extractOrganizationFromName(program.program_name),
      location_city: this.extractCityFromState(program.location_state),
      location_state: program.location_state,
      website: program.website,
      cost_category: program.cost_category,
      prestige_level: program.prestige_level,
      grade_level: program.grade_level,
      duration_weeks: program.duration_weeks,
      selectivity_percent: program.selectivity_percent,
      financial_aid: program.financial_aid,
      citizenship_required: program.citizenship_required,
      application_requirements: program.application_requirements,
      key_benefits: program.key_benefits,
      residential_day: program.residential_day,
      subject_area: program.subject_area,
      special_eligibility: program.special_eligibility,
      application_deadline: program.application_deadline
    }));
    
    // Apply basic filters
    if (filters.program_type) {
      results = results.filter(p => p.program_type === filters.program_type);
    }
    
    if (filters.costCategory) {
      results = results.filter(p => p.cost_category === filters.costCategory);
    }
    
    if (filters.prestige) {
      results = results.filter(p => p.prestige_level === filters.prestige);
    }
    
    if (filters.gradeLevel) {
      const filterGrade = parseInt(filters.gradeLevel);
      results = results.filter(p => {
        if (!p.grade_level) return false;
        const gradeStr = p.grade_level.toString();
        if (gradeStr.match(/^\d+$/)) {
          const programGrade = parseInt(gradeStr);
          return (filterGrade >= programGrade - 1 && filterGrade <= programGrade + 1);
        } else if (gradeStr.match(/^\d+-\d+$/)) {
          const [min, max] = gradeStr.split('-').map(n => parseInt(n.trim()));
          return (filterGrade >= min && filterGrade <= max);
        } else if (gradeStr.toLowerCase().includes('high school')) {
          return (filterGrade >= 9 && filterGrade <= 12);
        } else if (gradeStr.toLowerCase().includes('middle school')) {
          return (filterGrade >= 6 && filterGrade <= 8);
        }
        return true;
      });
    }
    
    if (filters.location) {
      const locationTerm = filters.location.toLowerCase();
      results = results.filter(p => 
        (p.location_city || '').toLowerCase().includes(locationTerm) ||
        (p.location_state || '').toLowerCase().includes(locationTerm) ||
        (p.organization?.city || '').toLowerCase().includes(locationTerm) ||
        (p.organization?.state || '').toLowerCase().includes(locationTerm)
      );
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(p => 
        (p.program_name || '').toLowerCase().includes(searchTerm) ||
        (p.description || '').toLowerCase().includes(searchTerm) ||
        (p.organization_name || '').toLowerCase().includes(searchTerm) ||
        (p.subject_area || '').toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply sorting
    if (filters.sort) {
      switch (filters.sort) {
        case 'name':
          results.sort((a, b) => (a.program_name || '').localeCompare(b.program_name || ''));
          break;
        case 'rating':
          results.sort((a, b) => (b.rating_average || 0) - (a.rating_average || 0));
          break;
        default:
          results.sort((a, b) => (a.program_name || '').localeCompare(b.program_name || ''));
      }
    }
    
    if (filters.limit) {
      results = results.slice(0, parseInt(filters.limit));
    }
    
    return results;
  }

  async getProgramById(id) {
    if (this.useSupabase) {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select(`
            *,
            organizations(*)
          `)
          .eq('id', id)
          .eq('status', 'active')
          .single();
        
        if (error) throw error;
        return data ? this.transformSupabasePrograms([data])[0] : null;
      } catch (error) {
        console.error('Error fetching program by ID:', error);
        return null;
      }
    } else {
      return this.jsonData.programs?.find(program => program.id === parseInt(id));
    }
  }

  async searchPrograms(searchTerm, filters = {}) {
    if (this.useSupabase) {
      return await this.getProgramsFromSupabase({
        ...filters,
        search: searchTerm
      });
    } else {
      return this.getProgramsFromJson({
        ...filters,
        search: searchTerm
      });
    }
  }

  // =====================================================
  // STATISTICS
  // =====================================================

  async getStatistics() {
    if (this.useSupabase) {
      return await this.getStatisticsFromSupabase();
    } else {
      return this.getStatisticsFromJson();
    }
  }

  async getStatisticsFromSupabase() {
    try {
      // Get program counts and basic stats
      const { data: programs, error } = await supabase
        .from('programs')
        .select(`
          id,
          program_type,
          target_audience,
          selectivity_tier,
          rating_average,
          duration_value,
          organizations(
            type,
            city,
            state_province
          )
        `)
        .eq('status', 'active');

      if (error) throw error;

      const stats = {
        totalPrograms: programs.length,
        programTypes: this.getDistribution(programs, 'program_type'),
        targetAudiences: this.getDistribution(programs, 'target_audience'),
        selectivityTiers: this.getDistribution(programs, 'selectivity_tier'),
        organizationTypes: this.getDistribution(programs.map(p => p.organizations).filter(Boolean), 'type'),
        topStates: this.getDistribution(programs.map(p => p.organizations).filter(Boolean), 'state_province'),
        
        // Average ratings
        averageRating: this.calculateAverageRating(programs),
        
        // Duration stats
        averageDuration: this.calculateAverageDuration(programs)
      };

      return {
        statistics: stats,
        metadata: {
          database_name: "ethiopia_community_resources",
          version: "2.0.0",
          last_updated: new Date().toISOString(),
          schema_type: "dynamic"
        }
      };

    } catch (error) {
      console.error('❌ Error getting statistics from Supabase:', error);
      return this.getStatisticsFromJson();
    }
  }

  getStatisticsFromJson() {
    const programs = this.jsonData.programs || [];
    
    const stats = {
      totalPrograms: programs.length,
      freePrograms: programs.filter(p => p.cost_category === 'FREE').length,
      paidPrograms: programs.filter(p => p.cost_category === 'PAID').length,
      averageDuration: Math.round(
        programs.reduce((sum, p) => sum + (p.duration_weeks || 0), 0) / programs.length
      ),
      topStates: this.getTopStates(programs),
      topSubjects: this.getTopSubjects(programs)
    };

    return {
      statistics: stats,
      metadata: this.jsonData.metadata || {
        database_name: "ethiopia_community_resources",
        version: "1.0.0",
        last_updated: new Date().toISOString()
      }
    };
  }

  // Helper methods for statistics
  getDistribution(items, field) {
    const distribution = {};
    items.forEach(item => {
      const value = item[field] || 'Unknown';
      distribution[value] = (distribution[value] || 0) + 1;
    });
    
    return Object.entries(distribution)
      .map(([key, count]) => ({ [field]: key, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  calculateAverageRating(programs) {
    const ratedPrograms = programs.filter(p => p.rating_average > 0);
    if (ratedPrograms.length === 0) return 0;
    
    const sum = ratedPrograms.reduce((sum, p) => sum + p.rating_average, 0);
    return Math.round((sum / ratedPrograms.length) * 100) / 100;
  }

  calculateAverageDuration(programs) {
    const programsWithDuration = programs.filter(p => p.duration_value > 0);
    if (programsWithDuration.length === 0) return 0;
    
    const sum = programsWithDuration.reduce((sum, p) => sum + p.duration_value, 0);
    return Math.round(sum / programsWithDuration.length);
  }

  // Legacy helper methods for JSON mode
  getTopStates(programs) {
    const stateCounts = {};
    programs.forEach(program => {
      const state = program.location_state || 'Various';
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    });
    
    return Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  getTopSubjects(programs) {
    const subjectCounts = {};
    programs.forEach(program => {
      const subject = program.subject_area || 'Multi_Disciplinary';
      subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
    });
    
    return Object.entries(subjectCounts)
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  // =====================================================
  // FILTERS
  // =====================================================

  async getFilterOptions() {
    if (this.useSupabase) {
      try {
        const [programTypes, targetAudiences, selectivityTiers, organizationTypes] = await Promise.all([
          supabase.from('programs').select('program_type').eq('status', 'active'),
          supabase.from('programs').select('target_audience').eq('status', 'active'),
          supabase.from('programs').select('selectivity_tier').eq('status', 'active'),
          supabase.from('organizations').select('type').eq('is_active', true)
        ]);

        return {
          program_types: [...new Set(programTypes.data?.map(p => p.program_type).filter(Boolean))],
          target_audiences: [...new Set(targetAudiences.data?.map(p => p.target_audience).filter(Boolean))],
          selectivity_tiers: [...new Set(selectivityTiers.data?.map(p => p.selectivity_tier).filter(Boolean))],
          organization_types: [...new Set(organizationTypes.data?.map(o => o.type).filter(Boolean))],
          categories: []
        };
      } catch (error) {
        console.error('❌ Error getting filter options:', error);
        return this.getDefaultFilterOptions();
      }
    } else {
      return this.getDefaultFilterOptions();
    }
  }

  getDefaultFilterOptions() {
    return {
      program_types: ['summer_program', 'internship', 'scholarship', 'camp', 'program'],
      target_audiences: ['high_school', 'college', 'middle_school'],
      selectivity_tiers: ['open', 'selective', 'highly_selective', 'elite'],
      organization_types: ['university', 'nonprofit', 'organization', 'government'],
      categories: []
    };
  }

  // Helper methods to handle missing data gracefully
  getCostCategory(program) {
    // Try to get from attributes first, then fallback
    const costAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'cost_category'
    );
    return costAttr?.value_string || null; // Don't show if not available
  }

  getGradeLevel(program) {
    const gradeAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'grade_level_min'
    );
    return gradeAttr?.value_string || null;
  }

  getFinancialAid(program) {
    const aidAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'financial_aid_available'
    );
    return aidAttr?.value_boolean ? 'Available' : null;
  }

  getCitizenshipRequired(program) {
    const citizenAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'citizenship_required'
    );
    return citizenAttr?.value_string || null;
  }

  getApplicationRequirements(program) {
    const reqAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'application_requirements'
    );
    return reqAttr?.value_string || null;
  }

  getKeyBenefits(program) {
    const benefitsAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'key_benefits'
    );
    return benefitsAttr?.value_string || null;
  }

  getResidentialDay(program) {
    const residentialAttr = program.program_attributes?.find(attr => 
      attr.attribute_definitions?.name === 'residential_status'
    );
    return residentialAttr?.value_string || null;
  }

  // Utility helper methods
  createSlug(text) {
    if (!text) return '';
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
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

    return parts.length > 0 ? parts.join('. ') : null;
  }

  getSelectivityTier(selectivityPercent) {
    if (!selectivityPercent || selectivityPercent === 'N/A') return 'open';
    
    const percent = parseInt(selectivityPercent);
    if (isNaN(percent)) return 'open';
    
    if (percent <= 10) return 'elite';
    if (percent <= 25) return 'highly_selective';
    if (percent <= 50) return 'selective';
    return 'open';
  }

  extractOrganizationFromName(programName) {
    if (!programName || programName.trim() === '') return 'Unknown Organization';
    
    // Clean the program name first
    let cleanName = programName.trim();
    
    // Common patterns for organization extraction
    const patterns = [
      // "MIT PRIMES" -> "MIT"
      /^([A-Z]{2,5})\s+/,
      // "Harvard Summer School" -> "Harvard"
      /^(\w+)\s+(Summer|Program|School|Institute|Foundation|Center|Academy|University|College)/i,
      // "Fred Hutch SHIP" -> "Fred Hutch"
      /^([^-]+?)\s+[A-Z]{2,}/,
      // "All Star Code" -> "All Star Code"
      /^([^-\(]+)/
    ];

    for (const pattern of patterns) {
      const match = cleanName.match(pattern);
      if (match) {
        let orgName = match[1].trim();
        // Clean up common suffixes
        orgName = orgName.replace(/\s+(Program|Summer|School|Institute|Foundation|Center|Academy|University|College)$/i, '');
        if (orgName.length > 2) {
          return orgName;
        }
      }
    }

    // Fallback: use first 2-3 words, but avoid common program words
    const words = cleanName.split(' ');
    const filteredWords = words.filter(word => 
      !['program', 'summer', 'school', 'institute', 'foundation', 'center', 'academy'].includes(word.toLowerCase())
    );
    
    if (filteredWords.length > 0) {
      return filteredWords.slice(0, Math.min(3, filteredWords.length)).join(' ');
    }
    
    // Last resort: use first 2 words
    return words.slice(0, Math.min(2, words.length)).join(' ');
  }

  extractCityFromState(locationState) {
    if (!locationState) return null;
    
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
}

module.exports = new DatabaseServiceProduction();
