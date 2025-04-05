-- Create communities table
CREATE TABLE IF NOT EXISTS communities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    member_count INTEGER DEFAULT 0,
    food_saved_kg DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create user_communities junction table
CREATE TABLE IF NOT EXISTS user_communities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    community_id UUID REFERENCES communities(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, community_id)
);

-- Create RLS policies
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communities ENABLE ROW LEVEL SECURITY;

-- Communities policies
CREATE POLICY "Communities are viewable by everyone"
    ON communities FOR SELECT
    USING (true);

CREATE POLICY "Communities can be created by authenticated users"
    ON communities FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- User communities policies
CREATE POLICY "User communities are viewable by the user"
    ON user_communities FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can join communities"
    ON user_communities FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Insert some sample communities
INSERT INTO communities (name, description, member_count, food_saved_kg)
VALUES
    ('Zero Waste Warriors', 'Join us in our mission to eliminate food waste through smart management and sharing', 150, 1250.50),
    ('Sustainable Foodies', 'A community focused on sustainable cooking and food preservation techniques', 200, 1800.75),
    ('Food Rescue Network', 'Connect with local food banks and help redistribute surplus food', 300, 2500.25),
    ('Smart Kitchen Club', 'Learn and share tips about smart kitchen management and food tracking', 100, 800.00),
    ('Eco-Conscious Cooks', 'A community for environmentally conscious cooking and food waste reduction', 250, 2000.50); 