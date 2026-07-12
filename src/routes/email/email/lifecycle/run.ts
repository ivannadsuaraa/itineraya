import { createFileRoute } from "@tanstack/react-router";
import {
  renderLifecycleEmail,
  type LifecycleEmailKey,
  type LifecycleEmailParams,
} from "@/lib/lifecycle-emails";

// Scheduler de la secuencia de retención (GROWTH_REPORT §6).
// Lo invoca un job de pg_cron (una vez al día) con el service role key como
// Bearer — mismo contrato que /email/email/queue/process. Idempotente: cada
// (user, email_key) se registra en lifecycle_email_log antes de encolar, con
// unique constraint, así que re-ejecutar nunca duplica envíos.
//
// Escala: usa auth.admin.listUsers con perPage 1000. Suficiente hasta ~1k
// usuarios activos; a partir de ahí, paginar o mover la selección a SQL.

const DAY = 86400000;

type UserLite = { id: string; email: string; createdAt: number };
type ProfileLite = {
  full_name: string | null;
  language: string | null;
  plan: string | null;
  trial_ends_at: string | null;
};
type TripLite = {
  id: string;
  user_id: string;
  destination: string;
  status: string;
  created_at: string;
  start_date: string | null;
  end_date: string | null;
};

function firstName(fullName: string | null | undefined, lang: string | null | undefined): string {
  const n = fullName?.trim().split(/\s+/)[0];
  if (n) return n;
  return (lang ?? "").toLowerCase().startsWith("es") ? "viajero" : "traveler";
}

function dateStr(msFromNow: number): string {
  return new Date(Date.now() + msFromNow).toISOString().slice(0, 10);
}

function readableDate(iso: string, lang: string | null | undefined): string {
  try {
    return new Date(iso).toLocaleDateString(
      (lang ?? "").toLowerCase().startsWith("es") ? "es-ES" : "en-US",
      { day: "numeric", month: "long" },
    );
  } catch {
    return iso;
  }
}

export const Route = createFileRoute("/email/email/lifecycle/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!serviceKey) {
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }
        if (authHeader.slice("Bearer ".length).trim() !== serviceKey) {
          return Response.json({ error: "Forbidden" }, { status: 403 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const siteUrl = process.env.SITE_URL || "https://www.itineraya.com";
        const from = process.env.RESEND_FROM || "Itineraya <noreply@itineraya.com>";
        const now = Date.now();

        // ── Usuarios + perfiles ──
        const { data: usersPage, error: usersErr } = await supabaseAdmin.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });
        if (usersErr) {
          console.error("[lifecycle] listUsers failed", usersErr);
          return Response.json({ error: "listUsers failed" }, { status: 500 });
        }
        const users: UserLite[] = (usersPage?.users ?? [])
          .filter((u) => u.email && u.created_at)
          .map((u) => ({
            id: u.id,
            email: u.email as string,
            createdAt: new Date(u.created_at).getTime(),
          }));
        const userById = new Map(users.map((u) => [u.id, u]));
        const userIds = users.map((u) => u.id);

        const profileById = new Map<string, ProfileLite>();
        if (userIds.length) {
          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, full_name, language, plan, trial_ends_at")
            .in("id", userIds);
          for (const p of profiles ?? []) {
            profileById.set(p.id, {
              full_name: p.full_name,
              language: p.language,
              plan: p.plan,
              trial_ends_at: p.trial_ends_at,
            });
          }
        }

        // ── Supresiones ──
        const suppressed = new Set<string>();
        if (users.length) {
          const { data: sup } = await supabaseAdmin
            .from("suppressed_emails")
            .select("email")
            .in(
              "email",
              users.map((u) => u.email.toLowerCase()),
            );
          for (const s of sup ?? []) suppressed.add(s.email.toLowerCase());
        }

        // ── Viajes (una sola query para todos los segmentos por usuario) ──
        const tripsByUser = new Map<string, TripLite[]>();
        if (userIds.length) {
          const { data: trips } = await supabaseAdmin
            .from("trips")
            .select("id, user_id, destination, status, created_at, start_date, end_date")
            .in("user_id", userIds)
            .order("created_at", { ascending: false });
          for (const t of (trips ?? []) as TripLite[]) {
            const arr = tripsByUser.get(t.user_id) ?? [];
            arr.push(t);
            tripsByUser.set(t.user_id, arr);
          }
        }
        const latestReadyTrip = (uid: string): TripLite | undefined =>
          (tripsByUser.get(uid) ?? []).find((t) => t.status === "ready");

        // ── Cola de envíos a materializar ──
        type Send = {
          userId: string;
          email: string;
          logKey: string;
          templateKey: LifecycleEmailKey;
          lang: string | null;
          params: LifecycleEmailParams;
        };
        const sends: Send[] = [];
        const pushSend = (
          user: UserLite,
          logKey: string,
          templateKey: LifecycleEmailKey,
          extra: Partial<LifecycleEmailParams> = {},
        ) => {
          if (suppressed.has(user.email.toLowerCase())) return;
          const profile = profileById.get(user.id);
          sends.push({
            userId: user.id,
            email: user.email,
            logKey,
            templateKey,
            lang: profile?.language ?? null,
            params: {
              name: firstName(profile?.full_name, profile?.language),
              siteUrl,
              ...extra,
            },
          });
        };

        for (const user of users) {
          const profile = profileById.get(user.id);
          const age = now - user.createdAt;
          const ready = latestReadyTrip(user.id);
          const allTrips = tripsByUser.get(user.id) ?? [];

          // E1 — bienvenida (primeras 72 h)
          if (age < 3 * DAY) pushSend(user, "welcome", "welcome");

          // E2 — activación (24-72 h sin ningún itinerario generado)
          if (age >= DAY && age < 3 * DAY && !ready) {
            pushSend(user, "activation_nudge", "activation_nudge");
          }

          // E3 — día 3 (generó: enseñar la edición)
          if (age >= 3 * DAY && age < 5 * DAY && ready) {
            pushSend(user, "day3_edit", "day3_edit", {
              destination: ready.destination,
              tripUrl: `${siteUrl}/my-trip/${ready.id}`,
            });
          }

          // E4a — trial expira mañana (ventana (now, now+1d]): el email de
          // conversión llega cuando el usuario aún tiene acceso a lo que va a
          // perder — el momento de máxima motivación para pagar.
          const trialEnds = profile?.trial_ends_at
            ? new Date(profile.trial_ends_at).getTime()
            : null;
          const isFreePlan = (profile?.plan ?? "free") === "free";
          if (trialEnds !== null && trialEnds > now && trialEnds <= now + DAY && isFreePlan) {
            pushSend(user, "trial_expiring", "trial_expiring");
          }

          // E4b — fin de trial (ventana (now-1d, now]): el "qué pasa ahora",
          // ya sin solapar con E4a.
          if (trialEnds !== null && trialEnds > now - DAY && trialEnds <= now && isFreePlan) {
            pushSend(user, "trial_end", "trial_end");
          }

          // E5 — día 30
          if (age >= 30 * DAY && age < 33 * DAY) pushSend(user, "day30_habit", "day30_habit");

          // E6 — reactivación 60 días (tiene viajes, pero ninguno reciente)
          if (age >= 60 * DAY && allTrips.length > 0) {
            const lastTripAt = new Date(allTrips[0].created_at).getTime();
            if (now - lastTripAt >= 60 * DAY) {
              pushSend(user, "reactivation_60", "reactivation_60", {
                destination: allTrips[0].destination,
                tripUrl: `${siteUrl}/my-trip/${allTrips[0].id}`,
              });
            }
          }
        }

        // E7 / E8 — por viaje (pre-viaje a 7 días, post-viaje a 2 días)
        const preDate = dateStr(7 * DAY);
        const postDate = dateStr(-2 * DAY);
        const { data: dateTrips } = await supabaseAdmin
          .from("trips")
          .select("id, user_id, destination, status, created_at, start_date, end_date")
          .eq("status", "ready")
          .or(`start_date.eq.${preDate},end_date.eq.${postDate}`);
        for (const t of (dateTrips ?? []) as TripLite[]) {
          let user = userById.get(t.user_id);
          if (!user) {
            const { data: fetched } = await supabaseAdmin.auth.admin.getUserById(t.user_id);
            if (!fetched?.user?.email) continue;
            user = {
              id: fetched.user.id,
              email: fetched.user.email,
              createdAt: new Date(fetched.user.created_at).getTime(),
            };
            if (!profileById.has(user.id)) {
              const { data: p } = await supabaseAdmin
                .from("profiles")
                .select("id, full_name, language, plan, trial_ends_at")
                .eq("id", user.id)
                .maybeSingle();
              if (p) profileById.set(p.id, p);
            }
          }
          const lang = profileById.get(t.user_id)?.language;
          if (t.start_date === preDate) {
            pushSend(user, `pretrip_${t.id}`, "pretrip", {
              destination: t.destination,
              tripUrl: `${siteUrl}/my-trip/${t.id}`,
              startDate: readableDate(t.start_date, lang),
            });
          }
          if (t.end_date === postDate) {
            pushSend(user, `posttrip_${t.id}`, "posttrip", {
              destination: t.destination,
              tripUrl: `${siteUrl}/my-trip/${t.id}`,
            });
          }
        }

        // ── Registrar + encolar (el unique constraint hace de candado) ──
        let enqueued = 0;
        const byKey: Record<string, number> = {};
        for (const s of sends) {
          const { data: inserted, error: logErr } = await supabaseAdmin
            .from("lifecycle_email_log")
            .upsert(
              { user_id: s.userId, email_key: s.logKey },
              { onConflict: "user_id,email_key", ignoreDuplicates: true },
            )
            .select("id");
          if (logErr) {
            console.error("[lifecycle] log insert failed", { key: s.logKey, error: logErr });
            continue;
          }
          if (!inserted || inserted.length === 0) continue; // ya enviado

          const rendered = renderLifecycleEmail(s.templateKey, s.lang, s.params);
          const { error: qErr } = await supabaseAdmin.rpc("enqueue_email", {
            queue_name: "transactional_emails",
            payload: {
              from,
              to: s.email,
              subject: rendered.subject,
              html: rendered.html,
              text: rendered.text,
              message_id: `lifecycle:${s.logKey}:${s.userId}`,
              label: `lifecycle_${s.templateKey}`,
              queued_at: new Date().toISOString(),
            },
          });
          if (qErr) {
            // Liberar el candado para reintentar en la próxima ejecución.
            console.error("[lifecycle] enqueue failed", { key: s.logKey, error: qErr });
            await supabaseAdmin
              .from("lifecycle_email_log")
              .delete()
              .eq("user_id", s.userId)
              .eq("email_key", s.logKey);
            continue;
          }
          enqueued++;
          byKey[s.templateKey] = (byKey[s.templateKey] ?? 0) + 1;
        }

        return Response.json({ candidates: sends.length, enqueued, byKey });
      },
    },
  },
});
