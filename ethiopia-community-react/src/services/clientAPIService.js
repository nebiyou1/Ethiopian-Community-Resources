// Client-side API service using Supabase directly
// This replaces the need for Netlify functions

import { supabase } from '../lib/supabase.js';

class ClientAPIService {
  constructor() {
    this.supabase = supabase;
    this.mockData = this.getMockData();
  }

  async initialize() {
    try {
      // Test connection to make sure Supabase is working
      const { data, error } = await this.supabase
        .from('programs')
        .select('count')
        .limit(1);
      
      if (error) {
        console.warn('Supabase connection failed, using mock data:', error.message);
        this.supabase = null;
      } else {
        console.log('✅ Supabase connected successfully');
      }
    } catch (error) {
      console.warn('Supabase initialization failed, using mock data:', error.message);
      this.supabase = null;
    }
  }

  getMockData() {
    return {
      programs: [
        {
          id: 1,
          program_name: "Ethiopian Community Resources",
          organization: "Community Organization",
          description: "A comprehensive resource platform for the Ethiopian community",
          grade_level: 12,
          cost_category: "FREE",
          program_type: "Resource Platform",
          subject_area: "Community",
          location_state: "Various",
          location_city: "Multiple Cities",
          website: "https://ethiopian-community-resources.netlify.app",
          contact_email: "info@ethiopian-community.org",
          application_deadline: "Rolling",
          selectivity_percent: null,
          duration_weeks: null,
          residential_day: "Online",
          stipend_amount: null,
          contact_phone: null,
          special_eligibility: "Open to all Ethiopian community members",
          key_benefits: "Access to community resources, networking opportunities, educational support",
          application_requirements: "None - open access platform",
          source: "Community Platform"
        },
        {
          id: 2,
          program_name: "Ethiopian Student Association",
          organization: "University Organization",
          description: "Student organization supporting Ethiopian students in higher education",
          grade_level: 13,
          cost_category: "FREE",
          program_type: "Student Organization",
          subject_area: "Community",
          location_state: "Various",
          location_city: "University Campuses",
          website: "https://example-esa.org",
          contact_email: "info@example-esa.org",
          application_deadline: "Rolling",
          selectivity_percent: null,
          duration_weeks: null,
          residential_day: "Both",
          stipend_amount: null,
          contact_phone: null,
          special_eligibility: "Must be enrolled in university",
          key_benefits: "Academic support, cultural events, mentorship",
          application_requirements: "University enrollment verification",
          source: "Student Organization"
        }
      ],
      stats: {
        total_programs: 2,
        total_organizations: 2,
        programs_by_type: {
          "Resource Platform": 1,
          "Student Organization": 1
        },
        programs_by_cost: {
          "FREE": 2
        },
        programs_by_location: {
          "Various": 2
        }
      },
      filters: {
        program_types: ["Resource Platform", "Student Organization"],
        cost_categories: ["FREE"],
        locations: ["Various"],
        grade_levels: [12, 13],
        subject_areas: ["Community"]
      }
    };
  }

  async getPrograms(filters = {}) {
    if (this.supabase) {
      try {
        let query = this.supabase.from('programs').select('*');
        
        // Apply filters based on actual database schema
        if (filters.program_type) {
          query = query.eq('program_type', filters.program_type);
        }
        if (filters.target_audience) {
          query = query.eq('target_audience', filters.target_audience);
        }
        if (filters.selectivity_tier) {
          query = query.eq('selectivity_tier', filters.selectivity_tier);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.warn('Supabase query failed, using mock data:', error.message);
          return this.mockData.programs;
        }
        
        // Map database fields to expected field names
        const mappedData = (data || []).map(program => ({
          ...program,
          program_name: program.name,
          organization: {
            name: 'Unknown Organization', // We'll need to fetch this separately
            city: 'Various',
            state: 'Various'
          },
          cost_category: 'FREE', // Default since we don't have cost data
          duration_weeks: program.duration_value || null,
          grade_level: program.target_audience === 'high_school' ? '9-12' : 'Refer to website',
          application_deadline: null, // We don't have deadline data
          subject_area: program.program_type || 'General',
          description: program.description || program.short_description || 'No description available'
        }));
        
        return mappedData;
      } catch (error) {
        console.warn('Supabase query error, using mock data:', error.message);
        return this.mockData.programs;
      }
    }
    
    // Return mock data
    return this.mockData.programs;
  }

  async getProgramById(id) {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('programs')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.warn('Supabase query failed, using mock data:', error.message);
          return this.mockData.programs.find(p => p.id == id);
        }
        
        // Map database fields to expected field names
        const mappedProgram = {
          ...data,
          program_name: data.name,
          organization: {
            name: 'Unknown Organization', // We'll need to fetch this separately
            city: 'Various',
            state: 'Various'
          },
          cost_category: 'FREE', // Default since we don't have cost data
          duration_weeks: data.duration_value || null,
          grade_level: data.target_audience === 'high_school' ? '9-12' : 'Refer to website',
          application_deadline: null, // We don't have deadline data
          subject_area: data.program_type || 'General',
          description: data.description || data.short_description || 'No description available'
        };
        
        return mappedProgram;
      } catch (error) {
        console.warn('Supabase query error, using mock data:', error.message);
        return this.mockData.programs.find(p => p.id == id);
      }
    }
    
    // Return mock data
    return this.mockData.programs.find(p => p.id == id);
  }

  async searchPrograms(searchTerm, filters = {}) {
    if (this.supabase) {
      try {
        let query = this.supabase.from('programs').select('*');
        
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,short_description.ilike.%${searchTerm}%`);
        }
        
        // Apply filters based on actual database schema
        if (filters.program_type) {
          query = query.eq('program_type', filters.program_type);
        }
        if (filters.target_audience) {
          query = query.eq('target_audience', filters.target_audience);
        }
        if (filters.selectivity_tier) {
          query = query.eq('selectivity_tier', filters.selectivity_tier);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.warn('Supabase search failed, using mock data:', error.message);
          return this.mockData.programs.filter(p => 
            p.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.organization.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        
        // Map database fields to expected field names
        const mappedData = (data || []).map(program => ({
          ...program,
          program_name: program.name,
          organization: {
            name: 'Unknown Organization', // We'll need to fetch this separately
            city: 'Various',
            state: 'Various'
          },
          cost_category: 'FREE', // Default since we don't have cost data
          duration_weeks: program.duration_value || null,
          grade_level: program.target_audience === 'high_school' ? '9-12' : 'Refer to website',
          application_deadline: null, // We don't have deadline data
          subject_area: program.program_type || 'General',
          description: program.description || program.short_description || 'No description available'
        }));
        
        return mappedData;
      } catch (error) {
        console.warn('Supabase search error, using mock data:', error.message);
        return this.mockData.programs.filter(p => 
          p.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.organization.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }
    
    // Return filtered mock data
    return this.mockData.programs.filter(p => 
      p.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  async getStatistics() {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('programs')
          .select('*');
        
        if (error) {
          console.warn('Supabase stats query failed, using mock data:', error.message);
          return this.mockData.stats;
        }
        
        // Calculate stats from data based on actual database schema
        const stats = {
          totalPrograms: data.length,
          freePrograms: data.filter(p => p.status === 'active').length, // Assume active programs are free
          organizations: new Set(data.map(p => p.organization_id)).size,
          programs_by_type: {},
          programs_by_audience: {},
          programs_by_selectivity: {},
          active_programs: data.filter(p => p.status === 'active').length
        };
        
        data.forEach(program => {
          // Count by type
          stats.programs_by_type[program.program_type] = 
            (stats.programs_by_type[program.program_type] || 0) + 1;
          
          // Count by target audience
          stats.programs_by_audience[program.target_audience] = 
            (stats.programs_by_audience[program.target_audience] || 0) + 1;
          
          // Count by selectivity
          stats.programs_by_selectivity[program.selectivity_tier] = 
            (stats.programs_by_selectivity[program.selectivity_tier] || 0) + 1;
        });
        
        return stats;
      } catch (error) {
        console.warn('Supabase stats error, using mock data:', error.message);
        return this.mockData.stats;
      }
    }
    
    // Return mock stats
    return this.mockData.stats;
  }

  async getFilterOptions() {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('programs')
          .select('program_type,target_audience,selectivity_tier,status');
        
        if (error) {
          console.warn('Supabase filters query failed, using mock data:', error.message);
          return this.mockData.filters;
        }
        
        // Extract unique values based on actual database schema
        const filters = {
          program_types: [...new Set(data.map(p => p.program_type).filter(Boolean))],
          target_audiences: [...new Set(data.map(p => p.target_audience).filter(Boolean))],
          selectivity_tiers: [...new Set(data.map(p => p.selectivity_tier).filter(Boolean))],
          statuses: [...new Set(data.map(p => p.status).filter(Boolean))]
        };
        
        return filters;
      } catch (error) {
        console.warn('Supabase filters error, using mock data:', error.message);
        return this.mockData.filters;
      }
    }
    
    // Return mock filters
    return this.mockData.filters;
  }

  async healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: import.meta.env.MODE || 'production',
      platform: 'client-side-api',
      version: '1.0.0',
      supabase_connected: !!this.supabase,
      data_source: this.supabase ? 'supabase' : 'mock'
    };
  }
}

// Export for use in React components
export default ClientAPIService;
