// Client-side API service using Supabase directly
// This replaces the need for Netlify functions

class ClientAPIService {
  constructor() {
    this.supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
    this.supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';
    this.supabase = null;
    this.mockData = this.getMockData();
  }

  async initialize() {
    try {
      // Try to initialize Supabase if credentials are available
      if (this.supabaseUrl && this.supabaseKey && 
          !this.supabaseUrl.includes('your-project') && 
          !this.supabaseKey.includes('your-anon-key')) {
        
        const { createClient } = await import('@supabase/supabase-js');
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
        
        // Test connection
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
      } else {
        console.log('⚠️ Supabase credentials not configured, using mock data');
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
        
        // Apply filters
        if (filters.program_type) {
          query = query.eq('program_type', filters.program_type);
        }
        if (filters.cost_category) {
          query = query.eq('cost_category', filters.cost_category);
        }
        if (filters.location_state) {
          query = query.eq('location_state', filters.location_state);
        }
        if (filters.grade_level) {
          query = query.eq('grade_level', filters.grade_level);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.warn('Supabase query failed, using mock data:', error.message);
          return this.mockData.programs;
        }
        
        return data || this.mockData.programs;
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
        
        return data;
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
          query = query.or(`program_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,organization.ilike.%${searchTerm}%`);
        }
        
        // Apply filters
        if (filters.program_type) {
          query = query.eq('program_type', filters.program_type);
        }
        if (filters.cost_category) {
          query = query.eq('cost_category', filters.cost_category);
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
        
        return data || [];
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
        
        // Calculate stats from data
        const stats = {
          total_programs: data.length,
          total_organizations: new Set(data.map(p => p.organization)).size,
          programs_by_type: {},
          programs_by_cost: {},
          programs_by_location: {}
        };
        
        data.forEach(program => {
          // Count by type
          stats.programs_by_type[program.program_type] = 
            (stats.programs_by_type[program.program_type] || 0) + 1;
          
          // Count by cost
          stats.programs_by_cost[program.cost_category] = 
            (stats.programs_by_cost[program.cost_category] || 0) + 1;
          
          // Count by location
          stats.programs_by_location[program.location_state] = 
            (stats.programs_by_location[program.location_state] || 0) + 1;
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
          .select('program_type,cost_category,location_state,grade_level,subject_area');
        
        if (error) {
          console.warn('Supabase filters query failed, using mock data:', error.message);
          return this.mockData.filters;
        }
        
        // Extract unique values
        const filters = {
          program_types: [...new Set(data.map(p => p.program_type).filter(Boolean))],
          cost_categories: [...new Set(data.map(p => p.cost_category).filter(Boolean))],
          locations: [...new Set(data.map(p => p.location_state).filter(Boolean))],
          grade_levels: [...new Set(data.map(p => p.grade_level).filter(Boolean))].sort((a, b) => a - b),
          subject_areas: [...new Set(data.map(p => p.subject_area).filter(Boolean))]
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
      environment: process.env.NODE_ENV || 'production',
      platform: 'client-side-api',
      version: '1.0.0',
      supabase_connected: !!this.supabase,
      data_source: this.supabase ? 'supabase' : 'mock'
    };
  }
}

// Export for use in React components
export default ClientAPIService;
