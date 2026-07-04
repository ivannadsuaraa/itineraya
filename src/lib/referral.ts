const STORAGE_KEY = "itineraya_referral";
const ATTRIBUTION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type PendingReferral = {
  ref?: string;
  utmSource?: string;
  capturedAt: number;
};

// ShareDialog appends ?ref=<userId>&utm_source=<canal> to every link it
// generates. Sign-up always happens on a different page (or after an OAuth
// redirect), so this has to survive the trip until then.
export function captureReferralFromLocation(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref") ?? undefined;
  const utmSource = params.get("utm_source") ?? undefined;
  if (!ref && !utmSource) return;
  const pending: PendingReferral = { ref, utmSource, capturedAt: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
}

export function getPendingReferral(): PendingReferral | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingReferral;
    if (Date.now() - parsed.capturedAt > ATTRIBUTION_WINDOW_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
