-- Initial migration for Ethiopian Community Resources
-- This file contains the complete schema for the community database

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA extensions;

-- Set up the initial schema
\i ../database/schema.sql

-- Insert sample data for testing
INSERT INTO programs (
    program_name, 
    program_name_amharic, 
    program_name_tigrinya,
    organization,
    description,
    target_community,
    languages_offered,
    cultural_focus,
    cost_category,
    program_type,
    subject_area,
    location_city,
    location_state,
    start_date,
    end_date,
    application_deadline,
    website,
    contact_email,
    is_featured,
    verification_status
) VALUES 
(
    'Ethiopian Heritage Summer Camp',
    'የኢትዮጵያ ቅርስ የበጋ ካምፕ',
    'ናይ ኢትዮጵያ ውርሻ ሓጋይ ካምፕ',
    'Ethiopian Community Center of Greater Washington',
    'A comprehensive summer program celebrating Ethiopian culture, language, and traditions for children ages 6-14.',
    'ethiopian',
    ARRAY['amharic', 'english'],
    true,
    'LOW_COST',
    'CULTURAL_PROGRAM',
    'Cultural Studies',
    'Silver Spring',
    'MD',
    '2025-06-15',
    '2025-08-15',
    '2025-05-01',
    'https://eccgw.org/summer-camp',
    'info@eccgw.org',
    true,
    'verified'
),
(
    'Tigrinya Language Academy',
    'የትግርኛ ቋንቋ አካዳሚ',
    'ትግርኛ ቋንቋ አካዳሚ',
    'Eritrean Community Center',
    'Intensive Tigrinya language classes for children and adults in the Eritrean community.',
    'eritrean',
    ARRAY['tigrinya', 'english'],
    true,
    'FREE',
    'LANGUAGE_SCHOOL',
    'Language Arts',
    'Washington',
    'DC',
    '2025-06-01',
    '2025-08-31',
    '2025-04-15',
    'https://eritreancenter.org',
    'education@eritreancenter.org',
    true,
    'verified'
),
(
    'Habesha Youth Leadership Program',
    'የሐበሻ ወጣቶች አመራር ፕሮግራም',
    'ናይ ሓበሻ መንእሰያት መራሕነት መደብ',
    'Horn of Africa Youth Alliance',
    'Leadership development program for Ethiopian and Eritrean high school students.',
    'habesha',
    ARRAY['amharic', 'tigrinya', 'english'],
    true,
    'SCHOLARSHIP_AVAILABLE',
    'LEADERSHIP',
    'Leadership Development',
    'Alexandria',
    'VA',
    '2025-07-01',
    '2025-07-31',
    '2025-05-15',
    'https://haya.org/leadership',
    'leadership@haya.org',
    true,
    'verified'
);

-- Insert sample organizations
INSERT INTO organizations (
    name,
    name_amharic,
    name_tigrinya,
    type,
    description,
    community_served,
    languages_supported,
    website,
    email,
    city,
    state,
    is_verified
) VALUES
(
    'Ethiopian Community Center of Greater Washington',
    'የዋሽንግተን ኢትዮጵያዊያን ማህበረሰብ ማዕከል',
    'ናይ ዋሽንግተን ኢትዮጵያውያን ማሕበረሰብ ማእከል',
    'community_center',
    'Serving the Ethiopian community in the Greater Washington area since 1985.',
    'ethiopian',
    ARRAY['amharic', 'oromo', 'english'],
    'https://eccgw.org',
    'info@eccgw.org',
    'Silver Spring',
    'MD',
    true
),
(
    'Eritrean Community Center',
    'የኤርትራ ማህበረሰብ ማዕከል',
    'ናይ ኤርትራ ማሕበረሰብ ማእከል',
    'community_center',
    'Cultural and educational programs for the Eritrean diaspora.',
    'eritrean',
    ARRAY['tigrinya', 'arabic', 'english'],
    'https://eritreancenter.org',
    'info@eritreancenter.org',
    'Washington',
    'DC',
    true
);

-- Create sample reviews
INSERT INTO program_reviews (
    program_id,
    user_id,
    rating,
    review_text,
    cultural_relevance_rating,
    language_support_rating,
    community_connection_rating,
    is_verified,
    verified_enrollment
) 
SELECT 
    p.id,
    gen_random_uuid(),
    5,
    'Excellent program that really connects our children to their Ethiopian heritage!',
    5,
    5,
    5,
    true,
    true
FROM programs p 
WHERE p.program_name = 'Ethiopian Heritage Summer Camp';

-- Update program ratings
SELECT update_program_rating() FROM program_reviews LIMIT 1;

