# FINAL_AUDIT_REPORT — Itineraya

**Branch:** `claude/itineraya-e2e-verification-u46j2n`
**Date:** 2026-08-27
**Commits:** `1bfcba5` (first round of fixes) · `77b4155` (database + second round) · `38d6857` (formatting / lint)

---

## 0. What this audit could and could not do

**No service credentials exist in this container.** No `ANTHROPIC_API_KEY`, Supabase, Stripe, Google, Unsplash or Resend key (verified by enumerating `process.env`). So **no account was created, no itinerary was generated through the real model, no payment was made, and no authenticated screen was ever rendered.** Findings about authenticated UI are derived from code, not from executing the flow.

**Three of the five subagents were killed mid-run by an account session limit.** Completed: the Travel Agency Professional and the Senior Software Engineer. Did not finish: the Real Traveler (no report), the UI/i18n reviewer (no report), the Local Resident (produced nothing). Where their lanes mattered I did the work directly and say so.

**What was actually executed** — this is evidence, not inference:

| Check | Tool | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | clean, before and after every change |
| Lint | `npm run lint` | **1 328 problems → 0 errors** (18 pre-existing react-refresh warnings) |
| Production build | `npm run build` | passes |
| **All 36 migrations replayed on real Postgres 16** | local cluster + Supabase-compatible shim | **28 applied / 7 failed → 33 / 6** (remaining 6 are `pg_net` email stubs unavailable here) |
| **20 security assertions as `anon` / `authenticated` / `service_role`** | `psql`, SET ROLE + JWT claim | all 20 pass — see §2 |
| Real browser, 375 px + 1440 px, 6 public routes | Playwright + Chromium | 0 JS errors, 0 horizontal overflow |
| Overlay/tap blocking | `document.elementFromPoint()` on every visible control | see UX-1 |
| Inland-destination logic | executed over 33 real inputs | see Q-1 |
| Prompt timezone behaviour | built the real prompt under UTC, UTC−7, UTC+14 | see E-11 |
| Production prompt builder | `generate-test-itinerary.ts --prompt-only` | byte-for-byte diff before/after |
| i18n key parity | script over 4 locales + every static `t()` in `src/` | at parity — §5 |
| Client bundle secret scan | grep built `.output/public/` | 0 hits for `service_role`, `sk_live_`, `sk_test_`, API keys, `node:crypto` |

**The single most valuable decision in this audit was standing up a real Postgres and replaying the migrations.** It found two defects that no amount of code reading would have surfaced — and one of them invalidates a fix a previous audit recorded as closed.

---

## 1. Findings

Status: **FIXED** · **REPORTED** (not fixed — reason given) · **NOT VERIFIED**.

### Database — found by replaying migrations (my own work; no agent covered this)

| # | Sev | Finding | Status |
|---|---|---|---|
| DB-1 | **CRITICAL** | **The security-hardening migration cannot be applied.** `20260704090000` lists `travel_mode` in a `GRANT UPDATE (…) ON public.profiles`, but `travel_mode` is a column of `trips`, not `profiles` (confirmed against the generated schema types). Postgres rejects the whole GRANT, and the statement immediately before it is `REVOKE UPDATE ON public.profiles FROM authenticated`. So **everything after that line never runs**: the plan-escalation fix, the `trip_members` self-insertion fix, and the anon column scoping on published trips. Whichever way it was applied, the intended end state was never reached — either the file rolled back entirely, or `authenticated` was left with *no* write access to profiles at all. A previous audit recorded all three of those as "closed". | **FIXED** — historical file corrected + a new idempotent migration re-asserts all three blocks, safe from any starting state |
| DB-2 | **CRITICAL** | **Infinite recursion in the RLS policies.** `trips."members can view trip"` reads `trip_members`; `trip_members."members can view own membership rows"` reads `trips`. Replaying the migrations in order and querying as `authenticated`, **SELECT, UPDATE and DELETE on `trips` all fail** with `infinite recursion detected in policy` — only INSERT survives, because it doesn't read the row. On this migration set the dashboard, the trip page and saving a note do not work for anybody. Nothing later in the migration history fixes it. | **FIXED** — cycle broken with two `SECURITY DEFINER` helpers; access rules unchanged, verified by test |

> **Caveat, stated plainly:** I cannot read production, so I cannot tell you which state your live database is in. What is proven is that the committed migration set does not produce a working, hardened schema. Both fixes are idempotent and converge any starting state.

### AGENT 1 — Travel Agency Professional (completed)

> Verdict, verbatim: *"No. The prose quality is genuinely good — better than most agency copy I have read — but a sellable itinerary is an operational document."*

| # | Sev | Finding | Status |
|---|---|---|---|
| A1-1 | BLOCKER | **The quality bench has never been run.** `scripts/output/*.json` are presented as production samples but each carries a `_meta.AVISO` saying they were written by a large model in a dev session, not by `claude-haiku-4-5` via the API. **I verified this.** Every quality claim rests on output from a different model. | REPORTED — needs an API key |
| A1-2 | BLOCKER | No traveller headcount anywhere; the budget tier divides a total by days only, so a family of four on 5 200 €/10 days is classed "luxury". | REPORTED — schema + DB + UI feature |
| A1-3 | BLOCKER | Fake boarding pass: flight number, gate and seat invented from the trip UUID, cabin class from the *subscription tier*, downloadable as a PNG with no disclaimer. | **PARTIALLY FIXED** — disclaimer now inside the downloadable card, in 4 languages. Deleting the airline vocabulary is a product call |
| A1-4 | BLOCKER | The assistant edit destroyed traveller data and all personalisation (4 distinct defects). | **FIXED** (all 4) |
| A1-5 | BLOCKER | The 3 km hotel-anchor rule is arithmetically unsatisfiable against "the icons are non-negotiable". | REPORTED — prompt redesign, needs a real generation run to validate |
| A1-6 | MAJOR | Inland/beach guard dead for the main market. | **FIXED** (Q-1) |
| A1-7 | MAJOR | No end times or durations in the schema. | REPORTED — schema change |
| A1-8 | MAJOR | A short model response silently mis-dates every following day; only a `console.warn`. | **FIXED** — retries once, then logs as an error |
| A1-9 | MAJOR | Contradictory prompt rules with no precedence. | REPORTED |
| A1-10 | MAJOR | Arrival/departure logic sells empty days ("10 días" delivering 8). | REPORTED |
| A1-11 | MAJOR | No cost data anywhere. | REPORTED — schema change |
| A1-12 | MAJOR | `unchecked` places were excluded from the verification count and had no badge, so a half-checked itinerary read like a fully checked one. | **FIXED** — the count now declares them |
| A1-13 | MINOR | "Reservar" shown for fallback anchors that aren't bookable. | **FIXED** — "Ver" when Places looked and found nothing |
| A1-14 | MINOR | `hotel` category unreachable in the common case; `transport` carries no operator data. | REPORTED — schema |
| A1-15 | MINOR | `extractJson` repair could silently persist a half-empty itinerary as `ready`. | **FIXED** — parses strictly first, logs loudly if the repair path runs |

### AGENT 2 — Real Traveler (did not complete)

No report. **No traveler findings are claimed here.** The public surface was covered by the browser testing I ran directly; the authenticated journey — signup, generation wait, trip page, editing, sharing — was walked by nobody and is the largest untested area of this audit.

### AGENT 3 — Local Resident (did not complete; I took over the data-accuracy lane)

| # | Sev | Finding | Status |
|---|---|---|---|
| Q-1 | HIGH | **The beach guard was off for most of the Spanish-speaking market and factually wrong for nine cities.** Executed over 33 inputs: **"Roma", "Praga", "Florencia", "Londres", "Viena", "Cracovia", "Bruselas", "Ginebra" all returned *coastal*** — the list was English-only. Separately, nine cities with their own beach (Copenhague, Estocolmo, Oslo, Helsinki, Reikiavik, Dublín, Edimburgo, Venecia/Lido, Lima/Costa Verde) were being told the sea was "strictly forbidden". | **FIXED** — exonyms in 4 languages, 9 coastal cities removed |
| Q-2 | MEDIUM | The list was duplicated verbatim in the edit path. | **FIXED** — single source of truth |
| Q-3 | LOW | Small inland towns aren't on the list and fall through to the cautious branch. | REPORTED — acceptable by design |
| Q-4 | LOW | `"santiago"` and `"la paz"` are ambiguous (Compostela/Chile/Cuba; Bolivia/Baja California). | REPORTED — documented in the code |

**Not done:** per-venue fact-checking of the sample itineraries. Since those aren't production-model output (A1-1), checking them would grade the wrong model.

### AGENT 4 — Senior Software Engineer (completed)

| # | Sev | Finding | Status |
|---|---|---|---|
| E-1 | CRITICAL | A free user could reset their own chat quota to zero from the browser console — `chat_usage` had write grants to `authenticated` and RLS that only checks row ownership, and `message_count` *is* the quota. | **FIXED** — free path moved to the atomic service-role RPC; migration revokes the grants. Verified: `authenticated` write now denied |
| E-2 | HIGH | The "free = 2 for life" cap was bypassable two ways: delete a trip from the dashboard's own button, or `PATCH status` to `"draft"` to keep it and drop out of the count. | **FIXED** — `status` removed from the client column grant, and a monotonic `generation_ledger` the client cannot touch. Verified: user deletes both trips → trips count 0, ledger still 2 |
| E-3 | HIGH | The Stripe webhook returned 200 when the DB write failed, silently leaving a paying customer on `plan="free"` with no retry. | **FIXED** — all writes propagate → 500 → Stripe retries |
| E-3b | HIGH | A paid Trip Pass could be lost forever if the bonus increment failed after the ledger insert. | **FIXED** — ledger row removed so the retry completes |
| E-4 | MEDIUM | SSRF in `/api/og/$slug` via user-writable `hero_image_url`. | **FIXED** at both ends — host allow-list, https-only, redirects refused; and `hero_image_url` removed from the client column grant. Verified |
| E-5 | MEDIUM | Trips over 14 days silently truncated. | **FIXED** |
| E-6 | MEDIUM | `sitemap.xml` contained zero trip URLs — it selected `updated_at`, outside the anon column grant, and swallowed the error. | **FIXED** — and **proven**: as `anon`, the old query returns `permission denied`, the fixed one returns rows |
| E-7 | MEDIUM | Free chat counter was a read-then-write race; message size uncapped. | **FIXED** (both) |
| E-8 | MEDIUM | Trip coordinates never saved — server code called the *browser* Supabase client, running as `anon` with no UPDATE grant, failure swallowed. | **FIXED** |
| E-9 | LOW | A trip owner could forge their own public view/rating counters via a direct PATCH. | **FIXED** — column-scoped UPDATE grant. Verified: forging `rating_sum`/`view_count` denied |
| E-10 | LOW | Checkout `returnUrl` accepts any origin. Self-limited: an attacker needs the victim's own token, so they can only redirect themselves. | REPORTED — see §3 |
| E-11 | LOW | `new Date("YYYY-MM-DD")` is UTC but read with local getters. | **FIXED** — and **proven**: under `America/Los_Angeles` a 1 July trip was announced as *June, Tuesday*; now July/Wednesday in every zone |
| E-12 | LOW | News cache write not awaited. | **FIXED** |
| E-13 | LOW | The demo-trip claim inserted unvalidated client JSON as a `ready` trip. | **FIXED** — now a Zod-validated server function |
| — | MEDIUM | `listPublicTrips` was the only cost-bearing public endpoint with no rate limit. | **FIXED** — 300/day per IP, fail-open |

Agent 4's auth table for all 20 `createServerFn` definitions found **every server function touching user data is behind `requireSupabaseAuth`**, and no server path passes user input into a service-role query bypassing an ownership check.

### UX / browser (run directly)

| # | Sev | Finding | Status |
|---|---|---|---|
| UX-1 | MEDIUM | The cookie banner covers the bottom 166 px (mobile) / 138 px (desktop); controls landing there receive the tap. Proven with `elementFromPoint`: "Empieza gratis", "Elegir plan", "Crear mi viaje" all blocked with no consent stored; **zero** blocked with consent set. | REPORTED — I built a fix, measured it, it didn't work; see §3 |
| UX-2 | LOW | SSR renders Spanish with `<html lang="es">`; the client then switches to the browser language, so a non-Spanish visitor sees a flash. | REPORTED — see §3 for the concrete blocker |
| UX-3 | LOW | 6–10 controls per page under 44 px; 1–2 per page with no accessible name. | REPORTED |
| UX-4 | LOW | `npm run lint` failed with 1 328 problems. | **FIXED** — 0 errors |
| — | — | Spanish-only server errors rendered raw to users, including API error bodies. | **FIXED** — stable codes + translated UI strings |

---

## 2. The database test suite

Twenty assertions, run as the real Postgres roles against a clean database with all migrations applied. Every one passes:

| # | Assertion | Result |
|---|---|---|
| 1–3 | Owner can SELECT / UPDATE own trip, and read `trip_members` | pass — *all three failed with recursion before DB-2* |
| 4 | Stranger sees 0 rows of someone else's trip | pass |
| 5 | Stranger cannot self-insert into `trip_members` | denied by RLS |
| 6 | Stranger cannot escalate their own `plan` | permission denied |
| 7 | Stranger *can* still update allowed profile columns | pass (no regression) |
| 8 | `authenticated` cannot write `chat_usage` | permission denied |
| 9 | `anon` cannot read `user_id` / `hotel_address` of a published trip | permission denied |
| 10 | `anon` *can* read the granted public columns | pass |
| 11 | Old sitemap query as `anon` | permission denied — **proves E-6** |
| 12 | Fixed sitemap query as `anon` | pass |
| 13 | Owner invites a member; the member can see the trip | pass (tripmates still works) |
| A–C | Owner can update `itinerary`, `is_public`/`share_slug`/`published_at`, `geo_lat`/`geo_lng` | pass |
| D | `status` → `"draft"` (quota dodge) | permission denied |
| E | `hero_image_url` → `169.254.169.254` (SSRF) | permission denied |
| F | Forge `rating_sum` / `view_count` | permission denied |
| G | `service_role` can still write `status` + `hero_image_url` | pass (server path intact) |

Plus, outside SQL: deleting both trips leaves `trips_count = 0` but `ledger_count = 2`, and `authenticated` can neither read nor delete the ledger.

---

## 3. What is still not fixed, and why

**Three changes I made, measured, and reverted** — a reverted fix is still information:

- **Cookie-banner overlay (UX-1).** I reserved the banner's height as body padding. It applied (measured `paddingBottom: 178px`) and changed *nothing* — `elementFromPoint` returned byte-identical results, because document-end padding cannot move a mid-page CTA out from under a fixed bottom banner. Reverted. A real fix is a smaller banner or different placement — a design decision, and even halving its height would not clear the `/pricing` CTA.
- **Checkout `returnUrl` allow-list (E-10).** Enforcing `startsWith(SITE_URL)` breaks checkout on any preview deployment where `SITE_URL` points at production, and I cannot test checkout. The finding is self-limited. One line if you want it: reject when `SITE_URL` is set and `returnUrl` doesn't start with it.
- **A `Record<string, never>` type for the email template maps.** The templates take genuinely different props, so no common type exists — this is the "casteo inevitable" your CLAUDE.md allows. Reverted to `any` with an `eslint-disable` and the reason written down. (Typing the *payload* did stick, and surfaced a real latent bug: a hook payload without `email` was reaching Resend as `to: [undefined]`. Now rejected with 400.)

**SSR language (UX-2) — not attempted, with a concrete reason.** The correct fix needs per-request language detection, but `src/i18n/index.ts` is a module-level singleton: calling `changeLanguage` per request would race across concurrent SSR requests on the same server instance. Doing it properly requires `i18n.cloneInstance()` per request plus an `I18nextProvider` — an architectural change I cannot test on authenticated pages. The current design (render `es`, switch on the client) is a defensible choice, not an accident.

**Deliberately out of scope** — features, not defects, and the brief said not to add them: traveller headcount, per-person pricing, per-day cost estimates, `duration_min`/`end_time`, per-day `date`, emergency/embassy/insurance blocks, a printable PDF. Also deleting the fake flight number/gate/seat, which is a deliberate brand device.

**Still open, needs your decision:**

- **Google Places key reuse.** `place-verification.ts` falls back to `VITE_GOOGLE_MAPS_KEY`, and a `VITE_` value ships to the browser — so the billed Places API can be called on your account by anyone who lifts it. The fix is a server-only `GOOGLE_PLACES_KEY` and dropping both `VITE_` fallbacks, but doing that blind would silently disable place verification if that is the only key you have set. Change it together with the env var.
- **`graphify-out/` is committed** — tool cache, ~37 JSON files. Probably wants to be gitignored.

**Not verified at all** — the honest gap list:

1. Every authenticated screen. None was rendered.
2. Most of PART 2's critical paths: the activation funnel end-to-end, generation quality on three destinations, generation time under 30 s, auth flows (email/password, Google OAuth, reset, confirmation), Google Maps pins and the Leaflet fallback, Trip Pass checkout and subscription upgrade, webhook idempotency against real Stripe events, the share dialog and OG image rendering.
3. **Which state your production database is actually in** (DB-1, DB-2). The migration set is proven broken; production may differ.
4. Every exploit described. Not one PostgREST call, Stripe webhook or `/api/og` request was issued against the real service — but the SQL-level equivalents *were* executed, which is what §2 is.
5. The quality of anything the production model actually writes (A1-1).

---

## 4. Cross-referenced findings

- **The assistant edit path** — Agent 1 (BLOCKER, data destruction) and Agent 4 (silent failures) hit it independently. Six defects, all fixed.
- **The 14-day truncation** — Agent 4, Agent 1 (wrong dates on short responses) and my own reading, independently. Fixed.
- **The inland list** — Agent 1 (dead for Spanish input) and the Local Resident lane (nine cities mis-classified). Fixed together.
- **`trips` write permissions** — Agent 4 flagged three separate consequences (quota dodge, SSRF source, forged ratings) that turned out to share one root cause: a table-wide UPDATE grant. One migration closed all three.

---

## 5. i18n status

Measured: **es 922, en 922, fr 924, pt 924** keys. Zero missing relative to Spanish; fr/pt carry two extra language labels. Of 586 static `t()` keys, the 8 that looked missing are i18next plural forms present in every locale.

The real defects were hardcoded language, not missing keys — Spanish-only chat prompt, Spanish-only edit prompt, `"DEPARTURE"`/`"RETURN"` literals in all four locale files, and Spanish server errors rendered raw. **All fixed.** Route `<title>` tags remain hardcoded Spanish: a defensible SEO choice for the primary market, and unfixable without SSR language detection (UX-2).

---

## 6. Final verdict from each perspective

**Travel Agency Professional — would you sell this today?**
**No, and that hasn't changed.** The four edit-path blockers are gone and the beach guard now works, but its verdict stands on what remains: no headcount, no per-person price, no end times, no booking references, no emergency block, no printable version. And the most important thing it found is that **nobody has ever seen what the production model actually produces**. Fix that first — everything else is opinion until then.

**Real Traveler — would you use this for your next trip?**
**Unknown, and I won't fake an answer.** That agent died before reporting and no authenticated screen was rendered by anyone. The public pages render cleanly, there's no overflow at 375 px, and no JS errors. Signup, the generation wait, the trip page, editing and sharing were checked by nobody.

**Local Resident — would you stand behind the content?**
**More than yesterday.** "Roma" is now correctly inland — it was not — and nine genuinely coastal cities are no longer told the sea is forbidden. But the per-venue fact-check wasn't done, and doing it against the committed samples would grade the wrong model. This is the highest-value thing to run once you have an API key.

**Senior Software Engineer — would you deploy this?**
**Yes — and now I'd say it's the safest state this codebase has been in.** Two critical database defects fixed that a previous audit had recorded as closed; one critical quota bypass and both halves of the free-tier bypass closed; an SSRF closed at both ends; two ways of losing a customer's money fixed; the SEO surface restored; five silent failures made loud; lint green for the first time. Twenty security assertions pass against a real Postgres.

Deploy it with eyes open, in this order: **migrations first, then code** — the code assumes `status` and `hero_image_url` are service-role-writable. Watch the Stripe webhook logs, which now return 500 where they used to lie with a 200; failures that were invisible will start appearing, which is the point. And note that `20260827094000` changes RLS on `trips` — if your production database is *not* in the recursive state, that migration is still a no-op-equivalent rewrite of the same rules, so it is safe either way.

---

## 7. Merge instructions

Three commits on `claude/itineraya-e2e-verification-u46j2n`, pushed to origin. Nothing has been merged.

**Review these by eye first** — widest blast radius:
- `supabase/migrations/20260827094000_fix_trip_rls_recursion.sql` — changes RLS on `trips` and `trip_members`
- `supabase/migrations/20260827095000_restrict_trips_update_columns.sql` — must land *before* the code deploy
- `src/lib/itinerary-edit.functions.ts` — largest code diff
- `src/routes/api/public/payments/webhook.ts` — now returns 500 where it returned 200

```bash
# 1. Review
git fetch origin
git checkout claude/itineraya-e2e-verification-u46j2n
git diff origin/main...HEAD                      # everything
git diff origin/main...HEAD -- supabase/         # just the migrations
git log origin/main..HEAD --oneline              # 3 commits

# 2. Verify locally (all three pass here)
npm ci                # or: bun install
npx tsc --noEmit
npm run lint
npm run build

# 3. Merge
git checkout main
git pull origin main
git merge --no-ff claude/itineraya-e2e-verification-u46j2n
git push origin main
```

**After merging — migrations BEFORE the code deploy:**

```bash
supabase db push
```

Five migrations, in order:

| Migration | What it does |
|---|---|
| `20260827090000_revoke_chat_usage_client_grants` | Removes client write access to the chat quota table |
| `20260827093000_reassert_security_hardening` | Re-asserts the three blocks that never applied (DB-1) |
| `20260827094000_fix_trip_rls_recursion` | Breaks the `trips` ↔ `trip_members` policy cycle (DB-2) |
| `20260827095000_restrict_trips_update_columns` | Column-scoped UPDATE on `trips` — **must precede the code deploy** |
| `20260827100000_generation_ledger` | Monotonic generation counter, starts empty by design |

Then:

5. **Deploy the code**, and watch the Stripe webhook logs for 500s.
6. **Sanity-check in production** that a user can still open a trip, save a note and publish a trip — that exercises the new column grants and the RLS rewrite together.
7. **Run the quality bench against the real model** — the highest-value follow-up in this report:
   ```bash
   ANTHROPIC_API_KEY=… GOOGLE_PLACES_KEY=… \
     node --experimental-strip-types --import ./scripts/register-alias.mjs \
     scripts/generate-test-itinerary.ts scripts/scenarios/roma-primera-vez.json
   ```
   Then have someone who knows Rome read every line of it.

**Not in this branch, by design:** `package-lock.json` (gitignored — the repo uses `bun.lock`; I used npm only because the pinned registry returned 403 here), prettier reformatting of the ~34 historical `.md` reports, and the `graphify-out/` tool cache.
