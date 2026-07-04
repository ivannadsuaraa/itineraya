import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const attributeAcquisition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { referredBy?: string | null; utmSource?: string | null }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    // attribute_acquisition is SECURITY DEFINER and validates self-referral /
    // write-once itself — see supabase/migrations/20260704120000_referral_attribution.sql.
    const { error } = await supabase.rpc(
      "attribute_acquisition" as never,
      { p_referred_by: data.referredBy ?? null, p_utm_source: data.utmSource ?? null } as never,
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });
