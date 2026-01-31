-- Function to block a range of dates
CREATE OR REPLACE FUNCTION block_range_availability(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Check if user is authorized (psychologist)
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'psychologist'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only psychologists can block availability';
  END IF;

  -- Insert overrides for every day in the range
  INSERT INTO availability_overrides (date, is_unavailable, slots)
  SELECT
    d::date,
    true,
    '[]'::jsonb
  FROM generate_series(p_start_date, p_end_date, '1 day'::interval) AS d
  ON CONFLICT (date) DO UPDATE
  SET is_unavailable = true, slots = '[]'::jsonb;
END;
$$;

-- Function to unblock a range of dates
CREATE OR REPLACE FUNCTION unblock_range_availability(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  -- Check if user is authorized
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'psychologist'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only psychologists can unblock availability';
  END IF;

  DELETE FROM availability_overrides
  WHERE date >= p_start_date
  AND date <= p_end_date;
END;
$$;
