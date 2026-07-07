import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { renderReferralCompleteEmail, renderReferralProgressEmail } from "@/lib/referral-emails";

const REFERRAL_GOAL = 3;

function firstName(name: string | null | undefined, emailFallback: string | null | undefined): string {
  const n = name?.trim().split(/\s+/)[0];
  if (n) return n;
  const local = emailFallback?.split("@")[0]?.replace(/[._-]+/g, " ").split(" ")[0];
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : "un amigo";
}

export const attributeAcquisition = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { referredBy?: string | null; utmSource?: string | null }) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    // attribute_acquisition is SECURITY DEFINER and validates self-referral /
    // write-once itself, and also credits the referrer's referral_count and
    // grants the 3-referral reward — see
    // supabase/migrations/20260707130000_trip_pass_and_referral_rewards.sql.
    const { data: rows, error } = await supabase.rpc(
      "attribute_acquisition" as never,
      { p_referred_by: data.referredBy ?? null, p_utm_source: data.utmSource ?? null } as never,
    );
    if (error) throw new Error(error.message);

    const result = (rows as unknown as Array<{
      referrer_id: string | null;
      referrer_referral_count: number | null;
      milestone_reached: boolean;
    }> | null)?.[0];

    // Best-effort notification to the referrer — a failure here must never
    // block the new user's signup flow.
    if (result?.referrer_id) {
      try {
        await notifyReferrer({
          referrerId: result.referrer_id,
          newCount: result.referrer_referral_count ?? 0,
          milestoneReached: result.milestone_reached,
          referredUserId: userId,
          referredEmail: (claims as { email?: string } | null)?.email ?? null,
        });
      } catch (e) {
        console.error("[referral] notifyReferrer failed", e);
      }
    }

    return { ok: true };
  });

async function notifyReferrer(opts: {
  referrerId: string;
  newCount: number;
  milestoneReached: boolean;
  referredUserId: string;
  referredEmail: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const siteUrl = process.env.SITE_URL || "https://www.itineraya.com";
  const from = process.env.RESEND_FROM || "Itineraya <noreply@itineraya.com>";

  const [{ data: referrerProfile }, { data: referredProfile }, referrerUser] = await Promise.all([
    supabaseAdmin.from("profiles").select("language").eq("id", opts.referrerId).maybeSingle(),
    supabaseAdmin.from("profiles").select("full_name").eq("id", opts.referredUserId).maybeSingle(),
    supabaseAdmin.auth.admin.getUserById(opts.referrerId),
  ]);

  const referrerEmail = referrerUser.data.user?.email;
  if (!referrerEmail) return;

  const { data: suppressed } = await supabaseAdmin
    .from("suppressed_emails")
    .select("email")
    .eq("email", referrerEmail.toLowerCase())
    .maybeSingle();
  if (suppressed) return;

  const lang = referrerProfile?.language ?? null;
  const friendName = firstName(
    (referredProfile as { full_name?: string | null } | null)?.full_name,
    opts.referredEmail,
  );

  const rendered = opts.milestoneReached
    ? renderReferralCompleteEmail(lang, { siteUrl })
    : renderReferralProgressEmail(lang, {
        friendName,
        remaining: Math.max(0, REFERRAL_GOAL - opts.newCount),
        siteUrl,
      });

  const label = opts.milestoneReached ? "referral_complete" : "referral_progress";
  const { error: qErr } = await supabaseAdmin.rpc("enqueue_email", {
    queue_name: "transactional_emails",
    payload: {
      from,
      to: referrerEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      message_id: `${label}:${opts.referrerId}:${opts.referredUserId}`,
      label,
      queued_at: new Date().toISOString(),
    },
  });
  if (qErr) console.error("[referral] enqueue failed", qErr);
}
