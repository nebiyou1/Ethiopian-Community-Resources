const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

class DatabaseServiceV2 {
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

  // =====================================================
  // PROGRAMS CRUD OPERATIONS
  // =====================================================

  async getAllPrograms(filters = {}) {
    if (this.useSupabase) {
      return await this.getProgramsFromSupabase(filters);
    } else {
      return this.getProgramsFromJson(filters);
    }
  }

  async getProgramsFromSupabase(filters = {}) {
    try {
      // Build the query with joins to get organization and attributes
      let query = supabase
        .from('programs')
        .select(`
          *,
          organizations!inner(
            id,
            name,
            slug,
            type,
            website,
            city,
            state_province,
            country,
            verification_status,
            trust_score
          ),
          program_attributes(
            id,
            attribute_definitions!inner(
              name,
              display_name,
              data_type
            ),
            value_string,
            value_integer,
            value_decimal,
            value_boolean,
            value_date,
            value_array
          ),
          program_categories(
            id,
            categories!inner(
              name,
              slug,
              category_type,
              icon,
              color
            ),
            is_primary,
            relevance_score
          )
        `)
        .eq('status', 'active')
        .eq('organizations.is_active', true);

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

      if (filters.organization_type) {
        query = query.eq('organizations.type', filters.organization_type);
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
        console.error('Supabase query error:', error);
        throw error;
      }

      // Transform the data to match the expected format
      return this.transformSupabasePrograms(data || []);

    } catch (error) {
      console.error('Error fetching programs from Supabase:', error);
      throw error;
    }
  }

  transformSupabasePrograms(programs) {
    return programs.map(program => {
      // Flatten attributes into a single object
      const attributes = {};
      if (program.program_attributes) {
        program.program_attributes.forEach(attr => {
          const attrDef = attr.attribute_definitions;
          if (attrDef) {
            let value = null;
            switch (attrDef.data_type) {
              case 'string':
                value = attr.value_string;
                break;
              case 'integer':
                value = attr.value_integer;
                break;
              case 'decimal':
                value = attr.value_decimal;
                break;
              case 'boolean':
                value = attr.value_boolean;
                break;
              case 'date':
                value = attr.value_date;
                break;
              case 'array':
                value = attr.value_array;
                break;
            }
            attributes[attrDef.name] = value;
          }
        });
      }

      // Extract categories
      const categories = program.program_categories?.map(pc => ({
        name: pc.categories?.name,
        slug: pc.categories?.slug,
        type: pc.categories?.category_type,
        icon: pc.categories?.icon,
        color: pc.categories?.color,
        is_primary: pc.is_primary,
        relevance_score: pc.relevance_score
      })) || [];

      // Return transformed program
      return {
        id: program.id,
        program_name: program.name,
        slug: program.slug,
        description: program.description,
        short_description: program.short_description,
        program_type: program.program_type,
        target_audience: program.target_audience,
        selectivity_tier: program.selectivity_tier,
        estimated_acceptance_rate: program.estimated_acceptance_rate,
        duration_type: program.duration_type,
        duration_value: program.duration_value,
        rating_average: program.rating_average,
        rating_count: program.rating_count,
        status: program.status,
        created_at: program.created_at,
        updated_at: program.updated_at,
        
        // Organization data
        organization: program.organizations ? {
          id: program.organizations.id,
          name: program.organizations.name,
          slug: program.organizations.slug,
          type: program.organizations.type,
          website: program.organizations.website,
          city: program.organizations.city,
          state: program.organizations.state_province,
          country: program.organizations.country,
          verification_status: program.organizations.verification_status,
          trust_score: program.organizations.trust_score
        } : null,

        // Flattened attributes for backward compatibility
        ...attributes,
        
        // Additional structured data
        categories: categories,
        attributes: attributes,
        
        // Legacy field mappings for backward compatibility
        organization_name: program.organizations?.name,
        location_city: program.organizations?.city,
        location_state: program.organizations?.state_province,
        website: program.organizations?.website,
        cost_category: attributes.cost_category,
        grade_level: attributes.grade_level_min,
        duration_weeks: attributes.duration_weeks || program.duration_value,
        selectivity_percent: program.estimated_acceptance_rate,
        financial_aid: attributes.financial_aid_available ? 'Available' : null,
        citizenship_required: attributes.citizenship_required,
        application_requirements: attributes.application_requirements,
        key_benefits: attributes.key_benefits,
        residential_day: attributes.residential_status
      };
    });
  }

  getProgramsFromJson(filters) {
    let results = [...(this.jsonData.programs || [])];
    
    // Apply basic filters
    if (filters.program_type) {
      results = results.filter(p => p.program_type === filters.program_type);
    }
    
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(p => 
        (p.program_name || '').toLowerCase().includes(searchTerm) ||
        (p.description || '').toLowerCase().includes(searchTerm) ||
        (p.organization || '').toLowerCase().includes(searchTerm)
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
      const { data, error } = await supabase
        .from('programs')
        .select(`
          *,
          organizations!inner(*),
          program_attributes(
            *,
            attribute_definitions!inner(*)
          ),
          program_categories(
            *,
            categories!inner(*)
          )
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();
      
      if (error) throw error;
      return data ? this.transformSupabasePrograms([data])[0] : null;
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
  // ORGANIZATIONS
  // =====================================================

  async getAllOrganizations(filters = {}) {
    if (this.useSupabase) {
      let query = supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true);

      if (filters.type) {
        query = query.eq('type', filters.type);
      }

      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    } else {
      // Extract unique organizations from JSON data
      const organizations = new Map();
      this.jsonData.programs?.forEach(program => {
        if (program.organization && !organizations.has(program.organization)) {
          organizations.set(program.organization, {
            id: organizations.size + 1,
            name: program.organization,
            website: program.website,
            city: program.location_city,
            state: program.location_state
          });
        }
      });
      return Array.from(organizations.values());
    }
  }

  // =====================================================
  // CATEGORIES
  // =====================================================

  async getAllCategories(filters = {}) {
    if (this.useSupabase) {
      let query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      if (filters.category_type) {
        query = query.eq('category_type', filters.category_type);
      }

      const { data, error } = await query.order('display_order').order('name');
      if (error) throw error;
      return data || [];
    } else {
      // Return static categories for JSON mode
      return [
        { id: 1, name: 'STEM', slug: 'stem', category_type: 'subject' },
        { id: 2, name: 'Computer Science', slug: 'computer-science', category_type: 'subject' },
        { id: 3, name: 'Mathematics', slug: 'mathematics', category_type: 'subject' },
        { id: 4, name: 'Engineering', slug: 'engineering', category_type: 'subject' },
        { id: 5, name: 'Liberal Arts', slug: 'liberal-arts', category_type: 'subject' },
        { id: 6, name: 'Business', slug: 'business', category_type: 'subject' },
        { id: 7, name: 'Leadership', slug: 'leadership', category_type: 'subject' },
        { id: 8, name: 'High School Students', slug: 'high-school', category_type: 'demographic' },
        { id: 9, name: 'College Students', slug: 'college', category_type: 'demographic' }
      ];
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
          organizations!inner(
            type,
            city,
            state_province
          ),
          program_attributes!inner(
            attribute_definitions!inner(name),
            value_string
          )
        `)
        .eq('status', 'active')
        .eq('organizations.is_active', true);

      if (error) throw error;

      const stats = {
        totalPrograms: programs.length,
        programTypes: this.getDistribution(programs, 'program_type'),
        targetAudiences: this.getDistribution(programs, 'target_audience'),
        selectivityTiers: this.getDistribution(programs, 'selectivity_tier'),
        organizationTypes: this.getDistribution(programs.map(p => p.organizations), 'type'),
        topStates: this.getDistribution(programs.map(p => p.organizations), 'state_province'),
        
        // Cost categories from attributes
        costCategories: this.getCostCategoryDistribution(programs),
        
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
      console.error('Error getting statistics from Supabase:', error);
      throw error;
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

  getCostCategoryDistribution(programs) {
    const costCategories = {};
    programs.forEach(program => {
      const costAttr = program.program_attributes?.find(attr => 
        attr.attribute_definitions?.name === 'cost_category'
      );
      const category = costAttr?.value_string || 'Unknown';
      costCategories[category] = (costCategories[category] || 0) + 1;
    });
    
    return Object.entries(costCategories)
      .map(([category, count]) => ({ cost_category: category, count }))
      .sort((a, b) => b.count - a.count);
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
        const [programTypes, targetAudiences, selectivityTiers, organizationTypes, categories] = await Promise.all([
          supabase.from('programs').select('program_type').eq('status', 'active'),
          supabase.from('programs').select('target_audience').eq('status', 'active'),
          supabase.from('programs').select('selectivity_tier').eq('status', 'active'),
          supabase.from('organizations').select('type').eq('is_active', true),
          this.getAllCategories()
        ]);

        return {
          program_types: [...new Set(programTypes.data?.map(p => p.program_type).filter(Boolean))],
          target_audiences: [...new Set(targetAudiences.data?.map(p => p.target_audience).filter(Boolean))],
          selectivity_tiers: [...new Set(selectivityTiers.data?.map(p => p.selectivity_tier).filter(Boolean))],
          organization_types: [...new Set(organizationTypes.data?.map(o => o.type).filter(Boolean))],
          categories: categories
        };
      } catch (error) {
        console.error('Error getting filter options:', error);
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
}

module.exports = new DatabaseServiceV2();
