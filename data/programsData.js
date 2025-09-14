const fs = require('fs');
const path = require('path');

class ProgramsDataService {
  constructor() {
    this.data = null;
    this.dataPath = path.join(__dirname, '../docs/inputdata.json');
    this.loadData();
  }

  loadData() {
    try {
      const rawData = fs.readFileSync(this.dataPath, 'utf8');
      this.data = JSON.parse(rawData);
      console.log(`✅ Loaded ${this.data.programs.length} programs from inputdata.json`);
    } catch (error) {
      console.error('❌ Error loading programs data:', error.message);
      this.data = {
        metadata: {
          database_name: "summer_programs_complete_database",
          version: "2.0.0",
          last_updated: "2025-01-13",
          total_programs: 0,
          description: "Complete database of all summer programs for high school students"
        },
        programs: []
      };
    }
  }

  // Get all programs
  getAllPrograms() {
    return this.data ? this.data.programs : [];
  }

  // Get program by ID
  getProgramById(id) {
    if (!this.data) return null;
    return this.data.programs.find(program => program.id === parseInt(id));
  }

  // Search programs by various criteria
  searchPrograms(filters = {}) {
    if (!this.data) return [];

    let results = [...this.data.programs];

    // Filter by cost category
    if (filters.costCategory) {
      results = results.filter(program => 
        program.cost_category === filters.costCategory
      );
    }

    // Filter by program type
    if (filters.programType) {
      results = results.filter(program => 
        program.program_type === filters.programType
      );
    }

    // Filter by grade level
    if (filters.gradeLevel) {
      results = results.filter(program => 
        program.grade_level === parseInt(filters.gradeLevel)
      );
    }

    // Filter by subject area
    if (filters.subjectArea) {
      results = results.filter(program => 
        program.subject_area === filters.subjectArea
      );
    }

    // Filter by location state
    if (filters.state) {
      results = results.filter(program => 
        program.location_state === filters.state
      );
    }

    // Filter by residential/day
    if (filters.residentialDay) {
      results = results.filter(program => 
        program.residential_day === filters.residentialDay
      );
    }

    // Search by program name
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      results = results.filter(program => 
        program.program_name.toLowerCase().includes(searchTerm) ||
        program.description?.toLowerCase().includes(searchTerm) ||
        program.organization?.toLowerCase().includes(searchTerm)
      );
    }

    // Sort results
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'name':
            return a.program_name.localeCompare(b.program_name);
          case 'deadline':
            return new Date(a.application_deadline) - new Date(b.application_deadline);
          case 'duration':
            return a.duration_weeks - b.duration_weeks;
          default:
            return 0;
        }
      });
    }

    return results;
  }

  // Get unique values for filters
  getFilterOptions() {
    if (!this.data) return {};

    const programs = this.data.programs;
    
    return {
      costCategories: [...new Set(programs.map(p => p.cost_category))].sort(),
      programTypes: [...new Set(programs.map(p => p.program_type))].sort(),
      gradeLevels: [...new Set(programs.map(p => p.grade_level))].sort((a, b) => a - b),
      subjectAreas: [...new Set(programs.map(p => p.subject_area))].sort(),
      states: [...new Set(programs.map(p => p.location_state))].sort(),
      residentialDays: [...new Set(programs.map(p => p.residential_day))].sort()
    };
  }

  // Get metadata
  getMetadata() {
    return this.data ? this.data.metadata : null;
  }

  // Get statistics
  getStatistics() {
    if (!this.data) return {};

    const programs = this.data.programs;
    
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
}

// Create singleton instance
const programsDataService = new ProgramsDataService();

module.exports = programsDataService;
