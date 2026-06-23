import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({ query: z.string().min(1).max(200) });

export const geocodePlace = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gmapsKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!lovableKey || !gmapsKey) {
      throw new Error("Google Maps connector not configured");
    }
    const url = `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(data.query)}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": gmapsKey,
      },
    });
    if (!res.ok) throw new Error(`Geocode failed: ${res.status}`);
    const json = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      }>;
    };
    const r = json.results?.[0];
    const lat = r?.geometry?.location?.lat;
    const lng = r?.geometry?.location?.lng;
    if (typeof lat !== "number" || typeof lng !== "number") {
      return { lat: null, lng: null, address: null };
    }
    return { lat, lng, address: r?.formatted_address ?? null };
  });
