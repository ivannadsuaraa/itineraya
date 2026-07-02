import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export type BudgetTier =
  "backpacker" | "economy" | "comfort" | "premium" | "luxury" | "ultraLuxury";

export function budgetTier(min: number, max: number): BudgetTier {
  const mid = (min + max) / 2;
  if (mid < 300) return "backpacker";
  if (mid < 800) return "economy";
  if (mid < 2000) return "comfort";
  if (mid < 4000) return "premium";
  if (mid < 7000) return "luxury";
  return "ultraLuxury";
}

function fmt(n: number): string {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0 }).format(n);
}

export function BudgetRangeSlider({ min = 0, max = 10000, step = 50, value, onChange }: Props) {
  const { t } = useTranslation();
  const [lo, hi] = value;
  const tier = useMemo(() => budgetTier(lo, hi), [lo, hi]);

  const loPct = ((lo - min) / (max - min)) * 100;
  const hiPct = ((hi - min) / (max - min)) * 100;

  const setLo = (n: number) => {
    const clamped = Math.min(n, hi - step);
    onChange([Math.max(min, clamped), hi]);
  };
  const setHi = (n: number) => {
    const clamped = Math.max(n, lo + step);
    onChange([lo, Math.min(max, clamped)]);
  };

  return (
    <div>
      <div className="relative h-9">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-sky-200" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#1E6B9A]"
          style={{ left: `${loPct}%`, right: `${100 - hiPct}%` }}
        />
        <input
          type="range"
          aria-label={t("onboarding.budgetMinLabel", { defaultValue: "Presupuesto mínimo" })}
          min={min}
          max={max}
          step={step}
          value={lo}
          onChange={(e) => setLo(Number(e.target.value))}
          className="itineraya-range pointer-events-none absolute inset-x-0 top-1/2 h-9 w-full -translate-y-1/2 appearance-none bg-transparent"
          style={{ zIndex: lo > max - step ? 5 : 3 }}
        />
        <input
          type="range"
          aria-label={t("onboarding.budgetMaxLabel", { defaultValue: "Presupuesto máximo" })}
          min={min}
          max={max}
          step={step}
          value={hi}
          onChange={(e) => setHi(Number(e.target.value))}
          className="itineraya-range pointer-events-none absolute inset-x-0 top-1/2 h-9 w-full -translate-y-1/2 appearance-none bg-transparent"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-900 ring-1 ring-sky-100">
          {lo === min ? `${fmt(lo)}€` : `${fmt(lo)}€`} —{" "}
          {hi === max ? `${fmt(hi)}€+` : `${fmt(hi)}€`}
        </span>
      </div>

      <div
        key={tier}
        className="mt-4 animate-in fade-in slide-in-from-bottom-1 rounded-2xl bg-white/70 p-4 ring-1 ring-sky-100 duration-300"
      >
        <p className="text-sm font-bold text-sky-900">{t(`onboarding.budgetTier.${tier}.title`)}</p>
        <p className="mt-1 text-xs leading-relaxed text-sky-600">
          {t(`onboarding.budgetTier.${tier}.desc`)}
        </p>
      </div>
    </div>
  );
}
