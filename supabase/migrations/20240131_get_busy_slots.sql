-- Función segura para obtener horarios ocupados sin revelar datos del paciente
-- Se ejecuta con SECURITY DEFINER para tener permisos de sistema y saltar RLS

CREATE OR REPLACE FUNCTION get_busy_slots(
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ
)
RETURNS TABLE (
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT a.start_time, a.end_time
  FROM appointments a
  WHERE a.start_time >= p_start_time
  AND a.start_time < p_end_time
  AND a.status != 'cancelled';
END;
$$;

-- Permitir a todos los usuarios autenticados y anónimos consultar disponibilidad
GRANT EXECUTE ON FUNCTION get_busy_slots(TIMESTAMPTZ, TIMESTAMPTZ) TO anon, authenticated, service_role;
