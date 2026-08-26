-- Cómo prefiere moverse el viajero por el destino: condiciona la distancia
-- entre paradas, la forma de la ruta de cada día y las líneas de transporte
-- que el itinerario puede citar. Opcional — createTrip hace fallback si la
-- columna aún no existe en prod.
-- Valores: 'walking' | 'transit' | 'taxi' | 'car' | 'mixed'
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS transport TEXT;
