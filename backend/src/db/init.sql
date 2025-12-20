-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Users Table (Onboarding Basics)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    age INT,
    gender VARCHAR(20),
    location_name VARCHAR(255),
    location_coords GEOGRAPHY(Point), -- PostGIS for radius search
    relocation_willingness VARCHAR(50) DEFAULT 'anywhere', -- 'anywhere', 'country', 'none'
    intent VARCHAR(50) DEFAULT 'serious', -- 'marriage', 'serious'
    avatar_url TEXT,
    voice_bio_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    coins INT DEFAULT 0,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Profiles Table (The "Prompt-Based" Core)
CREATE TABLE profiles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    
    -- B. Prompt-Based Profile
    raw_prompt TEXT, -- "I want a partner who..."
    voice_intro_url TEXT, -- Optional Voice Input
    
    -- AI Extracted Data
    embedding vector(1536), -- Semantic representation of the prompt
    
    -- Structured Data (JSONB for flexibility)
    traits JSONB, -- { "openness": 0.8, "conscientiousness": 0.9 }
    values JSONB, -- ["family", "career", "growth"]
    dealbreakers JSONB, -- ["smoker", "pet_allergy"]
    
    -- Extended Profile Data
    metadata JSONB DEFAULT '{}',
    reels JSONB DEFAULT '[]',
    stories JSONB DEFAULT '[]',
    
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Matches (AI Scoring)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID REFERENCES users(id),
    user_b_id UUID REFERENCES users(id),
    score_total FLOAT, -- 0 to 1
    score_details JSONB, -- { "emotional": 0.9, "vision": 0.8, "conflict_risk": 0.2 }
    ai_analysis TEXT, -- "You match because..."
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id)
);

-- 4. Messages (Chat)
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES matches(id),
    sender_id UUID REFERENCES users(id),
    content TEXT,
    is_mediator_message BOOLEAN DEFAULT FALSE, -- AI Mediator
    created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50), -- 'like', 'request', 'match'
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. Reports
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id),
    reported_id UUID REFERENCES users(id),
    reason TEXT,
    details TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. Contact Generally
CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100),
    email VARCHAR(255),
    message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
