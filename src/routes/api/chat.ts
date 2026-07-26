import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createAnthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

// `messages` no se valida en profundidad contra el esquema UIMessage del AI
// SDK (parts anidadas, tipos por proveedor) — acoplarse a esa forma exacta
// es frágil frente a actualizaciones de la librería. Se valida su forma
// mínima (array, tope de longitud) y se deja que convertToModelMessages
// rechace cualquier mensaje mal formado. Los campos de tripContext sí son
// texto libre del propio dominio de la app, interpolado tal cual en el
// prompt — esos si se acotan.
const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()).max(60),
  mode: z.enum(["planning", "in-trip"]).nullable().optional(),
  clientNow: z.string().max(50).nullable().optional(),
  tripContext: z
    .object({
      destination: z.string().max(200).nullable().optional(),
      startDate: z.string().max(20).nullable().optional(),
      endDate: z.string().max(20).nullable().optional(),
      budget: z.string().max(60).nullable().optional(),
      companion: z.string().max(60).nullable().optional(),
      tripStyle: z.string().max(400).nullable().optional(),
      itineraryOutline: z.string().max(20000).nullable().optional(),
    })
    .nullable()
    .optional(),
});

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const token = authHeader.slice("Bearer ".length).trim();
        if (!token) return new Response("Unauthorized", { status: 401 });

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
        });
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }
        const userId = claimsData.claims.sub as string;

        // Parse and validate the body BEFORE consuming quota, so malformed
        // requests don't burn a free-plan message.
        let messages: unknown[], tripContext, mode, clientNow;
        try {
          const raw: unknown = await request.json();
          ({ messages, tripContext, mode, clientNow } = ChatRequestSchema.parse(raw));
        } catch {
          return new Response("Invalid request body", { status: 400 });
        }

        // Enforce per-day message limit for the free plan.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profileRow } = await supabaseAdmin
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        const plan = ((profileRow?.plan as string | undefined) ?? "free") as
          "free" | "viajero" | "explorador";
        const FREE_DAILY_LIMIT = 10;
        const today = new Date().toISOString().slice(0, 10);
        if (plan === "free") {
          const { data: usageRow } = await supabaseAdmin
            .from("chat_usage")
            .select("message_count")
            .eq("user_id", userId)
            .eq("usage_date", today)
            .maybeSingle();
          const used = usageRow?.message_count ?? 0;
          if (used >= FREE_DAILY_LIMIT) {
            return new Response(
              `LIMIT_REACHED: Has alcanzado el límite diario de ${FREE_DAILY_LIMIT} mensajes del plan gratuito. Actualiza a Viajero o Explorador para mensajes ilimitados.`,
              { status: 429 },
            );
          }
          await supabaseAdmin
            .from("chat_usage")
            .upsert(
              { user_id: userId, usage_date: today, message_count: used + 1 },
              { onConflict: "user_id,usage_date" },
            );
        } else {
          // Viajero/Explorador have no product-facing daily cap ("mensajes
          // ilimitados" is the sales pitch), but "unlimited" must not mean
          // "uncapped Anthropic spend on a single compromised paid account".
          // Generous ceiling that no real conversational usage approaches.
          const PAID_DAILY_SAFETY_LIMIT = 300;
          const { data: allowed, error: rlErr } = await supabaseAdmin.rpc(
            "check_and_increment_rate_limit" as never,
            {
              p_scope: "chat_message_user",
              p_key: userId,
              p_limit: PAID_DAILY_SAFETY_LIMIT,
            } as never,
          );
          if (rlErr) {
            console.error("[chat] rate limit check failed", rlErr);
            return new Response("No se pudo procesar la solicitud. Inténtalo de nuevo.", {
              status: 500,
            });
          }
          if (!allowed) {
            return new Response(
              `LIMIT_REACHED: Has alcanzado el límite de ${PAID_DAILY_SAFETY_LIMIT} mensajes diarios. Inténtalo mañana.`,
              { status: 429 },
            );
          }
        }

        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

        const ctx = tripContext ?? {};
        const outline =
          typeof ctx.itineraryOutline === "string" && ctx.itineraryOutline.trim()
            ? ctx.itineraryOutline.slice(0, 4000)
            : null;
        const contextLines = [
          ctx.destination ? `Destino: ${ctx.destination}` : null,
          ctx.startDate && ctx.endDate ? `Fechas: del ${ctx.startDate} al ${ctx.endDate}` : null,
          ctx.budget ? `Presupuesto: ${ctx.budget}` : null,
          ctx.companion ? `Compañía: ${ctx.companion}` : null,
          ctx.tripStyle ? `Estilo de viaje: ${ctx.tripStyle}` : null,
          outline
            ? `Itinerario actual del usuario (referénciate a él al responder — días, horas y sitios reales):\n${outline}`
            : null,
        ]
          .filter(Boolean)
          .join("\n");

        const nowIso = clientNow || new Date().toISOString();
        const nowReadable = (() => {
          try {
            return new Date(nowIso).toLocaleString("es-ES", {
              weekday: "long",
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "long",
            });
          } catch {
            return nowIso;
          }
        })();

        const system =
          mode === "in-trip"
            ? `Eres el COPILOTO DE VIAJE en tiempo real de Itineraya. El usuario YA ESTÁ en ${ctx.destination ?? "su destino"} ahora mismo.

Hora local actual (aprox): ${nowReadable}.

Tu misión: ayudarle EN VIVO durante el viaje. NO generes itinerarios largos de varios días. En su lugar:
- Sugiere QUÉ HACER AHORA o en las próximas horas según la hora del día (mañana / mediodía / tarde / noche).
- Recomienda actividades, restaurantes o sitios CERCANOS y abiertos a esta hora.
- Da opciones de TRANSPORTE realistas (caminar, metro, bus, taxi, ferry) con tiempos estimados.
- Adapta los planes si llueve, si está cansado, si quiere algo rápido, etc.
- Sé conciso, práctico y específico (nombres reales, barrios reales). Usa markdown con listas cuando ayude.
- Si pide un plan, hazlo solo para lo que queda del día u hoy + mañana como máximo.

Responde en el idioma del usuario (por defecto español).`
            : `Eres el asistente de viaje de Itineraya. Responde en español, con un tono cercano y entusiasta, y ofrece recomendaciones prácticas y concretas (lugares, comidas, transporte, consejos locales). Mantén respuestas claras y útiles, usando markdown cuando ayude.

Contexto del viaje del usuario:
${contextLines || "Sin viaje seleccionado todavía."}`;

        const anthropic = createAnthropic({ apiKey: key });
        const result = streamText({
          model: anthropic("claude-haiku-4-5"),
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
