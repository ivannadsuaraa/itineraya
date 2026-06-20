import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  tripType: z.array(z.string()).min(1),
  region: z.string().min(1),
  budget: z.string().min(1),
  origin: z.string().min(1),
  duration: z.string().min(1),
});

export type SuggestedDestination = {
  name: string;
  country: string;
  score: number;
  reason: string;
  photoQuery: string;
  imageUrl: string;
};

async function unsplashImage(query: string): Promise<string> {
  const key = process.env.UNSPLASH_KEY;
  if (!key) return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?per_page=1&orientation=landscape&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!res.ok) return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
    const data = (await res.json()) as { results?: Array<{ urls?: { regular?: string } }> };
    return (
      data.results?.[0]?.urls?.regular ??
      `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`
    );
  } catch {
    return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`;
  }
}

export const suggestDestinations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("Missing ANTHROPIC_API_KEY");

    const month = new Date().toLocaleString("en-US", { month: "long" });

    const regionConstraint =
      data.region === "spain"
        ? "ONLY destinations inside Spain (cities, regions, islands)."
        : data.region === "europe"
        ? "ONLY destinations inside Europe."
        : "Anywhere in the world.";

    const durationHint: Record<string, string> = {
      weekend: "2-3 days — short flight or train from origin",
      short: "3-5 days — medium-distance trip",
      week: "~7 days — medium/long trip",
      long: "10+ days — long-haul OK",
    };

    const budgetHint: Record<string, string> = {
      low: "low budget (backpacker, hostels, cheap food)",
      mid: "mid budget (3-4* hotel, mix of experiences)",
      high: "high budget (luxury, fine dining, premium activities)",
    };

    const prompt = `You are an expert travel inspiration engine. Recommend 3 REAL destinations matched to this traveler.

TRAVELER INPUT
- Trip vibe(s): ${data.tripType.join(", ")}
- Region constraint: ${regionConstraint}
- Budget: ${budgetHint[data.budget] ?? data.budget}
- Origin city: ${data.origin}
- Duration: ${durationHint[data.duration] ?? data.duration}
- Travel month (current): ${month}

REQUIREMENTS
- Realistic distance vs duration from origin "${data.origin}".
- Climate-appropriate for ${month} (no snowy mountains for beach vibe; no scorching desert for outdoor trips in midsummer).
- Match the budget tier.
- AVOID overused generic picks (Paris, Rome, Bali, New York) unless they truly are the best fit. Prefer interesting, less obvious options that match the vibe.
- All 3 destinations must be DIFFERENT countries when possible (unless region=spain).
- Score 0-100 = compatibility with the full input.
- Sort by score descending.

Return ONLY valid JSON with this exact shape:
{
  "destinations": [
    {
      "name": "City name",
      "country": "Country name",
      "score": 94,
      "reason": "1-2 sentences in Spanish explaining specifically why this fits the user (mention vibe + budget + season).",
      "photoQuery": "2-3 english words for an Unsplash photo, e.g. 'prague old town'"
    }
  ]
}`;

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 2048,
        system:
          "You are a travel inspiration engine. Return ONLY valid JSON without markdown, explanations or extra text.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) throw new Error("Demasiadas peticiones. Espera un momento.");
      throw new Error(`Error IA ${aiRes.status}`);
    }

    const aiJson = (await aiRes.json()) as {
      content?: Array<{ text?: string }>;
    };
    const content = aiJson.content?.[0]?.text ?? "";
    let parsed: { destinations: Omit<SuggestedDestination, "imageUrl">[] };
    try {
      parsed = JSON.parse(content);
    } catch {
      const cleaned = content.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleaned);
    }

    const list = (parsed.destinations ?? []).slice(0, 3);
    const withImages: SuggestedDestination[] = await Promise.all(
      list.map(async (d) => ({
        ...d,
        score: Math.max(0, Math.min(100, Math.round(d.score))),
        imageUrl: await unsplashImage(d.photoQuery || `${d.name} ${d.country}`),
      })),
    );

    withImages.sort((a, b) => b.score - a.score);
    return { destinations: withImages };
  });
