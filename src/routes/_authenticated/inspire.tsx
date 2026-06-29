import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { ArrowLeft, ArrowRight, Loader2, Sparkles, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import {
  INSPIRE_QUESTIONS,
  type InspireAnswers,
  type InspireQuestion,
} from "@/lib/inspire/questions";
import { suggestDestinations, type SuggestedDestination } from "@/lib/inspire.functions";

export const Route = createFileRoute("/_authenticated/inspire")({
  head: () => ({ meta: [{ title: "Ayúdame a elegir destino – Itineraya" }] }),
  component: InspirePage,
});

const emptyAnswers: InspireAnswers = {
  tripType: [],
  region: "",
  budget: "",
  origin: "",
  duration: "",
};

function InspirePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<InspireAnswers>(emptyAnswers);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SuggestedDestination[] | null>(null);

  const total = INSPIRE_QUESTIONS.length;
  const current = INSPIRE_QUESTIONS[step];

  const canAdvance = (): boolean => {
    const v = answers[current.id as keyof InspireAnswers];
    if (current.type === "visual-multi") return Array.isArray(v) && v.length > 0;
    if (current.type === "text") return typeof v === "string" && v.trim().length > 1;
    return typeof v === "string" && v.length > 0;
  };

  const next = () => {
    if (!canAdvance()) return;
    setDirection(1);
    if (step < total - 1) setStep(step + 1);
    else void runSuggest();
  };
  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const runSuggest = async () => {
    setLoading(true);
    try {
      const { destinations } = await suggestDestinations({ data: answers });
      setResults(destinations);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("inspire.error"));
    } finally {
      setLoading(false);
    }
  };

  const chooseDestination = (d: SuggestedDestination) => {
    const budgetMap: Record<string, string> = {
      low: "economico",
      mid: "medio",
      high: "sin-limite",
    };
    const tripStyle = answers.tripType
      .map((id) => t(`inspire.tripType.${id}`))
      .join(", ");

    const prefill = {
      destination: `${d.name}, ${d.country}`,
      budget: budgetMap[answers.budget] ?? "",
      tripType: tripStyle,
      duration: answers.duration,
    };
    const encoded =
      typeof window === "undefined"
        ? Buffer.from(JSON.stringify(prefill)).toString("base64")
        : btoa(unescape(encodeURIComponent(JSON.stringify(prefill))));
    navigate({ to: "/onboarding", search: { prefill: encoded } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#D6EAF8] via-white to-[#B8D4E8]">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-32 -left-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #B8D4E8, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full opacity-50 blur-3xl"
          style={{ background: "radial-gradient(circle, #D6EAF8, transparent 70%)" }}
        />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 self-start">
          <button
            type="button"
            onClick={() => (results ? setResults(null) : navigate({ to: "/new-trip" }))}
            className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-sky-800 backdrop-blur-md transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("inspire.back")}
          </button>
        </div>

        <div className="mb-6 flex items-center justify-center">
          <BrandLogo size="md" />
        </div>

        {!results && !loading && (
          <>
            <div className="mb-8">
              <div className="mb-3 flex items-center justify-between text-xs font-semibold text-sky-700">
                <span>{t("inspire.stepIndicator", { n: step + 1, total })}</span>
                <span>{Math.round(((step + 1) / total) * 100)}%</span>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100">
                    <div
                      
                      
                      
                      className="h-full rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex-1">
              
                <div
                  key={current.id}
                  
                  
                  
                  
                  
                  className="rounded-3xl bg-white/80 p-5 shadow-[0_20px_60px_-15px_rgba(46,107,138,0.25)] backdrop-blur-xl ring-1 ring-white/60 sm:p-8"
                >
                  <QuestionView
                    q={current}
                    value={answers[current.id as keyof InspireAnswers]}
                    onChange={(v) => setAnswers({ ...answers, [current.id]: v } as InspireAnswers)}
                  />
                </div>
              
            </div>

            <div className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="inline-flex items-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-sky-800 shadow-sm backdrop-blur-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("inspire.back")}
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!canAdvance()}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-40"
              >
                {step === total - 1 ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t("inspire.findDestinations")}
                  </>
                ) : (
                  <>
                    {t("inspire.next")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-[#1E6B9A]" />
            <h2 className="font-display text-2xl font-bold text-sky-900">{t("inspire.loading")}</h2>
            <p className="text-sm text-sky-600">{t("inspire.loadingDesc")}</p>
          </div>
        )}

        {!loading && results && (
          <div className="space-y-5">
            <div className="text-center">
              <h2 className="font-display text-2xl font-bold text-sky-900 md:text-3xl">
                {t("inspire.resultsTitle")}
              </h2>
              <p className="mt-1 text-sm text-sky-600">{t("inspire.resultsDesc")}</p>
            </div>
            {results.map((d, i) => (
              <DestinationCard key={`${d.name}-${i}`} d={d} rank={i} onChoose={() => chooseDestination(d)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuestionView({
  q,
  value,
  onChange,
}: {
  q: InspireQuestion;
  value: string | string[];
  onChange: (v: string | string[]) => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="mb-1 text-3xl">{q.emoji}</div>
      <h1 className="font-display text-2xl font-bold text-sky-900 md:text-3xl">{t(q.titleKey)}</h1>
      <p className="mt-1 text-sm text-sky-600 md:text-base">{t(q.subtitleKey)}</p>

      <div className="mt-6">
        {q.type === "visual-multi" && q.options && (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            {q.options.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    const next = selected ? arr.filter((x) => x !== opt.id) : [...arr, opt.id];
                    onChange(next);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 text-center transition-all",
                    selected
                      ? "border-[#1E6B9A] bg-white shadow-lg shadow-[#1E6B9A]/15"
                      : "border-sky-100 bg-white/70 hover:border-sky-300 hover:bg-white",
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-xs font-semibold text-sky-900 sm:text-sm">
                    {t(opt.labelKey)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === "single" && q.options && (
          <div className="grid gap-3 sm:grid-cols-3">
            {q.options.map((opt) => {
              const selected = value === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChange(opt.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border-2 px-4 py-5 text-center transition-all",
                    selected
                      ? "border-[#1E6B9A] bg-white shadow-lg shadow-[#1E6B9A]/15"
                      : "border-sky-100 bg-white/70 hover:border-sky-300 hover:bg-white",
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <span className="text-sm font-semibold text-sky-900">{t(opt.labelKey)}</span>
                </button>
              );
            })}
          </div>
        )}

        {q.type === "text" && (
          <input
            autoFocus
            type="text"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={q.placeholderKey ? t(q.placeholderKey) : ""}
            className="w-full rounded-2xl border border-sky-200 bg-white/70 px-5 py-4 text-lg text-sky-900 placeholder-sky-400 outline-none transition-all focus:border-[#1E6B9A] focus:bg-white focus:ring-4 focus:ring-[#1E6B9A]/10"
          />
        )}
      </div>
    </div>
  );
}

function DestinationCard({
  d,
  rank,
  onChoose,
}: {
  d: SuggestedDestination;
  rank: number;
  onChoose: () => void;
}) {
  const { t } = useTranslation();
  const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : "🥉";
  return (
    <div
      
      
      
      className="overflow-hidden rounded-3xl bg-white/85 shadow-xl ring-1 ring-white/60 backdrop-blur-xl"
    >
      <div className="relative h-40 sm:h-48">
        <img src={d.imageUrl} alt={d.name} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-sky-800 backdrop-blur-sm">
          <Trophy className="h-3 w-3" /> {d.score}/100
        </div>
        <div className="absolute bottom-3 left-4 right-4 text-white">
          <div className="text-2xl">{medal}</div>
          <div className="font-display text-2xl font-bold drop-shadow">
            {d.name}
          </div>
          <div className="text-sm opacity-90">{d.country}</div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-sm leading-relaxed text-sky-800">{d.reason}</p>
        <button
          type="button"
          onClick={onChoose}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1E6B9A] to-[#3B92C2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#1E6B9A]/25 transition-all hover:shadow-xl"
        >
          <Sparkles className="h-4 w-4" />
          {t("inspire.createHere")}
        </button>
      </div>
    </div>
  );
}
