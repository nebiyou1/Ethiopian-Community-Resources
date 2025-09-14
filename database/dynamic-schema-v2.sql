-- =====================================================
-- DYNAMIC & EXTENSIBLE SCHEMA FOR ETHIOPIA COMMUNITY RESOURCES
-- Version 2.0 - Designed for Long-term Maintainability
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For geographic data
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent"; -- For text normalization

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- Organizations table - Centralized organization management
CREATE TABLE organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL-friendly identifier
    type VARCHAR(50) NOT NULL, -- 'university', 'nonprofit', 'government', 'company', 'community_org'
    
    -- Contact Information
    website TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Location (normalized)
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(3) DEFAULT 'USA', -- ISO 3166-1 alpha-3
    postal_code VARCHAR(20),
    coordinates POINT, -- PostGIS point for precise location
    timezone VARCHAR(50),
    
    -- Organizational Details
    founded_year INTEGER,
    size_category VARCHAR(20), -- 'startup', 'small', 'medium', 'large', 'enterprise'
    tax_status VARCHAR(50), -- '501c3', 'for_profit', 'government', 'international'
    
    -- Verification & Trust
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'verified', 'pending', 'flagged', 'rejected'
    verification_date TIMESTAMP WITH TIME ZONE,
    verified_by UUID, -- References users table
    trust_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    -- Search optimization
    search_vector tsvector,
    
    CONSTRAINT valid_trust_score CHECK (trust_score >= 0.00 AND trust_score <= 5.00)
);

-- Programs table - Core program information
CREATE TABLE programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic Information
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL, -- URL-friendly, unique per organization
    description TEXT,
    short_description VARCHAR(500), -- For cards/previews
    
    -- Program Classification
    program_type VARCHAR(50) NOT NULL, -- 'summer_program', 'internship', 'scholarship', 'camp', 'course'
    target_audience VARCHAR(50), -- 'high_school', 'college', 'graduate', 'professional', 'community'
    
    -- Timing & Duration
    duration_type VARCHAR(20), -- 'weeks', 'months', 'days', 'ongoing', 'variable'
    duration_value INTEGER, -- Number of duration_type units
    is_recurring BOOLEAN DEFAULT false,
    
    -- Application & Selection
    application_process TEXT,
    selection_criteria TEXT,
    selectivity_tier VARCHAR(20), -- 'open', 'selective', 'highly_selective', 'elite'
    estimated_acceptance_rate DECIMAL(5,2), -- Percentage
    
    -- Capacity
    min_participants INTEGER,
    max_participants INTEGER,
    typical_participants INTEGER,
    
    -- Status & Lifecycle
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'archived', 'draft'
    first_offered_year INTEGER,
    last_offered_year INTEGER,
    
    -- Quality Metrics
    rating_average DECIMAL(3,2) DEFAULT 0.00,
    rating_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2), -- Percentage of participants who complete
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_source VARCHAR(100), -- Track where data came from
    last_verified TIMESTAMP WITH TIME ZONE,
    
    -- Search optimization
    search_vector tsvector,
    
    UNIQUE(organization_id, slug),
    CONSTRAINT valid_rating CHECK (rating_average >= 0.00 AND rating_average <= 5.00),
    CONSTRAINT valid_acceptance_rate CHECK (estimated_acceptance_rate >= 0.00 AND estimated_acceptance_rate <= 100.00)
);

-- =====================================================
-- DYNAMIC ATTRIBUTE SYSTEM
-- =====================================================

-- Attribute definitions - Define what attributes can exist
CREATE TABLE attribute_definitions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    
    -- Data type and validation
    data_type VARCHAR(20) NOT NULL, -- 'string', 'integer', 'decimal', 'boolean', 'date', 'json', 'array'
    is_required BOOLEAN DEFAULT false,
    is_searchable BOOLEAN DEFAULT true,
    is_filterable BOOLEAN DEFAULT true,
    
    -- For string types
    max_length INTEGER,
    allowed_values TEXT[], -- JSON array of allowed values for enum-like fields
    
    -- For numeric types
    min_value DECIMAL,
    max_value DECIMAL,
    
    -- UI hints
    input_type VARCHAR(30), -- 'text', 'textarea', 'select', 'multiselect', 'number', 'date', 'checkbox'
    placeholder_text VARCHAR(255),
    help_text TEXT,
    display_order INTEGER DEFAULT 0,
    
    -- Categorization
    category VARCHAR(50), -- 'basic', 'financial', 'academic', 'location', 'contact', 'eligibility'
    applies_to VARCHAR(20) NOT NULL, -- 'programs', 'organizations', 'both'
    
    -- Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Program attributes - Dynamic key-value storage for programs
CREATE TABLE program_attributes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    attribute_definition_id UUID NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
    
    -- Value storage (only one should be populated based on data_type)
    value_string TEXT,
    value_integer INTEGER,
    value_decimal DECIMAL,
    value_boolean BOOLEAN,
    value_date DATE,
    value_timestamp TIMESTAMP WITH TIME ZONE,
    value_json JSONB,
    value_array TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(program_id, attribute_definition_id)
);

-- Organization attributes - Dynamic key-value storage for organizations
CREATE TABLE organization_attributes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    attribute_definition_id UUID NOT NULL REFERENCES attribute_definitions(id) ON DELETE CASCADE,
    
    -- Value storage
    value_string TEXT,
    value_integer INTEGER,
    value_decimal DECIMAL,
    value_boolean BOOLEAN,
    value_date DATE,
    value_timestamp TIMESTAMP WITH TIME ZONE,
    value_json JSONB,
    value_array TEXT[],
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(organization_id, attribute_definition_id)
);

-- =====================================================
-- PROGRAM SCHEDULING & SESSIONS
-- =====================================================

-- Program sessions - Handle recurring programs and multiple sessions
CREATE TABLE program_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Session identification
    session_name VARCHAR(255), -- e.g., "Summer 2024", "Fall Cohort 1"
    session_year INTEGER NOT NULL,
    session_term VARCHAR(20), -- 'spring', 'summer', 'fall', 'winter', 'year_round'
    
    -- Timing
    application_open_date DATE,
    application_deadline DATE,
    early_deadline DATE, -- For early applications
    notification_date DATE,
    start_date DATE,
    end_date DATE,
    
    -- Capacity for this session
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    waitlist_count INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'open', 'closed', 'in_progress', 'completed', 'cancelled'
    
    -- Session-specific details
    location_details TEXT,
    special_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FINANCIAL INFORMATION
-- =====================================================

-- Program costs - Handle complex pricing structures
CREATE TABLE program_costs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES program_sessions(id) ON DELETE CASCADE, -- NULL for program-wide costs
    
    -- Cost details
    cost_type VARCHAR(30) NOT NULL, -- 'tuition', 'fees', 'housing', 'meals', 'materials', 'transportation'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Cost structure
    is_required BOOLEAN DEFAULT true,
    is_refundable BOOLEAN DEFAULT false,
    payment_schedule VARCHAR(20), -- 'upfront', 'installments', 'monthly', 'upon_acceptance'
    
    -- Eligibility for this cost
    applies_to_all BOOLEAN DEFAULT true,
    eligibility_criteria TEXT, -- When applies_to_all is false
    
    -- Financial aid
    financial_aid_available BOOLEAN DEFAULT false,
    scholarship_percentage DECIMAL(5,2), -- Max percentage covered by scholarships
    need_based_aid BOOLEAN DEFAULT false,
    merit_based_aid BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TAXONOMY & CATEGORIZATION
-- =====================================================

-- Categories - Hierarchical categorization system
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hierarchy
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    path TEXT NOT NULL, -- Materialized path for efficient queries
    
    -- Category type
    category_type VARCHAR(30) NOT NULL, -- 'subject', 'skill', 'industry', 'location', 'demographic'
    
    -- Display
    icon VARCHAR(50), -- Icon class or emoji
    color VARCHAR(7), -- Hex color
    display_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(slug, category_type)
);

-- Program categories - Many-to-many relationship
CREATE TABLE program_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    
    -- Relationship metadata
    relevance_score DECIMAL(3,2) DEFAULT 1.00, -- How relevant is this category (0.00-1.00)
    is_primary BOOLEAN DEFAULT false, -- Is this a primary category for the program?
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(program_id, category_id),
    CONSTRAINT valid_relevance CHECK (relevance_score >= 0.00 AND relevance_score <= 1.00)
);

-- =====================================================
-- USER MANAGEMENT & COMMUNITY
-- =====================================================

-- Users table - Community members and administrators
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    
    -- Authentication (Supabase handles this, but we store additional info)
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    
    -- Profile
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(150),
    avatar_url TEXT,
    bio TEXT,
    
    -- Community connection
    community_affiliations TEXT[], -- ['ethiopian', 'eritrean', 'habesha', 'diaspora']
    languages_spoken TEXT[], -- ['amharic', 'tigrinya', 'oromo', 'english', 'arabic']
    
    -- Location
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(3) DEFAULT 'USA',
    timezone VARCHAR(50),
    
    -- Preferences
    preferred_language VARCHAR(10) DEFAULT 'en',
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Role & permissions
    role VARCHAR(20) DEFAULT 'user', -- 'user', 'moderator', 'admin', 'super_admin'
    permissions TEXT[], -- Granular permissions
    
    -- Verification & trust
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(30), -- 'email', 'phone', 'community_leader', 'document'
    trust_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Activity tracking
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- Lifecycle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_user_trust_score CHECK (trust_score >= 0.00 AND trust_score <= 5.00)
);

-- =====================================================
-- USER INTERACTIONS & ENGAGEMENT
-- =====================================================

-- User favorites/bookmarks
CREATE TABLE user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    
    -- Favorite metadata
    notes TEXT,
    tags TEXT[], -- User's personal tags
    priority INTEGER DEFAULT 0, -- User's priority ranking
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, program_id)
);

-- Reviews and ratings
CREATE TABLE program_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES program_sessions(id) ON DELETE SET NULL,
    
    -- Review content
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    content TEXT,
    
    -- Detailed ratings
    content_quality_rating INTEGER CHECK (content_quality_rating >= 1 AND content_quality_rating <= 5),
    instructor_rating INTEGER CHECK (instructor_rating >= 1 AND instructor_rating <= 5),
    organization_rating INTEGER CHECK (organization_rating >= 1 AND organization_rating <= 5),
    value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
    
    -- Community-specific ratings
    cultural_relevance_rating INTEGER CHECK (cultural_relevance_rating >= 1 AND cultural_relevance_rating <= 5),
    language_support_rating INTEGER CHECK (language_support_rating >= 1 AND language_support_rating <= 5),
    
    -- Verification
    is_verified_participant BOOLEAN DEFAULT false,
    participation_year INTEGER,
    
    -- Moderation
    is_approved BOOLEAN DEFAULT false,
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Engagement
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(program_id, user_id, session_id)
);

-- =====================================================
-- DATA QUALITY & VALIDATION
-- =====================================================

-- Data sources - Track where information comes from
CREATE TABLE data_sources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(30) NOT NULL, -- 'official_website', 'api', 'manual_entry', 'community_submission', 'web_scraping'
    url TEXT,
    reliability_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00 to 5.00
    last_accessed TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data validation rules
CREATE TABLE validation_rules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL, -- 'programs', 'organizations'
    field_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(30) NOT NULL, -- 'required', 'format', 'range', 'custom'
    rule_definition JSONB NOT NULL,
    error_message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'error', -- 'error', 'warning', 'info'
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data quality issues
CREATE TABLE data_quality_issues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    field_name VARCHAR(100),
    issue_type VARCHAR(50) NOT NULL, -- 'missing_required', 'invalid_format', 'outdated', 'inconsistent'
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL,
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'ignored'
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- AUDIT & CHANGE TRACKING
-- =====================================================

-- Audit log for all changes
CREATE TABLE audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    user_id UUID REFERENCES users(id),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Organizations indexes
CREATE INDEX idx_organizations_type ON organizations(type);
CREATE INDEX idx_organizations_country ON organizations(country);
CREATE INDEX idx_organizations_verification ON organizations(verification_status);
CREATE INDEX idx_organizations_active ON organizations(is_active);
CREATE INDEX idx_organizations_search ON organizations USING GIN(search_vector);
CREATE INDEX idx_organizations_location ON organizations USING GIST(coordinates);

-- Programs indexes
CREATE INDEX idx_programs_organization ON programs(organization_id);
CREATE INDEX idx_programs_type ON programs(program_type);
CREATE INDEX idx_programs_audience ON programs(target_audience);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_rating ON programs(rating_average);
CREATE INDEX idx_programs_search ON programs USING GIN(search_vector);
CREATE INDEX idx_programs_slug ON programs(organization_id, slug);

-- Attributes indexes
CREATE INDEX idx_program_attributes_program ON program_attributes(program_id);
CREATE INDEX idx_program_attributes_definition ON program_attributes(attribute_definition_id);
CREATE INDEX idx_program_attributes_string ON program_attributes(value_string) WHERE value_string IS NOT NULL;
CREATE INDEX idx_program_attributes_integer ON program_attributes(value_integer) WHERE value_integer IS NOT NULL;
CREATE INDEX idx_program_attributes_date ON program_attributes(value_date) WHERE value_date IS NOT NULL;

CREATE INDEX idx_organization_attributes_org ON organization_attributes(organization_id);
CREATE INDEX idx_organization_attributes_definition ON organization_attributes(attribute_definition_id);

-- Sessions indexes
CREATE INDEX idx_program_sessions_program ON program_sessions(program_id);
CREATE INDEX idx_program_sessions_year ON program_sessions(session_year);
CREATE INDEX idx_program_sessions_status ON program_sessions(status);
CREATE INDEX idx_program_sessions_dates ON program_sessions(start_date, end_date);

-- Categories indexes
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_type ON categories(category_type);
CREATE INDEX idx_categories_path ON categories USING GIN(path gin_trgm_ops);
CREATE INDEX idx_program_categories_program ON program_categories(program_id);
CREATE INDEX idx_program_categories_category ON program_categories(category_id);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_community ON users USING GIN(community_affiliations);
CREATE INDEX idx_users_languages ON users USING GIN(languages_spoken);
CREATE INDEX idx_users_active ON users(is_active);

-- Reviews indexes
CREATE INDEX idx_reviews_program ON program_reviews(program_id);
CREATE INDEX idx_reviews_user ON program_reviews(user_id);
CREATE INDEX idx_reviews_rating ON program_reviews(rating);
CREATE INDEX idx_reviews_approved ON program_reviews(is_approved);

-- Data quality indexes
CREATE INDEX idx_data_quality_entity ON data_quality_issues(entity_type, entity_id);
CREATE INDEX idx_data_quality_status ON data_quality_issues(status);
CREATE INDEX idx_data_quality_severity ON data_quality_issues(severity);

-- Audit indexes
CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update search vectors
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.type, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.state_province, '')), 'C');
    ELSIF TG_TABLE_NAME = 'programs' THEN
        NEW.search_vector := 
            setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
            setweight(to_tsvector('english', COALESCE(NEW.short_description, '')), 'B') ||
            setweight(to_tsvector('english', COALESCE(NEW.program_type, '')), 'C') ||
            setweight(to_tsvector('english', COALESCE(NEW.target_audience, '')), 'C');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB := '{}';
    new_data JSONB := '{}';
    changed_fields TEXT[] := '{}';
BEGIN
    -- Convert OLD and NEW to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        
        -- Find changed fields
        SELECT array_agg(key) INTO changed_fields
        FROM jsonb_each(old_data) o
        WHERE o.value IS DISTINCT FROM (new_data->o.key);
    ELSIF TG_OP = 'INSERT' THEN
        new_data := to_jsonb(NEW);
    END IF;
    
    -- Insert audit record
    INSERT INTO audit_log (
        table_name, record_id, action, old_values, new_values, changed_fields
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN old_data = '{}' THEN NULL ELSE old_data END,
        CASE WHEN new_data = '{}' THEN NULL ELSE new_data END,
        CASE WHEN array_length(changed_fields, 1) > 0 THEN changed_fields ELSE NULL END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Search vector triggers
CREATE TRIGGER update_organizations_search_vector
    BEFORE INSERT OR UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

CREATE TRIGGER update_programs_search_vector
    BEFORE INSERT OR UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_program_attributes_updated_at
    BEFORE UPDATE ON program_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_organization_attributes_updated_at
    BEFORE UPDATE ON organization_attributes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Audit triggers (for critical tables)
CREATE TRIGGER audit_organizations
    AFTER INSERT OR UPDATE OR DELETE ON organizations
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_programs
    AFTER INSERT OR UPDATE OR DELETE ON programs
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage own reviews" ON program_reviews
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Approved reviews are publicly readable" ON program_reviews
    FOR SELECT USING (is_approved = true);

-- Public read access for main content
CREATE POLICY "Organizations are publicly readable" ON organizations
    FOR SELECT USING (is_active = true);

CREATE POLICY "Programs are publicly readable" ON programs
    FOR SELECT USING (status = 'active');

CREATE POLICY "Categories are publicly readable" ON categories
    FOR SELECT USING (is_active = true);

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert default attribute definitions
INSERT INTO attribute_definitions (name, display_name, description, data_type, category, applies_to, is_required, input_type) VALUES
-- Program attributes
('cost_amount', 'Program Cost', 'Total cost of the program in USD', 'decimal', 'financial', 'programs', false, 'number'),
('cost_category', 'Cost Category', 'General cost category', 'string', 'financial', 'programs', false, 'select'),
('financial_aid_available', 'Financial Aid Available', 'Whether financial aid is offered', 'boolean', 'financial', 'programs', false, 'checkbox'),
('grade_level_min', 'Minimum Grade Level', 'Minimum grade level for participants', 'integer', 'eligibility', 'programs', false, 'number'),
('grade_level_max', 'Maximum Grade Level', 'Maximum grade level for participants', 'integer', 'eligibility', 'programs', false, 'number'),
('age_min', 'Minimum Age', 'Minimum age for participants', 'integer', 'eligibility', 'programs', false, 'number'),
('age_max', 'Maximum Age', 'Maximum age for participants', 'integer', 'eligibility', 'programs', false, 'number'),
('citizenship_required', 'Citizenship Requirement', 'Citizenship or residency requirements', 'string', 'eligibility', 'programs', false, 'text'),
('application_requirements', 'Application Requirements', 'What is needed to apply', 'string', 'basic', 'programs', false, 'textarea'),
('key_benefits', 'Key Benefits', 'Main benefits of the program', 'string', 'basic', 'programs', false, 'textarea'),
('residential_status', 'Residential Status', 'Whether program is residential, day program, or hybrid', 'string', 'basic', 'programs', false, 'select'),
('languages_offered', 'Languages Offered', 'Languages in which the program is conducted', 'array', 'basic', 'programs', false, 'multiselect'),
('cultural_focus', 'Cultural Focus', 'Whether program has Ethiopian/Eritrean cultural components', 'boolean', 'basic', 'programs', false, 'checkbox'),
('community_focus', 'Community Focus', 'Target community for the program', 'string', 'basic', 'programs', false, 'select'),

-- Organization attributes
('tax_id', 'Tax ID', 'Organization tax identification number', 'string', 'basic', 'organizations', false, 'text'),
('accreditation', 'Accreditation', 'Educational or professional accreditations', 'array', 'basic', 'organizations', false, 'multiselect'),
('social_media', 'Social Media', 'Social media profiles', 'json', 'contact', 'organizations', false, 'json');

-- Insert default categories
INSERT INTO categories (name, slug, description, category_type, level, path) VALUES
-- Subject categories
('STEM', 'stem', 'Science, Technology, Engineering, Mathematics', 'subject', 0, 'stem'),
('Computer Science', 'computer-science', 'Programming, software development, AI', 'subject', 1, 'stem.computer-science'),
('Engineering', 'engineering', 'Various engineering disciplines', 'subject', 1, 'stem.engineering'),
('Mathematics', 'mathematics', 'Pure and applied mathematics', 'subject', 1, 'stem.mathematics'),
('Sciences', 'sciences', 'Biology, chemistry, physics, etc.', 'subject', 1, 'stem.sciences'),

('Liberal Arts', 'liberal-arts', 'Humanities, social sciences, arts', 'subject', 0, 'liberal-arts'),
('Languages', 'languages', 'Language learning and linguistics', 'subject', 1, 'liberal-arts.languages'),
('History', 'history', 'Historical studies and research', 'subject', 1, 'liberal-arts.history'),
('Literature', 'literature', 'Literary studies and creative writing', 'subject', 1, 'liberal-arts.literature'),

('Business', 'business', 'Business, entrepreneurship, finance', 'subject', 0, 'business'),
('Leadership', 'leadership', 'Leadership development programs', 'subject', 0, 'leadership'),

-- Demographic categories
('Ethiopian Community', 'ethiopian', 'Programs for Ethiopian community', 'demographic', 0, 'ethiopian'),
('Eritrean Community', 'eritrean', 'Programs for Eritrean community', 'demographic', 0, 'eritrean'),
('Habesha Community', 'habesha', 'Programs for Ethiopian and Eritrean communities', 'demographic', 0, 'habesha'),
('High School Students', 'high-school', 'Programs for high school students', 'demographic', 0, 'high-school'),
('College Students', 'college', 'Programs for college students', 'demographic', 0, 'college'),

-- Location categories
('National', 'national', 'Programs available nationwide', 'location', 0, 'national'),
('International', 'international', 'Programs in other countries', 'location', 0, 'international'),
('Virtual', 'virtual', 'Online/remote programs', 'location', 0, 'virtual');

-- Insert default data sources
INSERT INTO data_sources (name, type, reliability_score) VALUES
('Official Program Website', 'official_website', 5.00),
('University Website', 'official_website', 4.80),
('Government Database', 'api', 4.90),
('Community Submission', 'community_submission', 3.50),
('Manual Research', 'manual_entry', 4.00);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for programs with all their attributes
CREATE VIEW programs_with_attributes AS
SELECT 
    p.*,
    o.name as organization_name,
    o.website as organization_website,
    o.city as organization_city,
    o.state_province as organization_state,
    
    -- Aggregate attributes into JSONB
    COALESCE(
        jsonb_object_agg(
            ad.name, 
            CASE ad.data_type
                WHEN 'string' THEN to_jsonb(pa.value_string)
                WHEN 'integer' THEN to_jsonb(pa.value_integer)
                WHEN 'decimal' THEN to_jsonb(pa.value_decimal)
                WHEN 'boolean' THEN to_jsonb(pa.value_boolean)
                WHEN 'date' THEN to_jsonb(pa.value_date)
                WHEN 'json' THEN pa.value_json
                WHEN 'array' THEN to_jsonb(pa.value_array)
                ELSE NULL
            END
        ) FILTER (WHERE pa.id IS NOT NULL),
        '{}'::jsonb
    ) as attributes,
    
    -- Categories as array
    COALESCE(
        array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL),
        '{}'::text[]
    ) as categories

FROM programs p
JOIN organizations o ON p.organization_id = o.id
LEFT JOIN program_attributes pa ON p.id = pa.program_id
LEFT JOIN attribute_definitions ad ON pa.attribute_definition_id = ad.id
LEFT JOIN program_categories pc ON p.id = pc.program_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.status = 'active' AND o.is_active = true
GROUP BY p.id, o.id;

-- View for program search with ranking
CREATE VIEW program_search AS
SELECT 
    p.*,
    o.name as organization_name,
    o.trust_score as organization_trust_score,
    
    -- Search ranking factors
    (
        CASE WHEN p.rating_average > 4.0 THEN 0.3 ELSE 0.0 END +
        CASE WHEN p.rating_count > 10 THEN 0.2 ELSE 0.0 END +
        CASE WHEN o.verification_status = 'verified' THEN 0.2 ELSE 0.0 END +
        CASE WHEN o.trust_score > 4.0 THEN 0.3 ELSE 0.0 END
    ) as quality_score

FROM programs p
JOIN organizations o ON p.organization_id = o.id
WHERE p.status = 'active' AND o.is_active = true;

COMMENT ON SCHEMA public IS 'Dynamic, extensible schema for Ethiopia Community Resources - designed for long-term maintainability and scalability';
