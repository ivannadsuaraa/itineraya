import { cn } from "@/lib/utils";

// Stepper con número dentro de un círculo negro — usado en demo/onboarding.
export function StepCircles({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn("flex items-center", i < total - 1 && "flex-1")}>
          <span
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
              i <= current
                ? "bg-black text-white"
                : "bg-white text-slate-400 ring-1 ring-slate-200",
            )}
          >
            {i + 1}
          </span>
          {i < total - 1 && (
            <span className={cn("mx-1.5 h-px flex-1", i < current ? "bg-black" : "bg-slate-200")} />
          )}
        </div>
      ))}
    </div>
  );
}
