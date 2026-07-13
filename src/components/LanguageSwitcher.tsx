import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react";
import { LANGUAGE_OPTIONS, normalizeLang, type AppLang } from "@/i18n";
import { setAppLanguage } from "@/components/LanguageProvider";

interface Props {
  variant?: "light" | "dark";
  compact?: boolean;
}

export function LanguageSwitcher({ variant = "light", compact = false }: Props) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = normalizeLang(i18n.language);
  const currentOpt = LANGUAGE_OPTIONS.find((l) => l.code === current) ?? LANGUAGE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    // `mousedown` no dispara de forma fiable en un tap táctil real — sin
    // `touchstart` aquí, un toque fuera del desplegable en móvil podía no
    // cerrarlo.
    const onOutside = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("touchstart", onOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("touchstart", onOutside);
    };
  }, [open]);

  const onSelect = async (code: AppLang) => {
    setOpen(false);
    await setAppLanguage(code);
  };

  const triggerClass =
    variant === "dark"
      ? "bg-white/15 text-white hover:bg-white/25"
      : "bg-white/70 text-sky-800 hover:bg-white";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold backdrop-blur-md transition ${triggerClass}`}
        aria-label="Language"
      >
        <span className="text-base leading-none">{currentOpt.flag}</span>
        {!compact && <span className="hidden sm:inline">{currentOpt.label}</span>}
        {compact && <Globe className="h-4 w-4" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl">
          {LANGUAGE_OPTIONS.map((opt) => (
            <LanguageOption key={opt.code} opt={opt} selected={opt.code === current} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function LanguageOption({
  opt,
  selected,
  onSelect,
}: {
  opt: (typeof LANGUAGE_OPTIONS)[number];
  selected: boolean;
  onSelect: (code: AppLang) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(opt.code)}
      className={`flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm transition hover:bg-sky-50 ${
        selected ? "text-[#1E6B9A] font-semibold" : "text-sky-800"
      }`}
    >
      <span className="flex items-center gap-3">
        <span className="text-base leading-none">{opt.flag}</span>
        <span>{opt.label}</span>
      </span>
      {selected && <Check className="h-4 w-4 text-[#1E6B9A]" />}
    </button>
  );
}
