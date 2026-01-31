-- Enable RLS on availability table
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for booking)
DROP POLICY IF EXISTS "Public read access availability" ON availability;
CREATE POLICY "Public read access availability"
ON availability FOR SELECT
USING (true);

-- Allow authenticated users with role 'psychologist' to do everything
DROP POLICY IF EXISTS "Psychologist full access availability" ON availability;
CREATE POLICY "Psychologist full access availability"
ON availability FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role = 'psychologist'
  )
);
