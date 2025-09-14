// Ethiopian Community Resources - Summer Programs Database
class SummerProgramsApp {
    constructor() {
        this.programs = [];
        this.filteredPrograms = [];
        this.filters = {
            cost: '',
            type: '',
            grade: '',
            state: '',
            search: '',
            prestige: ''
        };
        this.currentView = 'card'; // card, list, table
        this.user = null;
        this.favorites = new Set();
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Ethiopian Community Resources...');
        
        // Show loading state
        this.showLoadingState();
        
        try {
            // Load initial data
            await Promise.all([
                this.checkAuthStatus(),
                this.loadPrograms(),
                this.loadFilterOptions(),
                this.loadStats()
            ]);
            
            // Set up event listeners
        this.setupEventListeners();
            
            // Initial render
            this.renderPrograms();
            
            console.log('✅ App initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showErrorState('Failed to load programs. Please refresh the page.');
        }
    }

    showLoadingState() {
        const loadingElement = document.getElementById('loadingState');
        const programsGrid = document.getElementById('programsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingElement) loadingElement.style.display = 'block';
        if (programsGrid) programsGrid.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
    }

    hideLoadingState() {
        const loadingElement = document.getElementById('loadingState');
        if (loadingElement) loadingElement.style.display = 'none';
    }

    showErrorState(message) {
        this.hideLoadingState();
        const programsGrid = document.getElementById('programsGrid');
        if (programsGrid) {
            programsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i>
                        Try Again
                    </button>
                </div>
            `;
            programsGrid.style.display = 'block';
        }
    }

    async checkAuthStatus() {
        try {
            // Wait for auth manager to be available
            if (window.authManager) {
                await window.authManager.init();
                this.user = window.authManager.getCurrentUser();
                
                if (this.user) {
                    console.log('👤 User authenticated:', this.user.email);
                    this.updateUIForAuthenticatedUser();
                    this.loadUserPreferences();
                } else {
                    this.updateUIForUnauthenticatedUser();
                }
            } else {
                // Fallback to server-side auth check
            const response = await fetch('/api/user');
            const data = await response.json();
            
                if (data.success && data.authenticated) {
                this.user = data.user;
                this.updateUIForAuthenticatedUser();
            } else {
                this.updateUIForUnauthenticatedUser();
                }
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            this.updateUIForUnauthenticatedUser();
        }
    }

    updateUIForAuthenticatedUser() {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userInfo = document.getElementById('userInfo');

        if (signInBtn) signInBtn.style.display = 'none';
        if (signOutBtn) signOutBtn.style.display = 'inline-block';
        if (userInfo) {
            userInfo.innerHTML = `
                <div class="user-profile">
                    <img src="${this.user.user_metadata?.avatar_url || '/default-avatar.png'}" 
                         alt="Profile" class="user-avatar">
                    <span class="user-name">${this.user.user_metadata?.full_name || this.user.email}</span>
                </div>
            `;
            userInfo.style.display = 'block';
        }
    }

    updateUIForUnauthenticatedUser() {
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');
        const userInfo = document.getElementById('userInfo');

        if (signInBtn) signInBtn.style.display = 'inline-block';
        if (signOutBtn) signOutBtn.style.display = 'none';
        if (userInfo) {
            userInfo.innerHTML = '';
            userInfo.style.display = 'none';
        }
    }

    async loadPrograms() {
        try {
            console.log('📚 Loading programs...');
            const response = await fetch('/api/programs');
            const data = await response.json();
            
            if (data.success) {
                this.programs = data.data || [];
                this.filteredPrograms = [...this.programs];
                console.log(`✅ Loaded ${this.programs.length} programs`);
                
                // Update results count
                this.updateResultsCount();
            } else {
                throw new Error(data.error || 'Failed to load programs');
            }
        } catch (error) {
            console.error('Error loading programs:', error);
            throw error;
        }
    }

    async loadFilterOptions() {
        try {
            console.log('🔍 Loading filter options...');
            const response = await fetch('/api/programs/filters');
            const data = await response.json();
            
            if (data.success) {
                this.populateFilterDropdowns(data.data);
                console.log('✅ Filter options loaded');
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
    }

    async loadStats() {
        try {
            console.log('📊 Loading statistics...');
            const response = await fetch('/api/programs/stats');
            const data = await response.json();
            
            if (data.success) {
                this.updateStatsDisplay(data.data.statistics);
                console.log('✅ Statistics loaded');
            }
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    populateFilterDropdowns(filterData) {
        // Populate cost filter
        const costFilter = document.getElementById('costFilter');
        if (costFilter && filterData.costCategories) {
            filterData.costCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = this.formatCostCategory(category);
                costFilter.appendChild(option);
            });
        }

        // Populate type filter
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter && filterData.programTypes) {
            filterData.programTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = this.formatProgramType(type);
                typeFilter.appendChild(option);
            });
        }

        // Populate grade filter
        const gradeFilter = document.getElementById('gradeFilter');
        if (gradeFilter && filterData.gradeLevels) {
            filterData.gradeLevels.forEach(grade => {
                const option = document.createElement('option');
                option.value = grade;
                option.textContent = `Grade ${grade}`;
                gradeFilter.appendChild(option);
            });
        }

        // Populate state filter
        const stateFilter = document.getElementById('stateFilter');
        if (stateFilter && filterData.states) {
            filterData.states.forEach(state => {
                const option = document.createElement('option');
                option.value = state;
                option.textContent = state;
                stateFilter.appendChild(option);
            });
        }
    }

    updateStatsDisplay(stats) {
        // Update hero stats
        const totalPrograms = document.getElementById('totalPrograms');
        const freePrograms = document.getElementById('freePrograms');
        
        if (totalPrograms) totalPrograms.textContent = stats.totalPrograms || 0;
        if (freePrograms) freePrograms.textContent = stats.freePrograms || 0;

        // Update footer stats
        const footerStats = document.getElementById('footerStats');
        if (footerStats) {
            footerStats.textContent = `${stats.totalPrograms || 0}+ Programs Available`;
        }
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter dropdowns
        const costFilter = document.getElementById('costFilter');
        if (costFilter) {
            costFilter.addEventListener('change', (e) => {
                this.filters.cost = e.target.value;
                this.applyFilters();
            });
        }

        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filters.type = e.target.value;
                this.applyFilters();
            });
        }

        const gradeFilter = document.getElementById('gradeFilter');
        if (gradeFilter) {
            gradeFilter.addEventListener('change', (e) => {
                this.filters.grade = e.target.value;
                this.applyFilters();
            });
        }

        const stateFilter = document.getElementById('stateFilter');
        if (stateFilter) {
            stateFilter.addEventListener('change', (e) => {
                this.filters.state = e.target.value;
                this.applyFilters();
            });
        }

        const prestigeFilter = document.getElementById('prestigeFilter');
        if (prestigeFilter) {
            prestigeFilter.addEventListener('change', (e) => {
                this.filters.prestige = e.target.value;
                this.applyFilters();
            });
        }

        // View toggle buttons
        const cardViewBtn = document.getElementById('cardView');
        const listViewBtn = document.getElementById('listView');
        const tableViewBtn = document.getElementById('tableView');

        if (cardViewBtn) {
            cardViewBtn.addEventListener('click', () => this.setView('card'));
        }
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => this.setView('list'));
        }
        if (tableViewBtn) {
            tableViewBtn.addEventListener('click', () => this.setView('table'));
        }

        // Authentication buttons
        const signInBtn = document.getElementById('signInBtn');
        const signOutBtn = document.getElementById('signOutBtn');

        if (signInBtn) {
            signInBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.signInWithGoogle();
                }
            });
        }

        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => {
                if (window.authManager) {
                    window.authManager.signOut();
                }
            });
        }

        // Clear filters button
        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }

        // Sort dropdown
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortPrograms(e.target.value);
            });
        }

        // Login button
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/auth/google';
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.location.href = '/logout';
            });
        }

        // Smooth scrolling for navigation
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    applyFilters() {
        this.filteredPrograms = this.programs.filter(program => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableText = [
                    program.program_name,
                    program.organization,
                    program.description,
                    program.subject_area
                ].join(' ').toLowerCase();
                
                if (!searchableText.includes(searchTerm)) {
                    return false;
                }
            }

            // Cost filter
            if (this.filters.cost && program.cost_category !== this.filters.cost) {
                return false;
            }

            // Type filter
            if (this.filters.type && program.program_type !== this.filters.type) {
                return false;
            }

            // Grade filter
            if (this.filters.grade && program.grade_level !== parseInt(this.filters.grade)) {
                return false;
            }

            // State filter
            if (this.filters.state && program.location_state !== this.filters.state) {
                return false;
            }

            // Prestige filter
            if (this.filters.prestige) {
                const programPrestige = this.getPrestigeLevel(program);
                if (programPrestige !== this.filters.prestige) {
                    return false;
                }
            }

            return true;
        });

        this.updateResultsCount();
        this.renderPrograms();
    }

    clearAllFilters() {
        // Reset filter values
        this.filters = {
            cost: '',
            type: '',
            grade: '',
            state: '',
            search: ''
        };

        // Reset form elements
        const searchInput = document.getElementById('searchInput');
        const costFilter = document.getElementById('costFilter');
        const typeFilter = document.getElementById('typeFilter');
        const gradeFilter = document.getElementById('gradeFilter');
        const stateFilter = document.getElementById('stateFilter');

        if (searchInput) searchInput.value = '';
        if (costFilter) costFilter.value = '';
        if (typeFilter) typeFilter.value = '';
        if (gradeFilter) gradeFilter.value = '';
        if (stateFilter) stateFilter.value = '';

        // Reset filtered programs
        this.filteredPrograms = [...this.programs];
        this.updateResultsCount();
        this.renderPrograms();
    }

    sortPrograms(sortBy) {
        switch (sortBy) {
            case 'prestige':
                const prestigeOrder = ['elite', 'highly-selective', 'selective', 'accessible'];
                this.filteredPrograms.sort((a, b) => {
                    const prestigeA = this.getPrestigeLevel(a);
                    const prestigeB = this.getPrestigeLevel(b);
                    const indexA = prestigeOrder.indexOf(prestigeA);
                    const indexB = prestigeOrder.indexOf(prestigeB);
                    return indexA - indexB;
                });
                break;
            case 'name':
                this.filteredPrograms.sort((a, b) => 
                    a.program_name.localeCompare(b.program_name)
                );
                break;
            case 'deadline':
                this.filteredPrograms.sort((a, b) => {
                    const dateA = new Date(a.application_deadline || '9999-12-31');
                    const dateB = new Date(b.application_deadline || '9999-12-31');
                    return dateA - dateB;
                });
                break;
            case 'cost':
                const costOrder = ['FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID'];
                this.filteredPrograms.sort((a, b) => {
                    const indexA = costOrder.indexOf(a.cost_category) || 999;
                    const indexB = costOrder.indexOf(b.cost_category) || 999;
                    return indexA - indexB;
                });
                break;
            case 'selectivity':
                this.filteredPrograms.sort((a, b) => 
                    (a.selectivity_percent || 100) - (b.selectivity_percent || 100)
                );
                break;
        }
        this.renderPrograms();
    }

    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = this.filteredPrograms.length;
        }
    }

    renderPrograms() {
        const programsGrid = document.getElementById('programsGrid');
        const emptyState = document.getElementById('emptyState');
        
        this.hideLoadingState();

        if (!programsGrid) return;

        if (this.filteredPrograms.length === 0) {
            programsGrid.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        programsGrid.style.display = 'grid';

        programsGrid.innerHTML = this.filteredPrograms.map(program => 
            this.createProgramCard(program)
        ).join('');

        // Add event listeners to program cards
        this.setupProgramCardListeners();
    }

    createProgramCard(program) {
        const costBadge = this.getCostBadge(program.cost_category);
        const deadline = program.application_deadline ? 
            new Date(program.application_deadline).toLocaleDateString() : 'Rolling';
        const prestigeLevel = this.getPrestigeLevel(program);
        const prestigeLabel = this.getPrestigeLabel(prestigeLevel);
        
        return `
            <div class="program-card" data-program-id="${program.id}">
                <div class="prestige-badge ${prestigeLevel}">${prestigeLabel}</div>
                <div class="program-header">
                    <div>
                        <h3 class="program-title">${program.program_name}</h3>
                        <p class="program-organization">${program.organization || 'Community Program'}</p>
                    </div>
                    ${costBadge}
                </div>
                
                <div class="program-details">
                    <div class="program-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${program.location_city || 'Various'}, ${program.location_state || 'Multiple States'}</span>
                    </div>
                    <div class="program-detail">
                        <i class="fas fa-graduation-cap"></i>
                        <span>Grade ${program.grade_level || 'All Levels'}</span>
                    </div>
                    <div class="program-detail">
                        <i class="fas fa-clock"></i>
                        <span>${program.duration_weeks || 'Flexible'} weeks</span>
                    </div>
                    <div class="program-detail">
                        <i class="fas fa-tag"></i>
                        <span>${program.subject_area || program.program_type || 'General'}</span>
                    </div>
                </div>

                <p class="program-description">
                    ${program.description ? program.description.substring(0, 150) + '...' : 'Discover this amazing program opportunity for Ethiopian and Eritrean students.'}
                </p>

                <div class="program-footer">
                    <span class="program-deadline">
                        <i class="fas fa-calendar"></i>
                        Deadline: ${deadline}
                    </span>
                    <button class="favorite-btn" data-program-id="${program.id}">
                        <i class="fas fa-heart"></i>
                    </button>
                </div>
            </div>
        `;
    }

    getCostBadge(costCategory) {
        const badges = {
            'FREE': '<span class="program-badge badge-free">Free</span>',
            'FREE_PLUS_STIPEND': '<span class="program-badge badge-free">Free + Stipend</span>',
            'FREE_PLUS_SCHOLARSHIP': '<span class="program-badge badge-scholarship">Scholarship</span>',
            'LOW_COST': '<span class="program-badge badge-paid">Low Cost</span>',
            'PAID': '<span class="program-badge badge-paid">Paid</span>'
        };
        return badges[costCategory] || '<span class="program-badge badge-paid">Contact</span>';
    }

    setupProgramCardListeners() {
        // Program card click handlers
        document.querySelectorAll('.program-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.favorite-btn')) {
                    const programId = card.dataset.programId;
                    this.showProgramModal(programId);
                }
            });
        });

        // Favorite button handlers
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const programId = btn.dataset.programId;
                this.toggleFavorite(programId);
            });
        });
    }

    showProgramModal(programId) {
        const program = this.programs.find(p => p.id == programId);
        if (!program) return;

        const modal = document.getElementById('programModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');

        if (!modal || !modalTitle || !modalContent) return;

        modalTitle.textContent = program.program_name;
        modalContent.innerHTML = `
            <div class="modal-program-details">
                <div class="modal-section">
                    <h4>Organization</h4>
                    <p>${program.organization || 'Community Program'}</p>
                </div>
                
                <div class="modal-section">
                    <h4>Description</h4>
                    <p>${program.description || 'No description available.'}</p>
                </div>
                
                <div class="modal-section">
                    <h4>Program Details</h4>
                    <div class="detail-grid">
                        <div><strong>Grade Level:</strong> ${program.grade_level || 'All Levels'}</div>
                        <div><strong>Duration:</strong> ${program.duration_weeks || 'Flexible'} weeks</div>
                        <div><strong>Cost:</strong> ${this.formatCostCategory(program.cost_category)}</div>
                        <div><strong>Type:</strong> ${this.formatProgramType(program.program_type)}</div>
                        <div><strong>Subject:</strong> ${program.subject_area || 'General'}</div>
                        <div><strong>Location:</strong> ${program.location_city || 'Various'}, ${program.location_state || 'Multiple'}</div>
                    </div>
                </div>
                
                ${program.application_deadline ? `
                <div class="modal-section">
                    <h4>Application Deadline</h4>
                    <p>${new Date(program.application_deadline).toLocaleDateString()}</p>
                </div>
                ` : ''}
                
                ${program.website ? `
                <div class="modal-section">
                    <h4>Website</h4>
                    <p><a href="${program.website}" target="_blank" rel="noopener">${program.website}</a></p>
                </div>
                ` : ''}
                
                ${program.contact_email ? `
                <div class="modal-section">
                    <h4>Contact</h4>
                    <p><a href="mailto:${program.contact_email}">${program.contact_email}</a></p>
                </div>
                ` : ''}
            </div>
        `;

        modal.classList.add('active');
    }

    toggleFavorite(programId) {
        if (!this.user) {
            // Redirect to login if not authenticated
            window.location.href = '/auth/google';
            return;
        }

        // Toggle favorite state (simplified for demo)
        if (this.favorites.has(programId)) {
            this.favorites.delete(programId);
        } else {
            this.favorites.add(programId);
        }

        // Update UI
        this.updateFavoriteButtons();
    }

    updateFavoriteButtons() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            const programId = btn.dataset.programId;
            if (this.favorites.has(programId)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    formatCostCategory(category) {
        const formats = {
            'FREE': 'Free',
            'FREE_PLUS_STIPEND': 'Free + Stipend',
            'FREE_PLUS_SCHOLARSHIP': 'Free + Scholarship',
            'LOW_COST': 'Low Cost',
            'PAID': 'Paid'
        };
        return formats[category] || category;
    }

    formatProgramType(type) {
        const formats = {
            'Summer_Program': 'Summer Program',
            'Competition': 'Competition',
            'Multi_Year': 'Multi-Year Program',
            'Year_Program': 'Year Program',
            'Online_Course': 'Online Course',
            'Conference': 'Conference',
            'Hybrid_Program': 'Hybrid Program',
            'Scholarship': 'Scholarship',
            'Award': 'Award',
            'Workshop': 'Workshop',
            'Camp': 'Camp'
        };
        return formats[type] || type;
    }

    // Calculate prestige level based on selectivity
    getPrestigeLevel(program) {
        const selectivity = program.selectivity_percent || 100;
        
        if (selectivity <= 10) return 'elite';
        if (selectivity <= 25) return 'highly-selective';
        if (selectivity <= 50) return 'selective';
        return 'accessible';
    }

    getPrestigeLabel(level) {
        const labels = {
            'elite': '🏆 Elite',
            'highly-selective': '⭐ Highly Selective',
            'selective': '📚 Selective',
            'accessible': '🌟 Accessible'
        };
        return labels[level] || '';
    }

    // Set view mode (card, list, table)
    setView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(viewType + 'View')?.classList.add('active');
        
        // Update grid classes
        const programsGrid = document.getElementById('programsGrid');
        if (programsGrid) {
            programsGrid.className = `programs-grid ${viewType}-view`;
        }
        
        // Re-render programs with new view
        this.renderPrograms();
    }
}

// Global functions for modal and navigation
function closeModal() {
    const modal = document.getElementById('programModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function scrollToPrograms() {
    const programsSection = document.getElementById('programs');
    if (programsSection) {
        programsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Ethiopian Community Resources - Summer Programs Database');
    window.app = new SummerProgramsApp();
});

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('programModal');
    if (modal && e.target === modal) {
        closeModal();
    }
});

// Handle escape key for modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});