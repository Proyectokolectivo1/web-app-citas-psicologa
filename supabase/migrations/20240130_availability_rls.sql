-- Enable RLS on availability_overrides
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for booking)
DROP POLICY IF EXISTS "Public read access" ON availability_overrides;
CREATE POLICY "Public read access"
ON availability_overrides FOR SELECT
USING (true);

-- Allow authenticated users with role 'psychologist' to do everything
DROP POLICY IF EXISTS "Psychologist full access" ON availability_overrides;
CREATE POLICY "Psychologist full access"
ON availability_overrides FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'psychologist'
  )
);
