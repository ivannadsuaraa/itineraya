import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";

import { Compass, Plane, ArrowLeft, Send, Loader2, Sparkles, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({ meta: [{ title: "Asistente de viaje – Itineraya" }] }),
  component: AssistantPage,
});

type Trip = {
  id: string;
  destination: string;
  start_date: string | null;
  end_date: string | null;
  budget: string | null;
  companion: string | null;
  trip_style: string | null;
};

type Plan = "free" | "viajero" | "explorador";

function AssistantPage() {
  void 0;
  const [plan, setPlan] = useState<Plan | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [tripId, setTripId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: profile }, { data: tripRows }] = await Promise.all([
        supabase.from("profiles").select("plan").eq("id", u.user.id).maybeSingle(),
        supabase
          .from("trips")
          .select("id,destination,start_date,end_date,budget,companion,trip_style")
          .eq("user_id", u.user.id)
          .order("created_at", { ascending: false }),
      ]);
      setPlan(((profile as { plan?: Plan } | null)?.plan ?? "free") as Plan);
      const list = (tripRows ?? []) as Trip[];
      setTrips(list);
      if (list[0]) setTripId(list[0].id);
    })();
  }, []);

  const activeTrip = useMemo(() => trips?.find((t) => t.id === tripId) ?? null, [trips, tripId]);

  if (plan === null || trips === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1E6B9A]" />
      </div>
    );
  }

  if (plan === "free") {
    return <UpgradeGate onBack={() => window.history.back()} />;
  }

  return (
    <ChatSurface
      plan={plan}
      trips={trips}
      tripId={tripId}
      setTripId={setTripId}
      activeTrip={activeTrip}
    />
  );
}

function UpgradeGate({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
      </div>
      <div className="relative mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
        <button
          onClick={onBack}
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" /> {t("assistant.back")}
        </button>
        <div >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1E6B9A] shadow-lg shadow-[#1E6B9A]/30">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <h1 className="mt-6 font-display text-3xl font-bold text-sky-900">{t("assistant.upgradeTitle")}</h1>
          <p className="mt-3 text-sky-700">
            {t("assistant.upgradeBodyPre")}
            <span className="font-semibold">{t("assistant.upgradeBodyViajero")}</span>
            {t("assistant.upgradeBodyAnd")}
            <span className="font-semibold">{t("assistant.upgradeBodyExplorador")}</span>
            {t("assistant.upgradeBodyPost")}
          </p>
          <Link
            to="/pricing"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E6B9A] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:bg-[#15577E]"
          >
            <Sparkles className="h-4 w-4" /> {t("assistant.upgradeCta")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ChatSurface({
  plan,
  trips,
  tripId,
  setTripId,
  activeTrip,
}: {
  plan: Plan;
  trips: Trip[];
  tripId: string | null;
  setTripId: (id: string | null) => void;
  activeTrip: Trip | null;
}) {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Esquema compacto del itinerario del viaje activo: sin él, el asistente
  // respondía a ciegas sobre un plan que el usuario tiene delante.
  const [itineraryOutline, setItineraryOutline] = useState<string | null>(null);
  useEffect(() => {
    if (!tripId) {
      setItineraryOutline(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("trips")
        .select("itinerary")
        .eq("id", tripId)
        .maybeSingle();
      if (cancelled) return;
      const itin = data?.itinerary as {
        days?: Array<{
          day: number;
          title: string;
          activities?: Array<{ time: string; title: string; place?: string }>;
        }>;
      } | null;
      if (!itin?.days?.length) {
        setItineraryOutline(null);
        return;
      }
      const outline = itin.days
        .map((d) => {
          const stops = (d.activities ?? [])
            .slice(0, 6)
            .map((a) => `${a.time} ${a.place || a.title}`)
            .join(" · ");
          return `Día ${d.day} — ${d.title}: ${stops}`;
        })
        .join("\n")
        .slice(0, 3500);
      setItineraryOutline(outline);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const tripContext = useMemo(
    () =>
      activeTrip
        ? {
            destination: activeTrip.destination,
            startDate: activeTrip.start_date,
            endDate: activeTrip.end_date,
            budget: activeTrip.budget,
            companion: activeTrip.companion,
            tripStyle: activeTrip.trip_style,
            itineraryOutline,
          }
        : null,
    [activeTrip, itineraryOutline],
  );

  const greeting: UIMessage = useMemo(
    () => ({
      id: "greeting",
      role: "assistant",
      parts: [
        {
          type: "text",
          text: activeTrip
            ? t("assistant.greetingWithTrip", { destination: activeTrip.destination })
            : t("assistant.greetingNoTrip"),
        },
      ],
    }),
    [activeTrip, t],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({ tripContext }),
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [tripContext],
  );

  const { messages, sendMessage, status } = useChat({
    id: tripId ?? "no-trip",
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
    <div className="relative flex h-dvh flex-col overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -right-40 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
      </div>

      <header className="relative z-10 border-b border-white/40 bg-white/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 text-sky-800 hover:bg-white"
              aria-label={t("assistant.ariaBack")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] shadow-md shadow-[#1E6B9A]/30 sm:flex">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-display text-sm font-bold text-sky-900 sm:text-base">{t("assistant.headerTitle")}</h1>
              <p className="truncate text-[11px] text-sky-600 sm:text-xs">
                {activeTrip ? activeTrip.destination : t("assistant.noTripSelected")}
              </p>
            </div>
          </div>
          {trips.length > 0 && (
            <select
              value={tripId ?? ""}
              onChange={(e) => setTripId(e.target.value || null)}
              title={activeTrip?.destination}
              className="max-w-[160px] shrink-0 truncate rounded-full border border-sky-200 bg-white/80 px-2.5 py-1.5 text-[11px] font-semibold text-sky-800 outline-none focus:border-[#1E6B9A] sm:max-w-[240px] sm:px-3 sm:text-xs"
            >
              {trips.map((tr) => (
                <option key={tr.id} value={tr.id}>
                  {tr.destination}
                </option>
              ))}
            </select>
          )}
        </div>
      </header>

      <div ref={scrollRef} className="relative z-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-6">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {/* Chips de arranque: el lienzo en blanco es el mayor freno del chat */}
          {messages.length <= 1 && !isLoading && (
            <div className="mt-1 flex flex-wrap gap-2 pl-10">
              {(["sugg1", "sugg2", "sugg3", "sugg4"] as const).map((k) => {
                const text = t(`assistant.${k}`, {
                  destination: activeTrip?.destination ?? t("assistant.noTripSelected"),
                });
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => sendMessage({ text })}
                    className="rounded-full bg-white/85 px-3.5 py-2 text-xs font-semibold text-sky-800 ring-1 ring-sky-200 transition hover:bg-white hover:ring-sky-300 active:scale-95"
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-sky-600">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white">
                <Compass className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-2 shadow-sm">
                <span className="inline-flex gap-1">
                  <Dot /> <Dot delay={0.15} /> <Dot delay={0.3} />
                </span>
              </div>
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
            placeholder={
              activeTrip
                ? t("assistant.phWithTrip", { destination: activeTrip.destination })
                : t("assistant.phEmpty")
            }
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-base text-sky-900 placeholder-sky-400 outline-none focus:border-[#1E6B9A] focus:ring-4 focus:ring-[#1E6B9A]/10 sm:text-sm"
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

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");

  return (
    <div className={`flex items-start gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm ${
          isUser ? "bg-sky-100 text-sky-700" : "bg-gradient-to-br from-[#1E6B9A] to-[#3B92C2] text-white"
        }`}
      >
        {isUser ? <Plane className="h-4 w-4 -rotate-45" /> : <Compass className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
          isUser
            ? "bg-[#1E6B9A] text-white rounded-tr-sm"
            : "bg-white/85 text-sky-900 rounded-tl-sm ring-1 ring-white/60"
        }`}
      >
        {text || <span className="opacity-60">…</span>}
      </div>
    </div>
  );
}

function Dot({ delay = 0 }: { delay?: number }) {
  return (
    <span
      className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-bounce"
      style={{ animationDelay: `${delay}s` }}
    />
  );
}
