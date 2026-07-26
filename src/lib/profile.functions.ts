import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Mismos valores que los <select> de profile.tsx (TRAVEL_STYLES + las
// opciones hardcodeadas de budget/traveler). Antes esto era un UPDATE
// directo a Supabase desde el cliente sin validar — un enum fuera de este
// conjunto o un preferredDestinations gigantesco se guardaba tal cual, y
// travel_style/budget_range/traveler_type se interpolan sin más en el
// prompt de generateItinerary.
const Input = z.object({
  travelStyle: z
    .enum(["adventure", "relax", "cultural", "romantic", "family", "party", "nature"])
    .nullable(),
  budgetRange: z.enum(["low", "medium", "high", "luxury"]).nullable(),
  travelerType: z.enum(["solo", "couple", "family", "friends", "business"]).nullable(),
  preferredDestinations: z.array(z.string().trim().min(1).max(80)).max(20),
});

export const updateProfilePrefs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("profiles")
      .update({
        travel_style: data.travelStyle,
        budget_range: data.budgetRange,
        preferred_destinations: data.preferredDestinations,
        traveler_type: data.travelerType,
      } as never)
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
