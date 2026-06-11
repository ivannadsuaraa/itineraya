import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type ChatRequestBody = {
  messages?: unknown;
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
        const { messages, tripContext } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const ctx = tripContext ?? {};
        const contextLines = [
          ctx.destination ? `Destino: ${ctx.destination}` : null,
          ctx.startDate && ctx.endDate ? `Fechas: del ${ctx.startDate} al ${ctx.endDate}` : null,
          ctx.budget ? `Presupuesto: ${ctx.budget}` : null,
          ctx.companion ? `Compañía: ${ctx.companion}` : null,
          ctx.tripStyle ? `Estilo de viaje: ${ctx.tripStyle}` : null,
        ].filter(Boolean).join("\n");

        const system = `Eres el asistente de viaje de Itineraya. Responde en español, con un tono cercano y entusiasta, y ofrece recomendaciones prácticas y concretas (lugares, comidas, transporte, consejos locales). Mantén respuestas claras y útiles, usando markdown cuando ayude.

Contexto del viaje del usuario:
${contextLines || "Sin viaje seleccionado todavía."}`;

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
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
