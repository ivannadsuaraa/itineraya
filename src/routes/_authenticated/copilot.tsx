import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { motion } from "framer-motion";
import { ArrowLeft, Compass, Loader2, Navigation, Plane, Send, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/_authenticated/copilot")({
  head: () => ({ meta: [{ title: "Travel copilot – Itineraya" }] }),
  component: CopilotPage,
});

function CopilotPage() {
  const { t } = useTranslation();
  const [destination, setDestination] = useState("");
  const [started, setStarted] = useState(false);

  if (!started) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
            style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
          />
        </div>
        <div className="relative mx-auto flex min-h-screen max-w-xl flex-col px-4 py-6 sm:px-6 sm:py-10">
          <div className="mb-4 self-start">
            <Link
              to="/new-trip"
              className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("onboarding.back")}
            </Link>
          </div>
          <div className="mb-6 flex items-center justify-center">
            <BrandLogo size="md" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white/80 p-6 shadow-xl ring-1 ring-white/60 backdrop-blur-xl sm:p-8"
          >
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-md shadow-[#1E6B9A]/30">
              <Navigation className="h-6 w-6" />
            </div>
            <h1 className="font-display text-2xl font-bold text-sky-900 md:text-3xl">
              {t("copilot.title")}
            </h1>
            <p className="mt-2 text-sm text-sky-600">{t("copilot.subtitle")}</p>
            <label className="mt-6 block text-xs font-semibold uppercase tracking-wide text-sky-700">
              {t("copilot.destLabel")}
            </label>
            <input
              autoFocus
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && destination.trim().length > 1 && setStarted(true)}
              placeholder={t("copilot.destPh")}
              className="mt-2 w-full rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-lg text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
            />
            <button
              onClick={() => setStarted(true)}
              disabled={destination.trim().length < 2}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:shadow-xl disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              {t("copilot.start")}
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return <CopilotChat destination={destination.trim()} />;
}

function CopilotChat({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          tripContext: { destination },
          mode: "in-trip" as const,
          clientNow: new Date().toISOString(),
        }),
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [destination],
  );

  const greeting: UIMessage = useMemo(
    () => ({
      id: "greeting",
      role: "assistant",
      parts: [{ type: "text", text: t("copilot.greeting", { destination }) }],
    }),
    [destination, t],
  );

  const { messages, sendMessage, status } = useChat({
    id: `copilot-${destination}`,
    messages: [greeting],
    transport,
    onError: (err) => toast.error(err.message || t("assistant.error")),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-3 py-2 sm:px-5 sm:py-3">
          <Link
            to="/new-trip"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-sky-800 hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white shadow-md shadow-[#1E6B9A]/30">
            <Navigation className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-bold text-sky-900 sm:text-base">
              {t("copilot.headerTitle")}
            </h1>
            <p className="truncate text-[11px] text-sky-600 sm:text-xs">{destination}</p>
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="relative z-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map((m) => {
            const isUser = m.role === "user";
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return (
              <div key={m.id} className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
                    isUser ? "bg-sky-100 text-sky-700" : "bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white"
                  }`}
                >
                  {isUser ? <Plane className="h-4 w-4 -rotate-45" /> : <Compass className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? "rounded-tr-sm bg-[#1E6B9A] text-white"
                      : "rounded-tl-sm bg-white/85 text-sky-900 ring-1 ring-white/60"
                  }`}
                >
                  {text || <span className="opacity-60">…</span>}
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-sky-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("copilot.thinking")}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 border-t border-white/40 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e as unknown as React.FormEvent);
              }
            }}
            placeholder={t("copilot.inputPh")}
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-[#1E6B9A]/10"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E6B9A] text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E] disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
