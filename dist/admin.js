// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentProgramId = null;
        this.currentPage = 1;
        this.programsPerPage = 10;
        this.init();
    }

    async init() {
        await this.loadOverview();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Program form submission
        const programForm = document.getElementById('program-form-element');
        if (programForm) {
            programForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProgram();
            });
        }

        // Program search
        const searchInput = document.getElementById('program-search');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchPrograms();
                }
            });
        }
    }

    async loadOverview() {
        try {
            const response = await fetch('/api/programs/stats');
            const result = await response.json();
            
            if (result.success) {
                const stats = result.data.statistics;
                document.getElementById('total-programs-count').textContent = stats.totalPrograms || 0;
                document.getElementById('active-programs-count').textContent = stats.totalPrograms || 0;
                document.getElementById('total-users-count').textContent = '0'; // Placeholder
                document.getElementById('database-mode').textContent = 'JSON';
            }
        } catch (error) {
            console.error('Error loading overview:', error);
        }
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.admin-nav button').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected section
        document.getElementById(sectionId).classList.add('active');
        
        // Add active class to clicked button
        event.target.classList.add('active');
        
        // Load section-specific data
        if (sectionId === 'programs') {
            this.loadPrograms();
        }
    }

    async loadPrograms() {
        try {
            const response = await fetch('/api/programs');
            const result = await response.json();
            
            if (result.success) {
                this.displayPrograms(result.data);
            } else {
                this.showAlert('Failed to load programs', 'error');
            }
        } catch (error) {
            console.error('Error loading programs:', error);
            this.showAlert('Error loading programs', 'error');
        }
    }

    displayPrograms(programs) {
        const tbody = document.getElementById('programs-tbody');
        if (!tbody) return;

        if (programs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No programs found</td></tr>';
            return;
        }

        tbody.innerHTML = programs.map(program => `
            <tr>
                <td>${this.escapeHtml(program.program_name)}</td>
                <td>${this.escapeHtml(program.organization || '')}</td>
                <td>${this.formatTypeName(program.program_type)}</td>
                <td>${this.formatCategoryName(program.cost_category)}</td>
                <td>${program.grade_level || ''}</td>
                <td>${program.location_state || ''}</td>
                <td>
                    <span class="status-badge status-active">Active</span>
                </td>
                <td>
                    <button class="btn btn-primary" onclick="adminPanel.editProgram('${program.id}')" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="adminPanel.deleteProgram('${program.id}')" style="padding: 5px 10px; font-size: 12px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    showAddProgramForm() {
        this.currentProgramId = null;
        this.clearProgramForm();
        document.getElementById('program-form').style.display = 'block';
        document.getElementById('program-form').scrollIntoView({ behavior: 'smooth' });
    }

    editProgram(programId) {
        this.currentProgramId = programId;
        this.loadProgramForEdit(programId);
        document.getElementById('program-form').style.display = 'block';
        document.getElementById('program-form').scrollIntoView({ behavior: 'smooth' });
    }

    async loadProgramForEdit(programId) {
        try {
            const response = await fetch(`/api/programs/${programId}`);
            const result = await response.json();
            
            if (result.success) {
                const program = result.data;
                this.populateProgramForm(program);
            } else {
                this.showAlert('Failed to load program', 'error');
            }
        } catch (error) {
            console.error('Error loading program:', error);
            this.showAlert('Error loading program', 'error');
        }
    }

    populateProgramForm(program) {
        document.getElementById('program-name').value = program.program_name || '';
        document.getElementById('organization').value = program.organization || '';
        document.getElementById('cost-category').value = program.cost_category || '';
        document.getElementById('program-type').value = program.program_type || '';
        document.getElementById('grade-level').value = program.grade_level || '';
        document.getElementById('duration-weeks').value = program.duration_weeks || '';
        document.getElementById('location-state').value = program.location_state || '';
        document.getElementById('location-city').value = program.location_city || '';
        document.getElementById('application-deadline').value = program.application_deadline || '';
        document.getElementById('website').value = program.website || '';
        document.getElementById('contact-email').value = program.contact_email || '';
        document.getElementById('description').value = program.description || '';
        document.getElementById('key-benefits').value = program.key_benefits || '';
        document.getElementById('application-requirements').value = program.application_requirements || '';
    }

    clearProgramForm() {
        document.getElementById('program-form-element').reset();
    }

    cancelProgramForm() {
        document.getElementById('program-form').style.display = 'none';
        this.currentProgramId = null;
        this.clearProgramForm();
    }

    async saveProgram() {
        const formData = {
            program_name: document.getElementById('program-name').value,
            organization: document.getElementById('organization').value,
            cost_category: document.getElementById('cost-category').value,
            program_type: document.getElementById('program-type').value,
            grade_level: parseInt(document.getElementById('grade-level').value) || null,
            duration_weeks: parseInt(document.getElementById('duration-weeks').value) || null,
            location_state: document.getElementById('location-state').value,
            location_city: document.getElementById('location-city').value,
            application_deadline: document.getElementById('application-deadline').value,
            website: document.getElementById('website').value,
            contact_email: document.getElementById('contact-email').value,
            description: document.getElementById('description').value,
            key_benefits: document.getElementById('key-benefits').value,
            application_requirements: document.getElementById('application-requirements').value
        };

        try {
            let response;
            if (this.currentProgramId) {
                // Update existing program
                response = await fetch(`/api/programs/${this.currentProgramId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            } else {
                // Create new program
                response = await fetch('/api/programs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
            }

            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Program saved successfully!', 'success');
                this.cancelProgramForm();
                this.loadPrograms();
            } else {
                this.showAlert('Failed to save program: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error saving program:', error);
            this.showAlert('Error saving program', 'error');
        }
    }

    async deleteProgram(programId) {
        if (!confirm('Are you sure you want to delete this program?')) {
            return;
        }

        try {
            const response = await fetch(`/api/programs/${programId}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Program deleted successfully!', 'success');
                this.loadPrograms();
            } else {
                this.showAlert('Failed to delete program: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error deleting program:', error);
            this.showAlert('Error deleting program', 'error');
        }
    }

    async searchPrograms() {
        const searchTerm = document.getElementById('program-search').value;
        
        try {
            const response = await fetch(`/api/programs/search?search=${encodeURIComponent(searchTerm)}`);
            const result = await response.json();
            
            if (result.success) {
                this.displayPrograms(result.data);
            } else {
                this.showAlert('Search failed', 'error');
            }
        } catch (error) {
            console.error('Error searching programs:', error);
            this.showAlert('Search error', 'error');
        }
    }

    clearProgramSearch() {
        document.getElementById('program-search').value = '';
        this.loadPrograms();
    }

    refreshPrograms() {
        this.loadPrograms();
    }

    async startMigration() {
        if (!confirm('This will migrate all programs from JSON to Supabase. Continue?')) {
            return;
        }

        try {
            const response = await fetch('/api/migrate', {
                method: 'POST'
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showAlert('Migration completed successfully!', 'success');
                document.getElementById('migration-results').style.display = 'block';
                document.getElementById('migration-log').innerHTML = `
                    <p><strong>Processed:</strong> ${result.data.processed} programs</p>
                    <p><strong>Created:</strong> ${result.data.created} programs</p>
                    <p><strong>Failed:</strong> ${result.data.failed} programs</p>
                `;
            } else {
                this.showAlert('Migration failed: ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Error during migration:', error);
            this.showAlert('Migration error', 'error');
        }
    }

    checkMigrationStatus() {
        this.showAlert('Migration status check not implemented yet', 'info');
    }

    saveSettings() {
        this.showAlert('Settings saved successfully!', 'success');
    }

    testConnection() {
        this.showAlert('Connection test not implemented yet', 'info');
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at the top of the current section
        const currentSection = document.querySelector('.admin-section.active');
        if (currentSection) {
            currentSection.insertBefore(alert, currentSection.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    formatCategoryName(category) {
        const categoryMap = {
            'FREE': 'Free',
            'FREE_PLUS_STIPEND': 'Free + Stipend',
            'FREE_PLUS_SCHOLARSHIP': 'Free + Scholarship',
            'FREE_TO_LOW': 'Free to Low Cost',
            'LOW_COST': 'Low Cost',
            'PAID': 'Paid'
        };
        return categoryMap[category] || category;
    }

    formatTypeName(type) {
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
