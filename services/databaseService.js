const fs = require('fs');
const path = require('path');
const { supabase } = require('../config/supabase');

class DatabaseService {
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
      console.log(`✅ Loaded ${this.jsonData.programs.length} programs from JSON`);
    } catch (error) {
      console.error('❌ Error loading JSON data:', error.message);
      console.error('❌ JSON parsing error at position:', error.message.match(/position (\d+)/)?.[1]);
      
      // Try to load a minimal fallback
      this.jsonData = { 
        programs: [], 
        metadata: {
          database_name: "ethiopia_community_resources",
          version: "1.0.0",
          last_updated: new Date().toISOString(),
          total_programs: 0,
          description: "Fallback data due to JSON parsing error"
        }
      };
    }
  }

  // Programs CRUD operations
  async getAllPrograms(filters = {}) {
    if (this.useSupabase) {
      return await this.getProgramsFromSupabase(filters);
    } else {
      return this.getProgramsFromJson(filters);
    }
  }

  async getProgramById(id) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } else {
      return this.jsonData.programs.find(program => program.id === parseInt(id));
    }
  }

  async createProgram(programData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('programs')
        .insert([programData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      // For JSON mode, we'll just return the data (no persistence)
      const newProgram = {
        id: Date.now(), // Simple ID generation
        ...programData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      this.jsonData.programs.push(newProgram);
      return newProgram;
    }
  }

  async updateProgram(id, programData) {
    if (this.useSupabase) {
      const { data, error } = await supabase
        .from('programs')
        .update({ ...programData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const index = this.jsonData.programs.findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        this.jsonData.programs[index] = {
          ...this.jsonData.programs[index],
          ...programData,
          updated_at: new Date().toISOString()
        };
        return this.jsonData.programs[index];
      }
      return null;
    }
  }

  async deleteProgram(id) {
    if (this.useSupabase) {
      const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return { success: true };
    } else {
      const index = this.jsonData.programs.findIndex(p => p.id === parseInt(id));
      if (index !== -1) {
        this.jsonData.programs.splice(index, 1);
        return { success: true };
      }
      return { success: false };
    }
  }

  // Search and filter methods
  async searchPrograms(filters = {}) {
    if (this.useSupabase) {
      return await this.searchProgramsFromSupabase(filters);
    } else {
      return this.searchProgramsFromJson(filters);
    }
  }

  async searchProgramsFromSupabase(filters) {
    let query = supabase.from('programs').select('*');

    if (filters.costCategory) {
      query = query.eq('cost_category', filters.costCategory);
    }
    if (filters.programType) {
      query = query.eq('program_type', filters.programType);
    }
    if (filters.gradeLevel) {
      query = query.eq('grade_level', parseInt(filters.gradeLevel));
    }
    if (filters.state) {
      query = query.eq('location_state', filters.state);
    }
    if (filters.search) {
      query = query.or(`program_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,organization.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  searchProgramsFromJson(filters) {
    let results = [...this.jsonData.programs];

    if (filters.costCategory) {
      results = results.filter(program => program.cost_category === filters.costCategory);
    }
    if (filters.programType) {
      results = results.filter(program => program.program_type === filters.programType);
    }
    if (filters.gradeLevel) {
      results = results.filter(program => program.grade_level === parseInt(filters.gradeLevel));
    }
    if (filters.state) {
      results = results.filter(program => program.location_state === filters.state);
    }
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(program => 
        program.program_name.toLowerCase().includes(searchTerm) ||
        program.description?.toLowerCase().includes(searchTerm) ||
        program.organization?.toLowerCase().includes(searchTerm)
      );
    }

    return results;
  }

  async getProgramsFromSupabase(filters) {
    let query = supabase.from('programs').select('*');

    if (filters.limit) {
      query = query.limit(parseInt(filters.limit));
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  getProgramsFromJson(filters) {
    let results = [...this.jsonData.programs];
    
    if (filters.limit) {
      results = results.slice(0, parseInt(filters.limit));
    }
    
    return results;
  }

  // Statistics methods
  async getStatistics() {
    if (this.useSupabase) {
      return await this.getStatisticsFromSupabase();
    } else {
      return this.getStatisticsFromJson();
    }
  }

  async getStatisticsFromSupabase() {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('cost_category, duration_weeks, location_state, subject_area');

    if (error) throw error;

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

    return stats;
  }

  getStatisticsFromJson() {
    const programs = this.jsonData.programs;
    
    return {
      totalPrograms: programs.length,
      freePrograms: programs.filter(p => p.cost_category === 'FREE').length,
      paidPrograms: programs.filter(p => p.cost_category === 'PAID').length,
      averageDuration: Math.round(
        programs.reduce((sum, p) => sum + (p.duration_weeks || 0), 0) / programs.length
      ),
      topStates: this.getTopStates(programs),
      topSubjects: this.getTopSubjects(programs)
    };
  }

  getTopStates(programs, limit = 5) {
    const stateCounts = {};
    programs.forEach(program => {
      if (program.location_state) {
        stateCounts[program.location_state] = (stateCounts[program.location_state] || 0) + 1;
      }
    });
    
    return Object.entries(stateCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([state, count]) => ({ state, count }));
  }

  getTopSubjects(programs, limit = 5) {
    const subjectCounts = {};
    programs.forEach(program => {
      if (program.subject_area) {
        subjectCounts[program.subject_area] = (subjectCounts[program.subject_area] || 0) + 1;
      }
    });
    
    return Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([subject, count]) => ({ subject, count }));
  }

  // Filter options
  async getFilterOptions() {
    if (this.useSupabase) {
      return await this.getFilterOptionsFromSupabase();
    } else {
      return this.getFilterOptionsFromJson();
    }
  }

  async getFilterOptionsFromSupabase() {
    const { data: programs, error } = await supabase
      .from('programs')
      .select('cost_category, program_type, grade_level, location_state, residential_day')
      .eq('is_active', true);

    if (error) throw error;

    return {
      costCategories: [...new Set(programs.map(p => p.cost_category).filter(Boolean))].sort(),
      programTypes: [...new Set(programs.map(p => p.program_type).filter(Boolean))].sort(),
      gradeLevels: [...new Set(programs.map(p => p.grade_level).filter(Boolean))].sort((a, b) => a - b),
      subjectAreas: [...new Set(programs.map(p => p.subject_area).filter(Boolean))].sort(),
      states: [...new Set(programs.map(p => p.location_state).filter(Boolean))].sort(),
      residentialDays: [...new Set(programs.map(p => p.residential_day).filter(Boolean))].sort()
    };
  }

  getFilterOptionsFromJson() {
    const programs = this.jsonData.programs;
    
    return {
      costCategories: [...new Set(programs.map(p => p.cost_category).filter(Boolean))].sort(),
      programTypes: [...new Set(programs.map(p => p.program_type).filter(Boolean))].sort(),
      gradeLevels: [...new Set(programs.map(p => p.grade_level).filter(Boolean))].sort((a, b) => a - b),
      subjectAreas: [...new Set(programs.map(p => p.subject_area).filter(Boolean))].sort(),
      states: [...new Set(programs.map(p => p.location_state).filter(Boolean))].sort(),
      residentialDays: [...new Set(programs.map(p => p.residential_day).filter(Boolean))].sort()
    };
  }

  // Data migration methods
  async migrateJsonToSupabase() {
    if (!this.useSupabase) {
      throw new Error('Supabase mode not enabled');
    }

    console.log('🔄 Starting JSON to Supabase migration...');
    
    const programs = this.jsonData.programs;
    const batchSize = 100;
    let processed = 0;
    let created = 0;
    let failed = 0;

    for (let i = 0; i < programs.length; i += batchSize) {
      const batch = programs.slice(i, i + batchSize);
      
      try {
        const { data, error } = await supabase
          .from('programs')
          .insert(batch.map(program => ({
            ...program,
            id: undefined, // Let Supabase generate UUID
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })));

        if (error) {
          console.error(`❌ Batch ${i}-${i + batchSize} failed:`, error);
          failed += batch.length;
        } else {
          created += batch.length;
        }
      } catch (error) {
        console.error(`❌ Batch ${i}-${i + batchSize} failed:`, error);
        failed += batch.length;
      }

      processed += batch.length;
      console.log(`📊 Progress: ${processed}/${programs.length} programs processed`);
    }

    console.log(`✅ Migration completed: ${created} created, ${failed} failed`);
    return { processed, created, failed };
  }

  // User management methods
  async createOrUpdateUser(userData) {
    if (!this.useSupabase) {
      return userData; // Return as-is in JSON mode
    }

    const { data, error } = await supabase
      .from('users')
      .upsert([{
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        provider: userData.provider || 'google',
        last_login: new Date().toISOString()
      }], {
        onConflict: 'email'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserFavorites(userId) {
    if (!this.useSupabase) {
      return []; // No favorites in JSON mode
    }

    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        *,
        programs (*)
      `)
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async addUserFavorite(userId, programId) {
    if (!this.useSupabase) {
      return { success: true }; // Mock success in JSON mode
    }

    const { error } = await supabase
      .from('user_favorites')
      .insert([{ user_id: userId, program_id: programId }]);

    if (error) throw error;
    return { success: true };
  }

  async removeUserFavorite(userId, programId) {
    if (!this.useSupabase) {
      return { success: true }; // Mock success in JSON mode
    }

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('program_id', programId);

    if (error) throw error;
    return { success: true };
  }
}

module.exports = new DatabaseService();
