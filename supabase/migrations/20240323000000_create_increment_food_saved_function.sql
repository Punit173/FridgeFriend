-- Create a function to safely increment food_saved_kg
CREATE OR REPLACE FUNCTION increment_food_saved(community_id UUID, amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT food_saved_kg + amount
    FROM communities
    WHERE id = community_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 