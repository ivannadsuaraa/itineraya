import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
import { PassportStamps, type StampTrip } from "@/components/airport/PassportStamps";
import { CountUp } from "@/components/ui/CountUp";
import { haversineKm, homeCoordsForLanguage, kmToMiles, travelClassForPlan } from "@/lib/flight";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

const TRAVEL_STYLES = ["adventure", "relax", "cultural", "romantic", "family", "party", "nature"];
const BUDGET_RANGES = ["low", "medium", "high", "luxury"];
const TRAVELER_TYPES = ["solo", "couple", "family", "friends", "business"];

type ProfileTrip = StampTrip & { geo_lat?: number | null; geo_lng?: number | null };

// Carga tolerante a migraciones: si geo_lat/geo_lng no existen en prod, la
// query entera falla — reintenta sin ellas (mismas reglas que el dashboard).
async function fetchProfileTrips(userId: string): Promise<ProfileTrip[]> {
  const base = "id,destination,start_date,end_date";
  const withGeo = await supabase
    .from("trips")
    .select(`${base},geo_lat,geo_lng`)
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
  if (!withGeo.error) return (withGeo.data ?? []) as unknown as ProfileTrip[];
  const plain = await supabase
    .from("trips")
    .select(base)
    .eq("user_id", userId)
    .order("start_date", { ascending: true });
  return (plain.data ?? []) as unknown as ProfileTrip[];
}

function ProfilePage() {
  const { t, i18n } = useTranslation();
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
  const [trips, setTrips] = useState<ProfileTrip[]>([]);

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
        Array.isArray(p?.preferred_destinations)
          ? (p!.preferred_destinations as string[]).join(", ")
          : "",
      );
      setTravelerType(((p as { traveler_type?: string } | null)?.traveler_type as string) ?? "");
      setTrips(await fetchProfileTrips(user.id));
    })();
  }, []);

  // Estadísticas de viajero: destinos únicos, millas estimadas (ida y vuelta
  // desde una ciudad base plausible por idioma) y clase según plan.
  const travelerStats = useMemo(() => {
    const uniqueDestinations = new Set(
      trips.map((tr) => tr.destination.split(",")[0].trim().toLowerCase()),
    );
    const home = homeCoordsForLanguage(i18n.language);
    let km = 0;
    for (const tr of trips) {
      if (tr.geo_lat != null && tr.geo_lng != null) {
        km += haversineKm(home, [tr.geo_lat, tr.geo_lng]) * 2;
      }
    }
    return { destinations: uniqueDestinations.size, miles: Math.round(kmToMiles(km)) };
  }, [trips, i18n.language]);

  const travelClass = travelClassForPlan(plan);

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

  const filledCount = [travelStyle, budgetRange, travelerType, preferredDestinations.trim()].filter(
    Boolean,
  ).length;
  const completion = Math.round((filledCount / 4) * 100);

  const planLabel =
    plan === "explorador"
      ? t("pricing.explorador.name")
      : plan === "viajero"
        ? t("pricing.viajero.name")
        : t("pricing.free.name");

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* Dark header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-950 to-sky-900 px-4 pb-12 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-sky-700/25 blur-3xl" />
          <div className="absolute -bottom-8 left-0 h-48 w-80 rounded-full bg-[#1E6B9A]/30 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover ring-2 ring-white/30"
              />
            ) : (
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 text-white ring-2 ring-white/20">
                <UserIcon className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-bold text-white">
                {fullName || email.split("@")[0] || t("profilePrefs.defaultName")}
              </p>
              <p className="truncate text-sm text-sky-300">{email}</p>
            </div>
          </div>
        </div>
      </section>

      <div>
        <main className="mx-auto max-w-2xl px-5 py-6 md:px-10 md:py-8">
          {/* Estadísticas de viajero, estilo panel de vuelo */}
          <section className="mt-2 overflow-hidden rounded-2xl bg-[#050b16] p-5 shadow-sm ring-1 ring-sky-900/50">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="font-flight text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">
                  {t("airport.stats.destinations")}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                  <CountUp to={travelerStats.destinations} duration={1.2} locale={i18n.language} />
                </p>
              </div>
              <div>
                <p className="font-flight text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">
                  {t("airport.stats.miles")}
                </p>
                <p className="mt-1 font-display text-2xl font-bold text-white sm:text-3xl">
                  <CountUp to={travelerStats.miles} duration={1.6} locale={i18n.language} />
                </p>
                <p className="font-flight text-[9px] uppercase tracking-wider text-sky-300/50">
                  {t("airport.stats.milesHint")}
                </p>
              </div>
              <div>
                <p className="font-flight text-[9px] font-semibold uppercase tracking-[0.2em] text-sky-300/60">
                  {t("airport.stats.class")}
                </p>
                <p className="mt-1 font-flight text-lg font-bold uppercase tracking-wide text-amber-300 sm:text-xl">
                  {travelClass.label}
                </p>
              </div>
            </div>
            {/* Línea de pista decorativa */}
            <div
              aria-hidden
              className="mt-4 h-px bg-[repeating-linear-gradient(90deg,rgba(56,189,248,0.4)_0_10px,transparent_10px_20px)]"
            />
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("profilePrefs.currentPlan")}
                </p>
                <p className="mt-1 font-display text-xl font-bold text-slate-900">
                  {planLabel}
                  {isActive && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      {t("pricing.active")}
                    </span>
                  )}
                </p>
              </div>
              <Link
                to="/pricing"
                className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 text-sm font-semibold text-white shadow-md hover:opacity-95"
              >
                <Sparkles className="h-4 w-4" />
                {plan === "explorador" ? t("profilePrefs.manage") : t("profilePrefs.upgrade")}
              </Link>
            </div>
          </section>

          {/* Travel preferences */}
          <section className="mt-4 rounded-2xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-sky-900">
                  <Heart className="h-4 w-4 text-sky-600" /> {t("profilePrefs.title")}
                </p>
                <p className="mt-1 text-xs text-sky-700">{t("profilePrefs.subtitle")}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-sky-700 ring-1 ring-sky-200">
                {completion}%
              </span>
            </div>

            <div className="mt-4 grid gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {t("profilePrefs.styleLabel")}
                </label>
                <select
                  value={travelStyle}
                  onChange={(e) => setTravelStyle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-sky-400 sm:text-sm"
                >
                  <option value="">{t("profilePrefs.select")}</option>
                  {TRAVEL_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {t(`explore.style.${s}`, s)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {t("profilePrefs.budgetLabel")}
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-sky-400 sm:text-sm"
                >
                  <option value="">{t("profilePrefs.select")}</option>
                  <option value="low">{t("profilePrefs.budgetLow")}</option>
                  <option value="medium">{t("profilePrefs.budgetMedium")}</option>
                  <option value="high">{t("profilePrefs.budgetHigh")}</option>
                  <option value="luxury">{t("profilePrefs.budgetLuxury")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {t("profilePrefs.travelerLabel")}
                </label>
                <select
                  value={travelerType}
                  onChange={(e) => setTravelerType(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-sky-400 sm:text-sm"
                >
                  <option value="">{t("profilePrefs.select")}</option>
                  <option value="solo">{t("profilePrefs.travelerSolo")}</option>
                  <option value="couple">{t("profilePrefs.travelerCouple")}</option>
                  <option value="family">{t("profilePrefs.travelerFamily")}</option>
                  <option value="friends">{t("profilePrefs.travelerFriends")}</option>
                  <option value="business">{t("profilePrefs.travelerBusiness")}</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">
                  {t("profilePrefs.destinationsLabel")}
                </label>
                <input
                  value={preferredDestinations}
                  onChange={(e) => setPreferredDestinations(e.target.value)}
                  placeholder={t("profilePrefs.destinationsPh")}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none focus:border-sky-400 sm:text-sm"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {t("profilePrefs.destinationsHint")}
                </p>
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
                    <Check className="h-4 w-4" /> {t("profilePrefs.saved")}
                  </>
                ) : (
                  t("profilePrefs.save")
                )}
              </Button>
            </div>
          </section>

          {/* Pasaporte digital con sellos de cada destino */}
          <PassportStamps trips={trips} />

          <section className="mt-4 grid gap-2">
            <Link
              to="/pricing"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <CreditCard className="h-4 w-4 text-slate-500" />
                {t("profilePrefs.billing")}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400" />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-sky-300"
            >
              <span className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                <UserIcon className="h-4 w-4 text-slate-500" />
                {t("nav.myTrips")}
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
