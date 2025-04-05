-- Add user_id column to Product Data table
ALTER TABLE "Product Data" ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE "Product Data" ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own products
CREATE POLICY "Users can view their own products"
    ON "Product Data"
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own products
CREATE POLICY "Users can insert their own products"
    ON "Product Data"
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own products
CREATE POLICY "Users can update their own products"
    ON "Product Data"
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own products
CREATE POLICY "Users can delete their own products"
    ON "Product Data"
    FOR DELETE
    USING (auth.uid() = user_id); 