-- Ethiopian & Eritrean Community Summer Programs Database Schema
-- Flexible schema designed for cultural and community-specific programs

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Programs table - Main table for all summer programs and community resources
CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    program_name_amharic VARCHAR(255), -- Amharic translation
    program_name_tigrinya VARCHAR(255), -- Tigrinya translation
    program_name_oromo VARCHAR(255), -- Oromo translation
    organization VARCHAR(255),
    organization_type VARCHAR(100), -- 'community_center', 'religious', 'cultural', 'educational', 'government', 'nonprofit'
    description TEXT,
    description_amharic TEXT,
    description_tigrinya TEXT,
    description_oromo TEXT,
    
    -- Program Details
    grade_level_min INTEGER,
    grade_level_max INTEGER,
    age_min INTEGER,
    age_max INTEGER,
    cost_category VARCHAR(50), -- 'FREE', 'LOW_COST', 'PAID', 'SCHOLARSHIP_AVAILABLE', 'SLIDING_SCALE'
    cost_amount DECIMAL(10,2),
    cost_currency VARCHAR(10) DEFAULT 'USD',
    program_type VARCHAR(100), -- 'summer_camp', 'tutoring', 'cultural_program', 'language_school', 'sports', 'arts', 'stem', 'leadership'
    subject_area VARCHAR(100),
    
    -- Cultural & Community Specific
    target_community VARCHAR(100), -- 'ethiopian', 'eritrean', 'habesha', 'general', 'mixed'
    languages_offered TEXT[], -- Array of languages: ['amharic', 'tigrinya', 'oromo', 'english', 'arabic']
    cultural_focus BOOLEAN DEFAULT false, -- Programs with Ethiopian/Eritrean cultural components
    religious_affiliation VARCHAR(100), -- 'orthodox', 'catholic', 'protestant', 'muslim', 'secular', 'interfaith'
    
    -- Location & Logistics
    location_type VARCHAR(50), -- 'in_person', 'virtual', 'hybrid'
    location_address TEXT,
    location_city VARCHAR(100),
    location_state VARCHAR(10),
    location_country VARCHAR(50) DEFAULT 'USA',
    location_zip VARCHAR(20),
    coordinates POINT, -- Geographic coordinates
    transportation_provided BOOLEAN DEFAULT false,
    transportation_notes TEXT,
    
    -- Schedule & Duration
    duration_weeks INTEGER,
    duration_hours_per_week INTEGER,
    start_date DATE,
    end_date DATE,
    schedule_days VARCHAR(50), -- 'monday-friday', 'weekends', 'flexible'
    schedule_time VARCHAR(100), -- '9am-3pm', 'evenings', 'flexible'
    
    -- Application & Eligibility
    application_deadline DATE,
    application_process TEXT,
    application_requirements TEXT,
    eligibility_requirements TEXT,
    selectivity_percent INTEGER,
    capacity_total INTEGER,
    capacity_remaining INTEGER,
    
    -- Financial Information
    stipend_amount DECIMAL(10,2),
    financial_aid_available BOOLEAN DEFAULT false,
    scholarship_info TEXT,
    payment_plans_available BOOLEAN DEFAULT false,
    
    -- Contact & Resources
    website TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_person VARCHAR(255),
    social_media JSONB, -- {'facebook': 'url', 'instagram': 'url', 'whatsapp': 'number'}
    
    -- Program Benefits & Features
    key_benefits TEXT,
    special_features TEXT,
    meals_provided BOOLEAN DEFAULT false,
    meal_type VARCHAR(50), -- 'halal', 'vegetarian', 'ethiopian_cuisine', 'standard'
    childcare_available BOOLEAN DEFAULT false,
    
    -- Community Integration
    parent_involvement BOOLEAN DEFAULT false,
    community_service_component BOOLEAN DEFAULT false,
    mentorship_program BOOLEAN DEFAULT false,
    alumni_network BOOLEAN DEFAULT false,
    
    -- Verification & Quality
    verification_status VARCHAR(50) DEFAULT 'pending', -- 'verified', 'pending', 'flagged'
    verified_by VARCHAR(255),
    verification_date TIMESTAMP WITH TIME ZONE,
    community_rating DECIMAL(3,2), -- Average rating from 1.00 to 5.00
    total_reviews INTEGER DEFAULT 0,
    
    -- Administrative
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    priority_level INTEGER DEFAULT 0, -- Higher numbers = higher priority
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Categories table - Flexible categorization system
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_amharic VARCHAR(100),
    name_tigrinya VARCHAR(100),
    name_oromo VARCHAR(100),
    type VARCHAR(50) NOT NULL, -- 'cost', 'program_type', 'subject', 'age_group', 'community', 'language'
    parent_category_id UUID REFERENCES categories(id),
    description TEXT,
    icon VARCHAR(50), -- Emoji or icon class
    color VARCHAR(20), -- Hex color code
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Program categories junction table
CREATE TABLE IF NOT EXISTS program_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, category_id)
);

-- Users table - Community members
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    name_amharic VARCHAR(255),
    picture TEXT,
    provider VARCHAR(50) DEFAULT 'google',
    role VARCHAR(50) DEFAULT 'user', -- 'user', 'moderator', 'admin', 'community_leader'
    
    -- Community Profile
    community_affiliation VARCHAR(100), -- 'ethiopian', 'eritrean', 'habesha'
    languages_spoken TEXT[], -- Array of languages
    location_city VARCHAR(100),
    location_state VARCHAR(10),
    
    -- Preferences
    preferred_language VARCHAR(20) DEFAULT 'english',
    notification_preferences JSONB DEFAULT '{}'::jsonb,
    privacy_settings JSONB DEFAULT '{}'::jsonb,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_method VARCHAR(50), -- 'community_leader', 'document', 'referral'
    verified_by UUID REFERENCES users(id),
    
    -- Activity
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- User favorites - Saved programs
CREATE TABLE IF NOT EXISTS user_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    notes TEXT, -- Personal notes about the program
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, program_id)
);

-- User applications - Application tracking
CREATE TABLE IF NOT EXISTS user_applications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'interested', -- 'interested', 'applied', 'accepted', 'rejected', 'enrolled', 'completed'
    application_date DATE,
    enrollment_date DATE,
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews and ratings
CREATE TABLE IF NOT EXISTS program_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_text_amharic TEXT,
    review_text_tigrinya TEXT,
    
    -- Review Categories
    cultural_relevance_rating INTEGER CHECK (cultural_relevance_rating >= 1 AND cultural_relevance_rating <= 5),
    language_support_rating INTEGER CHECK (language_support_rating >= 1 AND language_support_rating <= 5),
    community_connection_rating INTEGER CHECK (community_connection_rating >= 1 AND community_connection_rating <= 5),
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verified_enrollment BOOLEAN DEFAULT false, -- User actually attended the program
    
    -- Helpful votes
    helpful_votes INTEGER DEFAULT 0,
    total_votes INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, user_id)
);

-- Community organizations and partners
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_amharic VARCHAR(255),
    name_tigrinya VARCHAR(255),
    type VARCHAR(100), -- 'community_center', 'church', 'mosque', 'cultural_org', 'school', 'nonprofit'
    description TEXT,
    
    -- Contact Information
    website TEXT,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(10),
    
    -- Community Details
    community_served VARCHAR(100), -- 'ethiopian', 'eritrean', 'habesha', 'general'
    languages_supported TEXT[],
    established_year INTEGER,
    
    -- Verification
    is_verified BOOLEAN DEFAULT false,
    verification_documents JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Link programs to organizations
CREATE TABLE IF NOT EXISTS program_organizations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50), -- 'host', 'partner', 'sponsor', 'referral'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(program_id, organization_id, relationship_type)
);

-- Community events and announcements
CREATE TABLE IF NOT EXISTS community_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_amharic VARCHAR(255),
    title_tigrinya VARCHAR(255),
    description TEXT,
    event_type VARCHAR(100), -- 'info_session', 'cultural_event', 'workshop', 'meeting'
    
    -- Event Details
    start_datetime TIMESTAMP WITH TIME ZONE,
    end_datetime TIMESTAMP WITH TIME ZONE,
    location TEXT,
    is_virtual BOOLEAN DEFAULT false,
    meeting_link TEXT,
    
    -- Community Relevance
    target_community VARCHAR(100),
    languages TEXT[],
    
    -- Related Programs
    related_programs UUID[],
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Data import and migration tracking
CREATE TABLE IF NOT EXISTS data_imports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    import_type VARCHAR(50) NOT NULL,
    source_file VARCHAR(255),
    source_description TEXT,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    error_log TEXT,
    import_metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(program_name);
CREATE INDEX IF NOT EXISTS idx_programs_community ON programs(target_community);
CREATE INDEX IF NOT EXISTS idx_programs_cost_category ON programs(cost_category);
CREATE INDEX IF NOT EXISTS idx_programs_program_type ON programs(program_type);
CREATE INDEX IF NOT EXISTS idx_programs_grade_level ON programs(grade_level_min, grade_level_max);
CREATE INDEX IF NOT EXISTS idx_programs_age ON programs(age_min, age_max);
CREATE INDEX IF NOT EXISTS idx_programs_location ON programs(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_programs_dates ON programs(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_programs_deadline ON programs(application_deadline);
CREATE INDEX IF NOT EXISTS idx_programs_active ON programs(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_featured ON programs(is_featured);
CREATE INDEX IF NOT EXISTS idx_programs_languages ON programs USING GIN(languages_offered);
CREATE INDEX IF NOT EXISTS idx_programs_cultural ON programs(cultural_focus);
CREATE INDEX IF NOT EXISTS idx_programs_verification ON programs(verification_status);
CREATE INDEX IF NOT EXISTS idx_programs_rating ON programs(community_rating);
CREATE INDEX IF NOT EXISTS idx_programs_metadata ON programs USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_programs_coordinates ON programs USING GIST(coordinates);

CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

CREATE INDEX IF NOT EXISTS idx_users_community ON users(community_affiliation);
CREATE INDEX IF NOT EXISTS idx_users_languages ON users USING GIN(languages_spoken);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_city, location_state);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_program ON user_favorites(program_id);

CREATE INDEX IF NOT EXISTS idx_user_applications_user ON user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_program ON user_applications(program_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON user_applications(status);

CREATE INDEX IF NOT EXISTS idx_reviews_program ON program_reviews(program_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON program_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON program_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON program_reviews(is_verified);

CREATE INDEX IF NOT EXISTS idx_organizations_type ON organizations(type);
CREATE INDEX IF NOT EXISTS idx_organizations_community ON organizations(community_served);
CREATE INDEX IF NOT EXISTS idx_organizations_languages ON organizations USING GIN(languages_supported);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_applications_updated_at BEFORE UPDATE ON user_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON program_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories for Ethiopian/Eritrean community
INSERT INTO categories (name, name_amharic, name_tigrinya, type, description, icon, display_order) VALUES
    -- Cost Categories
    ('FREE', 'ነፃ', 'ነፃ', 'cost', 'Completely free programs', '🆓', 1),
    ('LOW_COST', 'ዝቅተኛ ወጪ', 'ትሑት ክፍሊት', 'cost', 'Affordable programs under $100', '💰', 2),
    ('SCHOLARSHIP_AVAILABLE', 'የዕድል ስኮላርሺፕ', 'ስኮላርሺፕ ይርከብ', 'cost', 'Programs with scholarship opportunities', '🎓', 3),
    ('SLIDING_SCALE', 'የተለያየ ክፍያ', 'ተመጣጣኒ ክፍሊት', 'cost', 'Payment based on family income', '📊', 4),
    ('PAID', 'የሚከፈልበት', 'ክፍሊት ዘለዎ', 'cost', 'Paid programs', '💳', 5),
    
    -- Program Types
    ('CULTURAL_PROGRAM', 'የባህል ፕሮግራም', 'ባህላዊ መደብ', 'program_type', 'Ethiopian/Eritrean cultural programs', '🇪🇹', 1),
    ('LANGUAGE_SCHOOL', 'የቋንቋ ትምህርት', 'ቋንቋ ትምህርቲ', 'program_type', 'Amharic, Tigrinya, Oromo language classes', '📚', 2),
    ('SUMMER_CAMP', 'የበጋ ካምፕ', 'ናይ ሓጋይ ካምፕ', 'program_type', 'Summer day camps and overnight camps', '🏕️', 3),
    ('TUTORING', 'ተጨማሪ ትምህርት', 'ተወሳኺ ትምህርቲ', 'program_type', 'Academic tutoring and homework help', '📖', 4),
    ('SPORTS', 'ስፖርት', 'ስፖርት', 'program_type', 'Sports and athletic programs', '⚽', 5),
    ('ARTS', 'ጥበብ', 'ጥበብ', 'program_type', 'Arts, music, and creative programs', '🎨', 6),
    ('STEM', 'ሳይንስ እና ቴክኖሎጂ', 'ሳይንስን ቴክኖሎጂን', 'program_type', 'Science, technology, engineering, math', '🔬', 7),
    ('LEADERSHIP', 'አመራር', 'መራሕነት', 'program_type', 'Leadership and civic engagement', '👥', 8),
    ('RELIGIOUS', 'ሃይማኖታዊ', 'ሃይማኖታዊ', 'program_type', 'Religious education and activities', '⛪', 9),
    
    -- Age Groups
    ('EARLY_CHILDHOOD', 'ቅድመ ትምህርት', 'ቅድሚ ትምህርቲ', 'age_group', 'Ages 3-5', '👶', 1),
    ('ELEMENTARY', 'የመጀመሪያ ደረጃ', 'ቀዳማይ ደረጃ', 'age_group', 'Ages 6-10', '🧒', 2),
    ('MIDDLE_SCHOOL', 'የመካከለኛ ደረጃ', 'ማእከላይ ደረጃ', 'age_group', 'Ages 11-13', '👦', 3),
    ('HIGH_SCHOOL', 'የሁለተኛ ደረጃ', 'ካልኣይ ደረጃ', 'age_group', 'Ages 14-18', '👨‍🎓', 4),
    ('COLLEGE', 'ኮሌጅ', 'ኮሌጅ', 'age_group', 'College age and young adults', '🎓', 5),
    
    -- Community Focus
    ('ETHIOPIAN', 'ኢትዮጵያዊ', 'ኢትዮጵያዊ', 'community', 'Ethiopian community focused', '🇪🇹', 1),
    ('ERITREAN', 'ኤርትራዊ', 'ኤርትራዊ', 'community', 'Eritrean community focused', '🇪🇷', 2),
    ('HABESHA', 'ሐበሻ', 'ሓበሻ', 'community', 'Ethiopian and Eritrean communities', '🤝', 3),
    ('MULTICULTURAL', 'ባህላዊ ብዝሕነት', 'ብዙሕ ባህሊ', 'community', 'Multicultural and inclusive', '🌍', 4),
    
    -- Languages
    ('AMHARIC', 'አማርኛ', 'አማርኛ', 'language', 'Amharic language support', '🗣️', 1),
    ('TIGRINYA', 'ትግርኛ', 'ትግርኛ', 'language', 'Tigrinya language support', '🗣️', 2),
    ('OROMO', 'ኦሮምኛ', 'ኦሮምኛ', 'language', 'Oromo language support', '🗣️', 3),
    ('ENGLISH', 'እንግሊዝኛ', 'እንግሊዝኛ', 'language', 'English language programs', '🗣️', 4),
    ('BILINGUAL', 'ባለሁለት ቋንቋ', 'ክልተ ቋንቋ', 'language', 'Bilingual programs', '🗣️', 5)
ON CONFLICT (name) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Programs are publicly readable
CREATE POLICY "Programs are publicly readable" ON programs
    FOR SELECT USING (is_active = true);

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- User favorites policies
CREATE POLICY "Users can manage own favorites" ON user_favorites
    FOR ALL USING (auth.uid()::text = user_id::text);

-- User applications policies
CREATE POLICY "Users can manage own applications" ON user_applications
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Review policies
CREATE POLICY "Users can manage own reviews" ON program_reviews
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Reviews are publicly readable" ON program_reviews
    FOR SELECT USING (true);

-- Function to update program rating when reviews are added/updated
CREATE OR REPLACE FUNCTION update_program_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE programs 
    SET 
        community_rating = (
            SELECT AVG(rating)::DECIMAL(3,2) 
            FROM program_reviews 
            WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
            AND is_verified = true
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM program_reviews 
            WHERE program_id = COALESCE(NEW.program_id, OLD.program_id)
            AND is_verified = true
        )
    WHERE id = COALESCE(NEW.program_id, OLD.program_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update program rating
CREATE TRIGGER update_program_rating_trigger
    AFTER INSERT OR UPDATE OR DELETE ON program_reviews
    FOR EACH ROW EXECUTE FUNCTION update_program_rating();