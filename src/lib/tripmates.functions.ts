import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InviteInput = z.object({
  tripId: z.string().uuid(),
  email: z.string().email().max(255),
});

const INVITES_PER_DAY = 20;

const INVITE_COPY = {
  es: {
    subject: (dest: string) => `Te han invitado a un viaje a ${dest} en Itineraya`,
    title: "¡Estás invitado! ✈️",
    body: (dest: string) =>
      `Un amigo te ha invitado a colaborar en un viaje a <strong>${dest}</strong> en Itineraya: podréis ver y comentar el itinerario juntos.`,
    cta: "Aceptar invitación",
    linkHint: "O copia este enlace:",
  },
  en: {
    subject: (dest: string) => `You're invited to ${dest} on Itineraya`,
    title: "You're invited! ✈️",
    body: (dest: string) =>
      `A friend invited you to collaborate on a trip to <strong>${dest}</strong> on Itineraya — you'll be able to view and comment on the itinerary together.`,
    cta: "Accept invitation",
    linkHint: "Or copy this link:",
  },
} as const;

export const inviteTripmate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // owner-check
    const { data: trip, error: tErr } = await supabase
      .from("trips")
      .select("id,destination,user_id")
      .eq("id", data.tripId)
      .maybeSingle();
    if (tErr || !trip) throw new Error("Trip not found");
    if (trip.user_id !== userId) throw new Error("Forbidden");

    // Anti-abuso: sin este tope, cualquier cuenta podía usar Resend como
    // cañón de spam con remitente de Itineraya.
    const since = new Date(Date.now() - 86400000).toISOString();
    const { count: sentToday } = await supabase
      .from("trip_invites")
      .select("id", { count: "exact", head: true })
      .eq("invited_by", userId)
      .gte("created_at", since);
    if ((sentToday ?? 0) >= INVITES_PER_DAY) {
      throw new Error(
        `Has alcanzado el límite de ${INVITES_PER_DAY} invitaciones diarias. Inténtalo mañana.`,
      );
    }

    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { error: iErr } = await supabase.from("trip_invites").insert({
      trip_id: data.tripId,
      email: data.email.toLowerCase(),
      token,
      invited_by: userId,
    });
    if (iErr) throw iErr;

    // Send email via Resend, in the inviter's language (es default, en otherwise).
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const SITE_URL = process.env.SITE_URL || "https://www.itineraya.com";
    const inviteUrl = `${SITE_URL}/invite/${token}`;
    if (RESEND_KEY) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", userId)
          .maybeSingle();
        const lang: keyof typeof INVITE_COPY = (profile?.language ?? "es")
          .toLowerCase()
          .startsWith("es")
          ? "es"
          : "en";
        const c = INVITE_COPY[lang];
        const dest = escapeHtml(trip.destination);
        const from = process.env.RESEND_FROM || "Itineraya <onboarding@resend.dev>";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from,
            to: [data.email],
            subject: c.subject(trip.destination),
            html: `<div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#f0f9ff;border-radius:16px">
              <h1 style="color:#0c4a6e;font-size:22px;margin:0 0 12px">${c.title}</h1>
              <p style="color:#0369a1;font-size:14px;line-height:1.6">${c.body(dest)}</p>
              <a href="${inviteUrl}" style="display:inline-block;background:#1E6B9A;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9999px;font-weight:700;margin-top:16px">${c.cta}</a>
              <p style="color:#64748b;font-size:12px;margin-top:24px">${c.linkHint} ${inviteUrl}</p>
            </div>`,
          }),
        });
      } catch {
        // email failure shouldn't block the invite record
      }
    }
    return { ok: true, token };
  });

const ListInput = z.object({ tripId: z.string().uuid() });
export const listTripmates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [{ data: invites }, { data: members }] = await Promise.all([
      supabase
        .from("trip_invites")
        .select("id,email,status,created_at,accepted_at")
        .eq("trip_id", data.tripId)
        .order("created_at", { ascending: false }),
      supabase.from("trip_members").select("id,user_id,role,created_at").eq("trip_id", data.tripId),
    ]);
    return { invites: invites ?? [], members: members ?? [] };
  });

const AcceptInput = z.object({ token: z.string().min(8).max(128) });
export const acceptInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AcceptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const email = (claims as { email?: string } | null)?.email?.toLowerCase();
    // Read invite via admin (anonymous email match is awkward via RLS for non-matching email)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite, error } = await supabaseAdmin
      .from("trip_invites")
      .select("id,trip_id,email,status,accepted_user_id")
      .eq("token", data.token)
      .maybeSingle();
    if (error || !invite) throw new Error("Invitation not found");
    // A token is single-use: once accepted it only remains valid for the same
    // account (idempotent re-accept), never for a different one.
    if (
      invite.status === "accepted" &&
      invite.accepted_user_id &&
      invite.accepted_user_id !== userId
    ) {
      throw new Error("This invitation has already been used");
    }
    // The invite is scoped to a specific email address ("Un amigo te ha
    // invitado a colaborar" — a specific friend, not whoever holds the
    // link). Without this check, anyone who obtains the token (a forwarded
    // email, a shared screenshot, browser history, a corporate link-scanner
    // that happens to be signed in) is silently added as a trip
    // collaborator by /invite/$token, which auto-accepts on page load with
    // no confirmation step. Reject a mismatched account instead of joining.
    if (email && invite.email.toLowerCase() !== email) {
      throw new Error(
        "This invitation was sent to a different email address. Sign in with that account to accept it.",
      );
    }
    await supabaseAdmin
      .from("trip_members")
      .upsert(
        { trip_id: invite.trip_id, user_id: userId, role: "collaborator" },
        { onConflict: "trip_id,user_id" },
      );
    if (invite.status !== "accepted") {
      await supabaseAdmin
        .from("trip_invites")
        .update({
          status: "accepted",
          accepted_user_id: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invite.id);
    }
    void supabase; // unused
    return { ok: true, tripId: invite.trip_id };
  });

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
