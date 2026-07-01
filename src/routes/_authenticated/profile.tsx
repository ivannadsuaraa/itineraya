import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  LogOut,
  CreditCard,
  Sparkles,
  Mail,
  ArrowRight,
  Heart,
  Loader2,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const TRAVEL_STYLES = ["adventure", "relax", "cultural", "romantic", "family", "party", "nature"];
const BUDGET_RANGES = ["low", "medium", "high", "luxury"];
const TRAVELER_TYPES = ["solo", "couple", "family", "friends", "business"];

function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isActive } = useSubscription();
  const [email, setEmail] = useState<string>("");
  const [fullName, setFullName] = useState<string>("");
  const [plan, setPlan] = useState<string>("free");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Preferences
  const [travelStyle, setTravelStyle] = useState<string>("");
  const [budgetRange, setBudgetRange] = useState<string>("");
  const [travelerType, setTravelerType] = useState<string>("");
  const [preferredDestinations, setPreferredDestinations] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const user = u.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data: p } = await supabase
        .from("profiles")
        .select(
          "full_name, avatar_url, plan, travel_style, budget_range, preferred_destinations, traveler_type",
        )
        .eq("id", user.id)
        .maybeSingle();
      setFullName(p?.full_name ?? "");
      setAvatar(p?.avatar_url ?? null);
      setPlan((p?.plan as string) ?? "free");
      setTravelStyle((p?.travel_style as string) ?? "");
      setBudgetRange((p?.budget_range as string) ?? "");
      setPreferredDestinations(
        Array.isArray(p?.preferred_destinations) ? (p!.preferred_destinations as string[]).join(", ") : "",
      );
      setTravelerType(((p as { traveler_type?: string } | null)?.traveler_type as string) ?? "");
    })();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const handleSavePrefs = async () => {
    if (!userId) return;
    setSaving(true);
    setSaved(false);
    const destinations = preferredDestinations
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await supabase
      .from("profiles")
      .update({
        travel_style: travelStyle || null,
        budget_range: budgetRange || null,
        preferred_destinations: destinations,
        traveler_type: travelerType || null,
      } as never)
      .eq("id", userId);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const filledCount = [travelStyle, budgetRange, travelerType, preferredDestinations.trim()].filter(Boolean).length;
  const completion = Math.round((filledCount / 4) * 100);

  const planLabel =
    plan === "explorador" ? "Explorador" : plan === "viajero" ? "Viajero" : "Gratis";

  return (
    <div className="min-h-screen bg-slate-50">
      <div>
        <main className="mx-auto max-w-2xl px-5 py-8 md:px-10 md:py-12">
          <h1 className="font-display text-3xl font-bold text-slate-900">Perfil</h1>
          <p className="mt-1 text-sm text-slate-500">Tu cuenta, plan y ajustes.</p>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt="" className="h-16 w-16 rounded-full object-cover" />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-full bg-sky-100 text-sky-700">
                  <UserIcon className="h-7 w-7" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold text-slate-900">
                  {fullName || email.split("@")[0] || "Viajero"}
                </p>
                <p className="flex items-center gap-1.5 truncate text-sm text-slate-500">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Plan actual
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">
                  {planLabel}
                  {isActive && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      activo
                    </span>
                  )}
                </p>
              </div>
              <Link
                to="/pricing"
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" />
                {plan === "explorador" ? "Gestionar" : "Mejorar"}
              </Link>
            </div>
          </section>

          {/* Travel preferences */}
          <section className="mt-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-sky-900">
                  <Heart className="h-4 w-4 text-sky-600" /> Preferencias de viaje
                </p>
                <p className="mt-1 text-xs text-sky-700">
                  Completa tu perfil para itinerarios más personalizados ✨
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
                {completion}%
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Estilo de viaje favorito</label>
                <select
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                >
                  <option value="">— Selecciona —</option>
                  {TRAVEL_STYLES.map((s) => (
                    <option key={s} value={s}>{t(`explore.style.${s}`, s)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Presupuesto habitual</label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                >
                  <option value="">— Selecciona —</option>
                  <option value="low">Mochilero / Económico</option>
                  <option value="medium">Medio</option>
                  <option value="high">Alto</option>
                  <option value="luxury">Lujo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Tipo de viajero</label>
                <select
                  value={travelerType}
                  onChange={(e) => setTravelerType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                >
                  <option value="">— Selecciona —</option>
                  <option value="solo">Solo</option>
                  <option value="couple">En pareja</option>
                  <option value="family">En familia</option>
                  <option value="friends">Con amigos</option>
                  <option value="business">Negocios</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  Destinos que quieres visitar
                </label>
                <input
                  value={preferredDestinations}
                  onChange={(e) => setPreferredDestinations(e.target.value)}
                  placeholder="Tokio, Bali, Patagonia…"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                />
                <p className="mt-1 text-[11px] text-slate-500">Separa con comas.</p>
              </div>

              <Button
                onClick={handleSavePrefs}
                disabled={saving}
                className="mt-1 w-full justify-center gap-2 bg-gradient-to-r from-sky-600 to-cyan-500 text-white hover:opacity-95"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saved ? (
                  <>
                    <Check className="h-4 w-4" /> Guardado
                  </>
                ) : (
                  "Guardar preferencias"
                )}
              </Button>
            </div>
          </section>

          <section className="mt-4 grid gap-2">
            <Link
              to="/pricing"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <CreditCard className="h-4 w-4 text-slate-500" />
                Suscripción y pagos
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <UserIcon className="h-4 w-4 text-slate-500" />
                Mis viajes
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
          </section>

          <div className="mt-6">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-center gap-2 text-red-600 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              {t("dashboard.logout")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
