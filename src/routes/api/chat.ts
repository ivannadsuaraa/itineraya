import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createAnthropic } from "@ai-sdk/anthropic";

type ChatRequestBody = {
  messages?: unknown;
  mode?: "planning" | "in-trip" | null;
  clientNow?: string | null;
  tripContext?: {
    destination?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    budget?: string | null;
    companion?: string | null;
    tripStyle?: string | null;
  } | null;
};

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
        const { messages, tripContext, mode, clientNow } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        if (messages.length > 60) {
          return new Response("Conversation too long", { status: 400 });
        }

        // Enforce per-day message limit for the free plan.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: profileRow } = await supabaseAdmin
          .from("profiles")
          .select("plan")
          .eq("id", userId)
          .maybeSingle();
        const plan = ((profileRow?.plan as string | undefined) ?? "free") as
          | "free"
          | "viajero"
          | "explorador";
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
        }

        const key = process.env.ANTHROPIC_API_KEY;
        if (!key) return new Response("Missing ANTHROPIC_API_KEY", { status: 500 });

        const ctx = tripContext ?? {};
        const contextLines = [
          ctx.destination ? `Destino: ${ctx.destination}` : null,
          ctx.startDate && ctx.endDate ? `Fechas: del ${ctx.startDate} al ${ctx.endDate}` : null,
          ctx.budget ? `Presupuesto: ${ctx.budget}` : null,
          ctx.companion ? `Compañía: ${ctx.companion}` : null,
          ctx.tripStyle ? `Estilo de viaje: ${ctx.tripStyle}` : null,
        ].filter(Boolean).join("\n");

        const nowIso = clientNow || new Date().toISOString();
        const nowReadable = (() => {
          try {
            return new Date(nowIso).toLocaleString("es-ES", {
              weekday: "long", hour: "2-digit", minute: "2-digit",
              day: "2-digit", month: "long",
            });
          } catch { return nowIso; }
        })();

        const system = mode === "in-trip"
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

