-- Ethiopian Community Resources Database Schema
-- This file contains all the database tables and relationships

-- Users table for authentication and role management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    google_id VARCHAR(255) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'data_admin', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    website VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    description TEXT,
    website VARCHAR(500),
    cost_category VARCHAR(50) DEFAULT 'FREE' CHECK (cost_category IN ('FREE', 'FREE_PLUS_STIPEND', 'FREE_PLUS_SCHOLARSHIP', 'LOW_COST', 'PAID')),
    grade_level VARCHAR(20),
    application_deadline DATE,
    deadline_note TEXT,
    location VARCHAR(255),
    prestige_level VARCHAR(50) DEFAULT 'accessible' CHECK (prestige_level IN ('elite', 'highly-selective', 'selective', 'accessible')),
    duration VARCHAR(100),
    financial_aid TEXT,
    additional_info TEXT,
    is_estimated_deadline BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Program suggestions table
CREATE TABLE IF NOT EXISTS program_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('new_program', 'edit_program')),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    program_data JSONB, -- For new program suggestions
    field VARCHAR(100), -- For edit suggestions
    old_value TEXT,
    new_value TEXT,
    reason TEXT,
    comment TEXT,
    submitted_by UUID REFERENCES users(id) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_comment TEXT
);

-- Comments on suggestions
CREATE TABLE IF NOT EXISTS suggestion_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID REFERENCES program_suggestions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) NOT NULL,
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, program_id)
);

-- Program views/analytics
CREATE TABLE IF NOT EXISTS program_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search analytics
CREATE TABLE IF NOT EXISTS search_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_term VARCHAR(255),
    filters JSONB,
    results_count INTEGER,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_programs_organization_id ON programs(organization_id);
CREATE INDEX IF NOT EXISTS idx_programs_cost_category ON programs(cost_category);
CREATE INDEX IF NOT EXISTS idx_programs_prestige_level ON programs(prestige_level);
CREATE INDEX IF NOT EXISTS idx_programs_grade_level ON programs(grade_level);
CREATE INDEX IF NOT EXISTS idx_programs_location ON programs(location);
CREATE INDEX IF NOT EXISTS idx_program_suggestions_status ON program_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_program_suggestions_submitted_by ON program_suggestions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_program_suggestions_type ON program_suggestions(type);
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_program_id ON user_favorites(program_id);
CREATE INDEX IF NOT EXISTS idx_program_views_program_id ON program_views(program_id);
CREATE INDEX IF NOT EXISTS idx_program_views_viewed_at ON program_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_search_analytics_searched_at ON search_analytics(searched_at);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_programs_search ON programs USING gin(to_tsvector('english', program_name || ' ' || COALESCE(description, '') || ' ' || COALESCE(location, '')));
CREATE INDEX IF NOT EXISTS idx_organizations_search ON organizations USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(city, '') || ' ' || COALESCE(state, '')));

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
VALUES ('admin@ethiopiancommunity.org', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'Admin', 'User', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Insert default data admin user (password: dataadmin123)
INSERT INTO users (email, password_hash, first_name, last_name, role, email_verified) 
VALUES ('dataadmin@ethiopiancommunity.org', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'Data', 'Admin', 'data_admin', true)
ON CONFLICT (email) DO NOTHING;