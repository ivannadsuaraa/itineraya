-- Personalización profunda del itinerario: ritmo del viaje, primera visita
-- al destino y restricciones dietéticas. Todas opcionales — el cliente hace
-- fallback si estas columnas aún no existen en prod.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS pace TEXT,
  ADD COLUMN IF NOT EXISTS first_visit BOOLEAN,
  ADD COLUMN IF NOT EXISTS dietary TEXT;
