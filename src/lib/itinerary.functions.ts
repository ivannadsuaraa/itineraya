import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  destinationPhotoPool,
  destinationFallbackImage,
  sizeUnsplashUrl,
  itinerarySchema,
  extractJson,
  type ParsedItinerary,
} from "@/lib/itinerary-shared";
import {
  buildItineraryPrompt,
  MAX_ITINERARY_DAYS,
  SUPPORTED_ITIN_LANGS,
  type ItinLang,
} from "@/lib/itinerary-prompt";
import { verifyItineraryPlaces } from "@/lib/place-verification";
import { geocodeDestination } from "@/lib/geocode";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Input = z.object({
  tripId: z.string().uuid(),
  language: z.string().optional(),
});

// Mismos valores que usan los selectores de onboarding.tsx (companion,
// pace, dietaryIds, tripTypeIds) y el paceMap de este mismo fichero — un
// valor fuera de este conjunto no tiene mapeo en el prompt y antes se
// colaba tal cual porque la escritura era un INSERT directo desde el
// cliente sin ninguna validación de servidor.
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const CreateTripInput = z
  .object({
    destination: z.string().trim().min(2).max(120),
    startDate: z.string().regex(DATE_RE).nullable(),
    endDate: z.string().regex(DATE_RE).nullable(),
    arrivalTime: z.string().regex(TIME_RE).nullable(),
    departureTime: z.string().regex(TIME_RE).nullable(),
    companion: z.enum(["solo", "pareja", "amigos", "familia"]),
    budgetRange: z
      .tuple([z.number().int().min(0).max(200000), z.number().int().min(0).max(200000)])
      .refine(([lo, hi]) => lo <= hi, "budgetRange must be [low, high] with low <= high"),
    tripStyle: z.string().trim().max(400).nullable(),
    avoid: z.string().trim().max(500).nullable(),
    tripTypes: z
      .array(
        z.enum([
          "beach",
          "party",
          "cultural",
          "food",
          "relax",
          "nature",
          "romantic",
          "family",
          "adventure",
          "special",
          "architecture",
        ]),
      )
      .max(15),
    hasAccommodation: z.boolean(),
    hotelName: z.string().trim().max(200).nullable(),
    hotelAddress: z.string().trim().max(300).nullable(),
    hotelLat: z.number().min(-90).max(90).nullable(),
    hotelLng: z.number().min(-180).max(180).nullable(),
    pace: z.enum(["relaxed", "balanced", "intense"]),
    transport: z.enum(["walking", "transit", "taxi", "car", "mixed"]),
    firstVisit: z.boolean(),
    dietary: z.array(z.enum(["vegetarian", "vegan", "glutenFree", "halal", "allergies"])).max(5),
    geoLat: z.number().min(-90).max(90).nullable().optional(),
    geoLng: z.number().min(-180).max(180).nullable().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.startDate <= d.endDate, {
    message: "endDate must not be before startDate",
    path: ["endDate"],
  })
  // El generador recorta a MAX_ITINERARY_DAYS días. Sin esta comprobación un
  // viaje más largo se guardaba con sus fechas completas y volvía con solo los
  // primeros días, mientras la cabecera seguía anunciando el rango entero.
  .refine(
    (d) =>
      !d.startDate ||
      !d.endDate ||
      Math.round(
        (Date.parse(`${d.endDate}T00:00:00Z`) - Date.parse(`${d.startDate}T00:00:00Z`)) / 86400000,
      ) +
        1 <=
        MAX_ITINERARY_DAYS,
    {
      message: `Trip length must not exceed ${MAX_ITINERARY_DAYS} days`,
      path: ["endDate"],
    },
  );

// Crea el viaje "pending" que luego rellena generateItinerary. Antes era un
// INSERT directo a Supabase desde onboarding.tsx (sin límites de longitud,
// sin comprobar los enums) — el contenido de estos campos se interpola tal
// cual en el prompt de generateItinerary, así que la validación aquí evita
// tanto payloads absurdamente grandes (coste/calidad del prompt) como
// valores fuera de los enums que el prompt-builder ya asume.
export const createTrip = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateTripInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const basePayload = {
      user_id: userId,
      destination: data.destination,
      start_date: data.startDate,
      end_date: data.endDate,
      arrival_time: data.arrivalTime,
      departure_time: data.departureTime,
      companion: data.companion,
      budget: `${data.budgetRange[0]}-${data.budgetRange[1]}`,
      trip_style: data.tripStyle,
      avoid: data.avoid,
      trip_types: data.tripTypes,
      has_accommodation: data.hasAccommodation,
      hotel_name: data.hotelName,
      hotel_address: data.hotelAddress,
      hotel_lat: data.hotelLat,
      hotel_lng: data.hotelLng,
      status: "pending",
    };
    const personalization = {
      pace: data.pace,
      transport: data.transport,
      first_visit: data.firstVisit,
      dietary: data.dietary.length > 0 ? data.dietary.join(",") : null,
    };
    const geo =
      data.geoLat != null && data.geoLng != null
        ? { geo_lat: data.geoLat, geo_lng: data.geoLng }
        : {};

    let { data: trip, error } = await supabase
      .from("trips")
      .insert({ ...basePayload, ...personalization, ...geo })
      .select("id")
      .single();

    // Fallback: si alguna migración aún no está aplicada en prod (columnas
    // pace/first_visit/dietary o geo_lat/geo_lng inexistentes), reintenta
    // solo con el payload base para no bloquear la creación del viaje.
    if (
      error &&
      /column|pace|transport|first_visit|dietary|geo_lat|geo_lng|PGRST204/i.test(
        error.message ?? "",
      )
    ) {
      console.warn("[createTrip] optional columns missing, retrying without them", error);
      ({ data: trip, error } = await supabase
        .from("trips")
        .insert(basePayload)
        .select("id")
        .single());
    }

    if (error) throw new Error(error.message);
    if (!trip) throw new Error("No se pudo crear el viaje");
    return { id: trip.id as string };
  });

// Safety net independent of the plan-based lifetime/monthly cap below: that
// cap only counts trips that already reached status="ready", so retrying
// generation on the SAME not-yet-ready trip (a stuck AI call, a flaky
// network) never increments it — a scripted retry loop could otherwise hit
// the real Anthropic API without limit. The explorador plan also has no
// lifetime/monthly cap at all (planLimit = null below). This RPC-backed
// counter bounds real AI calls per user per day regardless of plan or trip
// status.
const DAILY_GENERATE_LIMIT = 20;

export const generateItinerary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: trip, error } = await supabase
      .from("trips")
      .select("*")
      .eq("id", data.tripId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !trip) throw new Error("Viaje no encontrado");
    // Plan-based itinerary limit
    // select("*") + cast: bonus_trips isn't in the generated Supabase types yet
    // (see supabase/migrations/20260707130000_trip_pass_and_referral_rewards.sql),
    // same workaround used for the trip_personalization columns above.
    const { data: planProfileRaw } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const planProfile = planProfileRaw as unknown as {
      plan?: "free" | "viajero" | "explorador";
      bonus_trips?: number;
    } | null;

    const plan = planProfile?.plan ?? "free";
    const bonusTrips = planProfile?.bonus_trips ?? 0;
    // Must match the client gate (new-trip.tsx) and the pricing page:
    // free = 2 lifetime, viajero = 5 per calendar month (resets on the 1st), explorador = unlimited.
    // Each Trip Pass purchased (bonus_trips) adds +1 on top of the plan limit.
    const baseLimit: number | null = plan === "explorador" ? null : plan === "viajero" ? 5 : 2;
    const planLimit: number | null = baseLimit === null ? null : baseLimit + bonusTrips;

    if (planLimit !== null) {
      // Count generated trips (same criterion as the client gate in new-trip.tsx).
      // Free: lifetime count, never resets. Viajero: only trips created in the
      // current calendar month, since its quota resets on the 1st.
      let countQuery = supabase
        .from("trips")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "ready")
        .neq("id", data.tripId);

      if (plan === "viajero") {
        const now = new Date();
        const startOfMonth = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
        ).toISOString();
        countQuery = countQuery.gte("created_at", startOfMonth);
      }

      const { count } = await countQuery;

      if ((count ?? 0) >= planLimit) {
        const msg =
          plan === "free"
            ? `LIMIT_REACHED: Has alcanzado el límite de ${planLimit} itinerarios en el plan gratuito. Compra un Pase de Viaje por 4,99€ para desbloquear uno más sin suscripción, o actualiza al plan Viajero para itinerarios ilimitados cada mes.`
            : `LIMIT_REACHED: Has alcanzado tu límite de ${planLimit} itinerarios este mes en el plan Viajero. Se renueva el día 1 de cada mes. Actualiza a Explorador para itinerarios ilimitados.`;
        throw new Error(msg);
      }
    }

    if (trip.status === "ready" && trip.itinerary) {
      return { itinerary: trip.itinerary, hero_image_url: trip.hero_image_url };
    }

    const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
      "check_and_increment_rate_limit" as never,
      { p_scope: "itinerary_generate_user", p_key: userId, p_limit: DAILY_GENERATE_LIMIT } as never,
    );
    if (rlErr) {
      // Fail closed on a broken rate limiter — better to briefly block
      // generation than to silently remove the cost cap on the Anthropic API.
      console.error("[itinerary] rate limit check failed", rlErr);
      throw new Error("No se pudo procesar la solicitud. Inténtalo de nuevo.");
    }
    if (!allowed) {
      throw new Error(
        `LIMIT_REACHED: Has alcanzado el límite de ${DAILY_GENERATE_LIMIT} generaciones diarias. Inténtalo mañana.`,
      );
    }

    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    // Load user profile (language, age, travel_style, budget_range, preferred_destinations)
    const { data: profile } = await supabase
      .from("profiles")
      .select("language, age, travel_style, budget_range, preferred_destinations, traveler_type")
      .eq("id", userId)
      .maybeSingle();
    // Prefer language passed from the client (current UI language) over stored profile.
    const clientLang = (data.language ?? "").toLowerCase().slice(0, 2);
    const profileLang = (profile?.language ?? "").toLowerCase().slice(0, 2);
    const lang: ItinLang = (SUPPORTED_ITIN_LANGS as readonly string[]).includes(clientLang)
      ? (clientLang as ItinLang)
      : (SUPPORTED_ITIN_LANGS as readonly string[]).includes(profileLang)
        ? (profileLang as ItinLang)
        : "es";

    // Trip history for personalization (last 5 ready trips, excluding current)
    const { data: history } = await supabase
      .from("trips")
      .select("destination, trip_style, companion, budget")
      .eq("user_id", userId)
      .eq("status", "ready")
      .neq("id", data.tripId)
      .order("created_at", { ascending: false })
      .limit(5);

    const historyLine =
      history && history.length > 0
        ? history
            .map(
              (t) =>
                `${t.destination} (${t.trip_style ?? "—"}, ${t.companion ?? "—"}, ${t.budget ?? "—"})`,
            )
            .join("; ")
        : "no previous trips";

    const { prompt, dayCount } = buildItineraryPrompt({
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      arrivalTime: (trip as { arrival_time?: string | null }).arrival_time ?? null,
      departureTime: (trip as { departure_time?: string | null }).departure_time ?? null,
      companion: (trip as { companion?: string | null }).companion ?? null,
      budget: (trip as { budget?: string | null }).budget ?? null,
      tripStyle: trip.trip_style,
      avoid: (trip as { avoid?: string | null }).avoid ?? null,
      tripTypes: (trip as { trip_types?: string[] | null }).trip_types ?? null,
      hasAccommodation: (trip as { has_accommodation?: boolean | null }).has_accommodation ?? null,
      hotelName: (trip as { hotel_name?: string | null }).hotel_name ?? null,
      hotelAddress: (trip as { hotel_address?: string | null }).hotel_address ?? null,
      hotelLat: (trip as { hotel_lat?: number | string | null }).hotel_lat ?? null,
      hotelLng: (trip as { hotel_lng?: number | string | null }).hotel_lng ?? null,
      // Columnas opcionales: null si la migración trip_personalization (o la de
      // transport) aún no está aplicada — buildItineraryPrompt tiene defaults.
      pace: (trip as { pace?: string | null }).pace ?? null,
      transport: (trip as { transport?: string | null }).transport ?? null,
      firstVisit: (trip as { first_visit?: boolean | null }).first_visit ?? null,
      dietary: (trip as { dietary?: string | null }).dietary ?? null,
      age: (profile as { age?: number | null } | null)?.age ?? null,
      travelerType: (profile as { traveler_type?: string | null } | null)?.traveler_type ?? null,
      lang,
      historyLine,
    });

    let aiRes: Response | null = null;
    for (let attempt = 1; attempt <= 3; attempt++) {
      const t0 = Date.now();
      console.log(
        `[itinerary] API call start (attempt ${attempt}) — ${dayCount} days, prompt ~${prompt.length} chars`,
      );
      aiRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": key,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 16000,
          system:
            "You are an expert travel planner. You create geographically coherent, time-realistic itineraries built around real venues, and you respond with a single JSON object that follows the provided schema exactly.",
          output_config: { format: { type: "json_schema", schema: itinerarySchema } },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      console.log(`[itinerary] API call end — ${Date.now() - t0}ms — status ${aiRes.status}`);
      if (aiRes.status !== 429) break;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 5000 * attempt));
    }
    if (!aiRes) throw new Error("Error al conectar con la IA.");

    if (!aiRes.ok) {
      const text = await aiRes.text();
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      throw new Error(`Error Claude ${aiRes.status}: ${text.slice(0, 200)}`);
    }

    const aiJson = (await aiRes.json()) as {
      content?: Array<{ text?: string }>;
      stop_reason?: string;
    };
    if (aiJson.stop_reason === "max_tokens")
      throw new Error("La respuesta del modelo se truncó. Vuelve a intentarlo.");
    const content = aiJson.content?.[0]?.text ?? "";
    if (!content) throw new Error("Respuesta vacía del modelo");

    type ParsedActivity = {
      time: string;
      emoji?: string;
      title: string;
      place?: string;
      description: string;
      category?: string;
    };
    type ParsedItin = {
      summary?: string;
      days: Array<{
        day: number;
        title: string;
        subtitle?: string;
        image_query?: string;
        image_url?: string | null;
        activities: ParsedActivity[];
      }>;
    };
    const parsed: ParsedItin = extractJson<ParsedItin>(content);
    if (!parsed.days || parsed.days.length === 0)
      throw new Error("El modelo no devolvió ningún día de itinerario. Vuelve a intentarlo.");
    if (parsed.days.length !== dayCount)
      console.warn(`[itinerary] expected ${dayCount} days, model returned ${parsed.days.length}`);

    // Un único pool de fotos verificadas del destino para la cabecera y los
    // días, igual que en la demo pública (demo.functions.ts). Antes cada
    // imagen era su propia búsqueda ("<destino> travel landscape",
    // "<image_query> <destino>"): Unsplash hace OR de los términos, así que
    // en destinos poco fotografiados los calificativos ganaban al topónimo y
    // salía la playa de otro país en la cabecera. Además eran 1 + dayCount
    // peticiones por itinerario (16 en un viaje de 14 días) contra una key
    // con 50 peticiones/hora para toda la app: al agotarse, el usuario de
    // pago acababa con fotos aleatorias de loremflickr.
    const photos = await destinationPhotoPool(trip.destination, parsed.days.length + 1);

    const hero =
      photos.length > 0
        ? sizeUnsplashUrl(photos[0], 2000, 1000)
        : destinationFallbackImage(trip.destination, 2000, 1000);

    parsed.days = parsed.days.map((d, i) => ({
      ...d,
      // Una foto distinta por día mientras haya; cuando el pool se agota,
      // fallback etiquetado con el destino en vez de repetir la cabecera.
      image_url:
        i + 1 < photos.length
          ? sizeUnsplashUrl(photos[i + 1], 1400, 620)
          : destinationFallbackImage(trip.destination, 1400, 620, d.image_query || d.title),
    }));

    // Cruce con Google Places: comprueba de verdad que los sitios existen y
    // deja el resultado en cada actividad. Se salta solo si no hay ninguna key
    // de Google configurada, y nunca puede tumbar la generación — un itinerario
    // sin verificar sigue siendo un itinerario; uno que no llega, no.
    const verificationSummary = await verifyItineraryPlaces(
      parsed as unknown as ParsedItinerary,
      trip.destination,
      lang,
    );
    if (verificationSummary) {
      (parsed as unknown as ParsedItinerary).verification_summary = verificationSummary;
    }

    const { error: updateErr } = await supabase
      .from("trips")
      .update({ itinerary: parsed, hero_image_url: hero, status: "ready" })
      .eq("id", data.tripId);
    if (updateErr) throw updateErr;

    // Coordenadas para centrar el mapa. Solo si createTrip no las guardó ya
    // (el geocode del cliente no llegó a tiempo). Antes esto llamaba a
    // geocodeAndPersistTrip, que escribe con el cliente de navegador: en el
    // servidor ese cliente no tiene sesión, así que el UPDATE salía como rol
    // `anon` —sin permiso de escritura sobre trips— y fallaba siempre, con el
    // error tragado en un console.warn. Además iba en `void`, así que en
    // serverless la lambda podía congelarse antes de que resolviera.
    const tripGeo = trip as { geo_lat?: number | null; geo_lng?: number | null };
    if (tripGeo.geo_lat == null || tripGeo.geo_lng == null) {
      const coords = await Promise.race([
        geocodeDestination(trip.destination),
        new Promise<null>((r) => setTimeout(() => r(null), 4000)),
      ]);
      if (coords) {
        const { error: geoErr } = await supabase
          .from("trips")
          .update({ geo_lat: coords[0], geo_lng: coords[1] } as never)
          .eq("id", data.tripId);
        if (geoErr) console.warn("[itinerary] no se pudieron persistir las coordenadas", geoErr);
      }
    }

    return { itinerary: parsed, hero_image_url: hero };
  });
