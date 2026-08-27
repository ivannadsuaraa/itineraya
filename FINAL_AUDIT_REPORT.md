# FINAL_AUDIT_REPORT — Itineraya

**Branch:** `claude/itineraya-e2e-verification-u46j2n`
**Date:** 2026-08-27
**Scope:** end-to-end audit from four expert perspectives, plus fixes for every real, verifiable defect found.

---

## 0. Read this first — what this audit could and could not do

Two hard constraints shaped everything below. Neither is a judgement about the product; both are facts about the environment this audit ran in.

**No credentials exist in this container.** There is no `ANTHROPIC_API_KEY`, no Supabase URL/key, no Stripe key, no Google Maps/Places key, no Unsplash key, no Resend key (verified: `node -e` over `process.env` returned only `ANTHROPIC_BASE_URL`). That means **no account was created, no itinerary was generated through the real model, no payment was made, and no authenticated screen was ever rendered.** Every finding about the authenticated app is derived from reading code, migrations and schemas — not from executing the flow. Where a claim is an inference, it says so.

**Three of the five subagents were killed mid-run by an account session limit.** Completed and reported: the Travel Agency Professional and the Senior Software Engineer. Did not finish: the Real Traveler (had captured page HTML and landing screenshots, no report), the UI/i18n reviewer (had written its analysis scripts, no report), and the Local Resident (produced nothing). Where their lanes mattered most I did the work directly and say so.

**What *was* executed for real**, and is therefore evidence rather than inference:

| Check | Tool | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | clean, before and after every change |
| Production build | `npm run build` | passes |
| Public pages render (SSR) | `curl` × 11 routes | all 200 (`/auth` 307 → `/auth?mode=login`) |
| Real browser, 375 px + 1440 px, 6 public routes | Playwright + Chromium | 0 JS errors, 0 horizontal overflow |
| Overlay/tap blocking | `document.elementFromPoint()` on every visible control | see finding UX-1 |
| Inland-destination logic | executed `isInlandDestination` over 33 real inputs | see finding Q-1 |
| Production prompt builder | `scripts/generate-test-itinerary.ts --prompt-only` | byte-for-byte prompt diffed before/after fix |
| i18n key parity | script over all 4 locale files + every static `t()` call in `src/` | see §5 |

---

## 1. Findings per agent

Severity: **BLOCKER** (ship-stopping) · **HIGH** · **MEDIUM** · **LOW**.
Status: **FIXED** (in this branch) · **REPORTED** (deliberately not fixed — reason given) · **NOT VERIFIED**.

### AGENT 1 — Travel Agency Professional (completed)

> Verdict, verbatim: *"No. The prose quality is genuinely good — better than most agency copy I have read — but a sellable itinerary is an operational document, and this one has no traveller headcount, no per-person price, no end times, no booking references, no emergency information, and no printable version."*

| # | Sev | Finding | Status |
|---|---|---|---|
| A1-1 | BLOCKER | **The quality bench has never actually been run.** `scripts/output/roma-primera-vez.json` and `albarracin-pueblo.json` are presented as production samples but each carries a `_meta.AVISO` stating they were written by a large model inside a dev session, not by `claude-haiku-4-5` via the API. **I verified this myself** — the notice is in both files. Every quality claim about this product currently rests on output from a much larger model than the one that runs in production. | REPORTED — needs an API key; cannot be done here |
| A1-2 | BLOCKER | **No traveller headcount anywhere.** `companion` is a 4-value enum; there is no adults/children count, so the budget tier ladder (`itinerary-prompt.ts`) divides a total by days only. A family of four on 5 200 €/10 days is classified "luxury (5-star hotels, private transfers)". | REPORTED — a schema + DB + UI feature, explicitly out of the "no new features" scope |
| A1-3 | BLOCKER | **Fake boarding pass presented as real.** `src/lib/flight.ts` invents a flight number, gate and seat from the trip UUID, and assigns cabin class from the *subscription tier*. It renders above every itinerary, labelled "Tarjeta de embarque / Vuelo / Puerta / Asiento", and is downloadable as a PNG with no disclaimer. **Verified in code.** | **PARTIALLY FIXED** — disclaimer added inside the downloadable card (see §2). Removing the flight/gate/seat entirely is a product call I did not make unilaterally |
| A1-4 | BLOCKER | **The assistant edit destroys traveller data and throws away all personalisation.** The edit prompt was hardcoded Spanish, received only 6 trip fields, rewrote the whole itinerary at `max_tokens: 8192` (half of generation), and merged back only `image_url` — so every note the traveller typed and every stop they ticked off was wiped. **All four parts verified in code.** | **FIXED** (4 separate fixes, §2) |
| A1-5 | BLOCKER | **The fixed-hotel anchor rule is arithmetically unsatisfiable.** "Every activity must be within ~3 km" of the hotel, while the same prompt says the icons are non-negotiable and every day needs a different zone. From a real Lisbon anchor, Belém is 12.5 km and Alfama 6.9 km. The model must break one rule and nothing says which. | REPORTED — prompt redesign; needs a real generation run to validate |
| A1-6 | MAJOR | **The inland/beach guard was dead for the main market** (English-only city list). | **FIXED** — see Q-1 below |
| A1-7 | MAJOR | No end times or durations in the schema — an activity has a start time and nothing else. | REPORTED (schema change) |
| A1-8 | MAJOR | A day carries no date; a short model response is only a `console.warn`, silently mis-dating every subsequent day. | REPORTED (schema change) — the related 14-day truncation **is** fixed, see E-5 |
| A1-9 | MAJOR | Contradictory instructions inside one prompt with no precedence (luxury tier vs "never recommend other hotels" vs the transport profile; repeat-visitor "neighbourhoods" vs the VILLAGE scale tier). | REPORTED |
| A1-10 | MAJOR | Arrival/departure logic quietly sells empty days: "10 días" delivering 8 usable ones. | REPORTED |
| A1-11..15 | MAJOR→MINOR | No cost data anywhere; `unchecked` verification renders identically to verified; affiliate "Reservar" links generated for fallback anchors that are not bookable; `extractJson` repair can persist a half-empty itinerary as `ready`. | REPORTED |

Agent 1 also produced two simulated itineraries (Lisbon 10-day anchored family; Morella 3-day repeat visitor by car) against the **real** production prompts emitted by the harness, and critiqued them. Both are explicitly labelled simulations, not API output.

### AGENT 2 — Real Traveler (did not complete)

Killed by the session limit before writing a report. It had captured SSR HTML for 15 routes and landing screenshots at mobile and desktop. **No traveler findings are claimed here.** The public-surface part of its lane was covered by the browser testing I ran directly (§UX below); the authenticated journey — signup, generation wait, editing, sharing — was **not** walked by anyone and remains the largest untested area of this audit.

### AGENT 3 — Local Resident (did not complete)

Produced nothing. I took over the highest-value part of its lane myself: fact-checking the hardcoded destination data.

| # | Sev | Finding | Status |
|---|---|---|---|
| Q-1 | HIGH | **The inland/beach guard was silently disabled for most of the Spanish-speaking market, and factually wrong for nine cities.** `INLAND_DESTINATION_NAMES` was an English-only list matched exactly against the first comma-segment of the destination. I executed `isInlandDestination` over 33 real inputs: **"Roma" → coastal, "Praga" → coastal, "Florencia" → coastal, "Londres" → coastal, "Viena" → coastal, "Cracovia" → coastal, "Bruselas" → coastal, "Ginebra" → coastal.** Spanish users type exactly those. Separately, nine cities on the list genuinely have their own beach and were being told the sea is "strictly forbidden": Copenhague, Estocolmo, Oslo, Helsinki, Reikiavik, Dublín, Edimburgo, Venecia (Lido) and Lima (Costa Verde). | **FIXED** |
| Q-2 | MEDIUM | The same list was duplicated verbatim in `itinerary-edit.functions.ts`, so any correction to one copy would leave the other behind. (They were identical at audit time — verified by diffing both sets.) | **FIXED** — the edit path now calls `isInlandDestination` |
| Q-3 | LOW | Small inland towns (Albarracín, Morella) are not on the list and fall through to the cautious branch, which asks the model to judge. Acceptable, but it means the hard guard only protects listed cities. | REPORTED |
| Q-4 | LOW | `"santiago"` is ambiguous (Compostela / de Chile / de Cuba — the last is coastal) and `"la paz"` likewise (Bolivia inland, Baja California coastal). Disambiguation belongs upstream in the autocomplete. | REPORTED — documented in a code comment |

**Not done:** per-venue fact-checking of the two sample itineraries against real local knowledge. Since those samples are not production-model output (A1-1), fact-checking them would grade the wrong model. This needs redoing against real API output.

### AGENT 4 — Senior Software Engineer (completed)

| # | Sev | Finding | Status |
|---|---|---|---|
| E-1 | CRITICAL | **A free user could reset their own AI-chat quota to zero from the browser console.** `chat_usage` carries `GRANT SELECT, INSERT, UPDATE ... TO authenticated` with an RLS policy whose only condition is "it's your row" — and `message_count` on that row *is* the quota. `/api/chat` read it through the service role and trusted it. `update({message_count: 0})` from devtools made the 10/day free limit unbounded. **Verified in the migration** (`20260621091437_…sql:8-11`) and in `chat.ts`. | **FIXED** (code + migration) |
| E-2 | HIGH | **The "free = 2 itineraries for life" cap is bypassable** — the cap counts `trips` rows with `status='ready'`, and `authenticated` holds an unrestricted UPDATE/DELETE grant on `trips`. Delete a trip from the dashboard's own button and generate another, forever; or `PATCH` `status` to `"draft"` to keep it and still drop out of the count. Only `DAILY_GENERATE_LIMIT = 20` still binds. | REPORTED — see §3 for why I did not change this |
| E-3 | HIGH | **The Stripe webhook returned 200 when the database write failed**, so a paying customer could be silently left on `plan = "free"` with no retry and no signal. Signature verification itself is correct; idempotency (unique indexes) is already in place, so retries are safe. | **FIXED** |
| E-3b | HIGH | **A paid Trip Pass could be permanently lost.** `grantTripPass` inserted the ledger row first; if `increment_bonus_trips` then failed, the retry hit the unique violation and returned early — the customer paid €4.99 and never got the pass. | **FIXED** |
| E-4 | MEDIUM | **SSRF in `/api/og/$slug`.** `hero_image_url` is user-writable via the `trips` UPDATE grant; the OG renderer fetched it server-side with no host check, so `http://169.254.169.254/…` was fetched from inside the deployment's network and embedded in the returned PNG. | **FIXED** (host allow-list + no redirects + https-only). The unmetered-CPU half is REPORTED |
| E-5 | MEDIUM | **Trips longer than 14 days were silently truncated.** The client allowed 20 days and said so; the generator caps at 14; the trip header still showed the full range while the itinerary stopped short. **Verified in code** — I had independently found the same mismatch. | **FIXED** |
| E-6 | MEDIUM | **`sitemap.xml` contained zero trip URLs.** It selected `updated_at`, which is not in the anon column grant, so PostgREST rejected the whole query and the error was swallowed by `return []`. Every published itinerary — the organic-acquisition surface — was missing from the sitemap, silently. | **FIXED** |
| E-7 | MEDIUM | Free-plan chat counter was a read-then-write race; message *size* was uncapped (`z.unknown()` × 60). | **FIXED** (both) |
| E-8 | MEDIUM | **Trip coordinates were never saved for AI-generated trips.** `geocodeAndPersistTrip` imports the *browser* Supabase client; called from inside a server function it runs as `anon`, which has no UPDATE grant on `trips`. The failure was swallowed into `console.warn`, and the call was `void`ed so nothing awaited it. | **FIXED** |
| E-9 | LOW | `RLS_FIXES.sql` is still un-applied, so a trip owner can forge their own public view/rating counters via a direct PATCH. | REPORTED |
| E-10 | LOW | Checkout `returnUrl` accepts any origin; `priceId` is not allow-listed. Self-limited (needs the victim's own token). | REPORTED — I wrote the fix, then **reverted it**: see §3 |
| E-11 | LOW | `new Date("YYYY-MM-DD")` is UTC but `.getMonth()` / `toLocaleDateString` are local. Latent on Vercel (UTC); would shift every prompt's month and weekday by a day on a negative-offset runtime. | REPORTED |
| E-12 | LOW | `void writeCache(...)` — the news cache write was never awaited, so on serverless it may never land and every call burns NewsAPI quota (100/day for the whole app). | **FIXED** |
| E-13 | LOW | The demo-trip claim inserts arbitrary client-supplied itinerary JSON as a `ready` trip. Not an XSS vector (verified), but a public-feed spam path. | REPORTED |

Agent 4 also produced a full auth table for all 20 `createServerFn` definitions. **Its conclusion: every server function that touches user-owned data is behind `requireSupabaseAuth`, and no server path passes user input into a service-role query in a way that bypasses an ownership check.** The four unauthenticated ones are deliberately public and read only `is_public = true` rows. The one gap: `listPublicTrips` has no rate limit at all.

### UX / browser testing (run directly, not by an agent)

| # | Sev | Finding | Status |
|---|---|---|---|
| UX-1 | MEDIUM | **The cookie banner physically blocks primary CTAs on a first visit.** Proven causally with `document.elementFromPoint()`: with no consent stored, "Empieza gratis" (`/pricing` @375), "Elegir plan" (`/pricing` @1440) and "Crear mi viaje" (`/explore` @1440) all return the banner as the hit target. With consent pre-set, **zero** blocked controls on every page tested. The banner occupies the bottom 166 px (mobile) / 138 px (desktop) — any control that lands in that band receives the tap. | REPORTED — I built a fix, measured it, found it ineffective, and reverted it. See §3 |
| UX-2 | LOW | `<html lang="es">` is hardcoded in `__root.tsx` and the SSR pass always renders Spanish; the client then detects the browser language and switches. An English visitor sees a Spanish first paint that flips. Confirmed in a real browser (`lang` was `en` under an en-US UA while SSR had sent `es`). | REPORTED — a correct fix needs `Accept-Language` handling in SSR |
| UX-3 | LOW | 6–10 controls per page have a touch target under 44 px; 1–2 per page have no accessible name. | REPORTED |
| UX-4 | LOW | `npm run lint` fails with **1 328 problems — 1 298 of them `prettier/prettier`** on the repo's own config, with the exact prettier version the lockfile pins. Also `swipe.js` at the repo root is unreferenced dead code that fails to parse. | REPORTED — reformatting 1 298 issues would bury this branch's real diff |

**Not blocking, verified clean:** no horizontal overflow at 375 px on any public page; no uncaught JS errors on any public page; all images carry `alt`. (Unsplash and Google Fonts requests fail in this sandbox because of the egress proxy — that is the container, not the product.)

---

## 2. What was fixed, with evidence

Every change below typechecks (`npx tsc --noEmit`, clean) and builds (`npm run build`, passes).

**1. Itinerary images: paying users were getting worse photos than the free demo.** *(found directly, not by an agent)*
`generateItinerary` made `1 + dayCount` separate Unsplash searches (16 for a 14-day trip) against a key with 50 requests/hour for the whole app, with no relevance filter. The public demo had already been fixed for exactly this — its own code comment says the old approach put "the beach of another country" in the header — but the authenticated path was never updated. Now both use `destinationPhotoPool`: one or two calls, photos verified to actually mention the destination, and a destination-tagged fallback.
→ `src/lib/itinerary.functions.ts`

**2. Trips longer than 14 days no longer silently lose days.** The client cap was 20 (`MAX_TRIP_DAYS`) and the copy said "el máximo es de 20 días"; the generator caps at 14. Now there is one shared `MAX_ITINERARY_DAYS = 14` in `itinerary-prompt.ts`, the client uses it, the warning interpolates it so it cannot drift again in four languages, and `CreateTripInput` rejects a longer span server-side.
→ `itinerary-prompt.ts`, `itinerary.functions.ts`, `onboarding.tsx`, 4 locale files

**3. The assistant no longer answers every user in Spanish.** `/api/chat`'s planning prompt hardcoded *"Responde en español"*, and the client never sent a language, so English, French and Portuguese users got Spanish replies. The UI language now travels with each request and the system prompt (and the date formatting) follow it.
→ `assistant.tsx`, `api/chat.ts`

**4. Editing an itinerary no longer translates it to Spanish.** The edit prompt's rule 1 was *"IDIOMA: 100% español peninsular. Prohibido: Breakfast, Lunch, Dinner…"* — one edit rewrote an English itinerary entirely into Spanish. The output-language rules are now a single exported constant shared by generation and editing.
→ `itinerary-prompt.ts` (`ITIN_LANGUAGE_BLOCKS`), `itinerary-edit.functions.ts`, `AssistantEditPanel.tsx`

**5. Editing a trip of more than about a week no longer always fails.** The edit asks the model to re-emit the *entire* itinerary but capped `max_tokens` at 8192, half what generation needs for 14 days — so long trips hit "La respuesta del modelo se truncó" every time, burning one of the 40 daily edits per attempt. Now 16000, matching generation.
→ `itinerary-edit.functions.ts`

**6. Editing no longer wipes the traveller's own notes and checked-off stops.** Those live in the same `trips.itinerary` JSON (`updateActivity`), and the edit merged back only `image_url`. Now `notes` and `completed` are carried across by day + title + place, so an untouched stop keeps what the traveller wrote and a genuinely changed stop starts clean.
→ `itinerary-edit.functions.ts`

**7. Editing no longer discards the traveller's profile.** The edit saw only destination, dates, companion, budget and style — so one edit could turn a celiac, walking-only, hotel-anchored, relaxed-pace itinerary into a generic one. Pace, transport, interests, dietary needs, avoid list, accommodation anchor, first-visit and arrival/departure times are now in the edit prompt, marked as non-negotiable. Reads use `select("*")` like generation, so a missing migration cannot break the query.
→ `itinerary-edit.functions.ts`

**8. The beach guard works for the languages the app ships in, and no longer lies about nine coastal cities.** Exonyms added across es/en/fr/pt; Copenhagen, Stockholm, Oslo, Helsinki, Reykjavik, Dublin, Edinburgh, Venice and Lima removed from the inland list.
**Evidence — the production prompt, regenerated by the real harness, one-line diff:**
```
-2. BEACH — Only include beach or sea activities if Roma genuinely has a coastline …
+2. BEACH — Roma is an inland city — beach, sea or coastal activities … are strictly forbidden.
```
→ `itinerary-shared.ts`, `itinerary-edit.functions.ts`, `scripts/output/roma-primera-vez.prompt.txt`

**9. The free chat quota can no longer be reset by the user.** `/api/chat`'s free branch now uses the same atomic, service-role-only `check_and_increment_rate_limit` RPC the paid branch already used. That removes both the client-writable counter and the read-then-write race in one change, and needs no database deploy to take effect. A migration additionally revokes the client grants and drops the policy on `chat_usage`.
→ `api/chat.ts`, `supabase/migrations/20260827090000_revoke_chat_usage_client_grants.sql`

**10. A chat request can no longer carry unbounded text.** 200 000-character budget on the serialised messages, checked before the model call.
→ `api/chat.ts`

**11. Stripe failures now retry instead of being silently swallowed.** All three subscription writes propagate, so the handler's existing catch returns 500 and Stripe retries for up to three days; the writes are idempotent, so that is safe. For Trip Pass, if the bonus increment fails after the ledger insert, the ledger row is removed so the retry can complete the whole operation instead of short-circuiting on the unique index.
→ `api/public/payments/webhook.ts`

**12. SSRF closed on the OG image endpoint.** `hero_image_url` is now validated against the same image hosts the CSP already allows, https-only, redirects refused.
→ `api/og/$slug.ts`

**13. The sitemap contains published trips again.** Dropped the ungranted `updated_at` column; the query error is logged instead of silently returning an empty list.
→ `routes/sitemap[.]xml.ts`

**14. Trip coordinates are actually saved.** The server path now geocodes only when `createTrip` did not already store coordinates, persists with the authenticated client from the request context, and is awaited with a 4-second cap instead of being fired and forgotten after the response.
→ `itinerary.functions.ts`

**15. The news cache write is awaited**, so it cannot be lost to a frozen serverless instance.
→ `news.functions.ts`

**16. The boarding pass says it is not a boarding pass.** A line inside the card — and therefore inside the downloadable PNG — now reads "Pase decorativo · no es una tarjeta de embarque real", in all four languages.
→ `airport/BoardingPass.tsx`, 4 locale files

**17. English removed from the Spanish UI.** `onboarding.dateStart` / `dateEnd` were the literal strings `"DEPARTURE"` / `"RETURN"` in **all four** locale files, including Spanish. Now localised.
→ 4 locale files

---

## 3. What was not fixed, and why

**Three changes I made and then deliberately reverted.** Reporting them because a reverted fix is still information:

- **Cookie-banner overlay (UX-1).** I added body padding equal to the banner height while it is visible. It applied correctly (measured: `paddingBottom: 178px`) and **changed nothing** — re-running the `elementFromPoint` probe gave byte-identical blocking. Padding at the end of the document cannot move a CTA that sits mid-page under a fixed bottom banner. Leaving an ineffective change in production code is worse than none, so I reverted it. A real fix is a smaller banner or a different placement — a design decision.
- **Checkout `returnUrl` allow-list (E-10).** Enforcing `startsWith(SITE_URL)` would break checkout on any preview deployment where `SITE_URL` points at production — and I cannot test checkout at all here. The finding is self-limited (an attacker needs the victim's own bearer token, so they can only redirect themselves). Not worth an untestable availability risk. The patch is one line if you want it: reject when `SITE_URL` is set and `returnUrl` does not start with it.
- **Nothing else was reverted.**

**Deliberately out of scope** (the brief said not to add features or abstractions beyond what the task requires):

- Traveller headcount, per-person pricing, per-day cost estimates, `duration_min` / `end_time`, per-day `date`, emergency/embassy/insurance blocks, a printable PDF (A1-2, A1-7, A1-8, A1-11, and the "five I would refuse to launch without"). These are schema + DB + UI features, not defects.
- Removing the fake flight number, gate and seat (A1-3). That is a deliberate brand device with a whole `src/components/airport/` family behind it. I made it honest rather than deleting it; deleting it is your call.

**Deliberately not changed because I cannot test the consequence:**

- **The free-plan quota bypass (E-2).** The fix is real — stop counting mutable `trips` rows, increment a service-role-only ledger at the moment the AI call is authorised. But it changes monetisation accounting for every existing user: done wrong it either hands out free generations or locks out paying ones, and I have no database to verify against. This needs your decision on the migration semantics (does everyone's lifetime count restart?) before anyone writes it.
- **Column-scoped grants on `trips` (E-2, E-4, E-9).** Restricting `status` / `hero_image_url` / the rating counters requires revoking the table-wide UPDATE and re-granting an explicit column list. Several server functions write `trips` through the *user's* client, so they are subject to the same grant — an incomplete column list silently breaks sharing, publishing or ratings. Not safe to write blind. `RLS_FIXES.sql` in the repo root is the right starting point; it needs the extra columns from E-2 and E-4 added.
- **Google Places key reuse.** `place-verification.ts` falls back to `VITE_GOOGLE_MAPS_KEY`, and a `VITE_` value is also shipped to the browser — so the billed Places API can be called on your account by anyone who lifts it from the bundle. The fix is a server-only `GOOGLE_PLACES_KEY` and dropping both `VITE_` fallbacks, but doing that blind would silently disable place verification if that is the only key you have set. Change it together with the env var.
- **1 298 prettier violations (UX-4).** Running `npm run format` is a one-command fix, but it would rewrite most of the repo and bury this branch's diff. Do it as its own commit. I confirmed the five files I touched were already unformatted before I touched them, so this branch adds no new violations.

**Not verified at all** — the honest gap list:

1. Every authenticated screen. Signup, onboarding, the generation wait state, the trip page, editing, sharing, tripmates, referrals, the dashboard, profile — none was rendered.
2. All ten of PART 2's critical paths except public pages and the 375 px mobile pass. Specifically: the activation funnel end-to-end, generation quality on three destinations, generation time under 30 s, auth flows (email/password, Google OAuth, reset, confirmation), Google Maps pins and the Leaflet fallback, Trip Pass checkout and subscription upgrade, webhook idempotency against real events, the share dialog and OG image rendering.
3. Whether `supabase/migrations/` matches production. Findings E-1, E-2, E-6 and E-9 rest on replaying 34 migration files in order. A live `\dp public.chat_usage` and `\dp public.trips` would confirm them.
4. Every exploit described. Not one PostgREST call, Stripe webhook or `/api/og` request was issued.
5. The quality of anything the production model actually writes (A1-1).

---

## 4. Cross-referenced findings (flagged by more than one perspective)

Both completed agents independently hit the same three areas, which is why they were fixed first:

- **The assistant edit path** — Agent 1 called it a BLOCKER for destroying traveller data and personalisation; Agent 4 flagged the same function for its silent-failure pattern. Six separate defects, all fixed.
- **The 14-day truncation** — Agent 4 (E-5) and my own reading found it independently; Agent 1 hit the same class from the itinerary side (A1-8, wrong dates on a short response). Fixed.
- **The inland/beach list** — Agent 1 found it dead for Spanish input; the Local Resident lane (mine) found nine cities factually mis-classified on top. Fixed together.

---

## 5. i18n status — better than expected

Measured, not estimated: **es 922 keys, en 922, fr 924, pt 924.** Zero keys missing from any locale relative to Spanish; fr and pt carry two extra language labels. Of 586 static `t()` keys used in `src/`, the 8 that looked missing are all i18next plural forms (`_one` / `_other`) present in every locale — a false positive in my checker, confirmed by inspection.

The real i18n defects were not missing keys but **hardcoded language in server prompts and locale files**: the Spanish-only chat prompt (fixed), the Spanish-only edit prompt (fixed), `"DEPARTURE"`/`"RETURN"` sitting in all four locale files (fixed), and Spanish-only error strings thrown from server functions (`"Viaje no encontrado"`, `"Error Claude 500: …"`) which surface raw to the user in `my-trip.$tripId.tsx` — **reported, not fixed**: `LIMIT_REACHED` is handled and translated, but other server errors render verbatim. Route `<title>` tags are also hardcoded Spanish, which is a defensible SEO choice for the primary market and cannot be localised without SSR language detection (same root cause as UX-2).

---

## 6. Final verdict from each perspective

**Travel Agency Professional — would you sell this today?**
**No, and that has not changed.** The four defects fixed in the edit path were genuine blockers and they are gone, and the beach guard now works. But its own verdict stands on what remains: no headcount, no per-person price, no end times, no booking references, no emergency block, no printable version. The prose quality is genuinely strong — the problem is that a sellable itinerary is an operational document and this is still a very good inspiration document. And the most important thing it found is that **nobody has ever seen what the production model actually produces**: the committed samples are from a different, larger model. Fix that first — everything else is an opinion until then.

**Real Traveler — would you use this for your next trip?**
**Unknown, and I will not fake an answer.** That agent died before reporting, and no authenticated screen was rendered by anyone in this session. What I can say from the browser: the public pages render cleanly, there is no horizontal overflow at 375 px, and there are no JavaScript errors. What no one checked: signup, the wait while your itinerary generates, the trip page, editing, sharing.

**Local Resident — is the content something a local would stand behind?**
**Partly, and now more so than yesterday.** I verified and fixed the destination logic myself: "Roma" is now correctly inland (it was not), and nine genuinely coastal cities are no longer told the sea is forbidden. But the per-venue fact-check — does this restaurant exist, is that tip real local knowledge or dressed-up filler — was not done, and doing it against the committed samples would grade the wrong model. This is the single highest-value thing to run once you have an API key.

**Senior Software Engineer — would you deploy this?**
**Yes, this branch — it is strictly safer than what is live.** One critical quota bypass closed, an SSRF closed, two ways of losing a customer's money closed, the SEO surface restored, and four silent failures made loud. Typecheck and build both pass; public pages verified in a real browser at both breakpoints. But deploy it with eyes open: the free-tier paywall is still bypassable with the dashboard's own Delete button (E-2), `trips` still carries a table-wide UPDATE grant that lets an owner forge their own public ratings (E-9), and none of the payment or auth flows were exercised against a real Stripe or Supabase. **Apply the migration and watch the webhook logs** — it now returns 500 where it used to lie with a 200, so failures that were previously invisible will start showing up. That is the point, but you should be looking.

---

## 7. Merge instructions

The branch is `claude/itineraya-e2e-verification-u46j2n`, pushed to origin. Nothing has been merged.

**Before merging, review these three by eye** — they are the changes with the widest blast radius:
- `src/lib/itinerary-edit.functions.ts` (largest diff: language, token cap, personalisation, notes merge, deduped inland list)
- `src/routes/api/public/payments/webhook.ts` (it now returns 500 where it returned 200 — intended, but it changes Stripe's retry behaviour)
- `src/lib/itinerary-shared.ts` (the destination list: check the nine removals match your product intent)

```bash
# 1. Review the diff
git fetch origin
git checkout claude/itineraya-e2e-verification-u46j2n
git diff origin/main...HEAD

# 2. Verify locally (both pass here)
npm ci                # or: bun install
npx tsc --noEmit
npm run build

# 3. Merge
git checkout main
git pull origin main
git merge --no-ff claude/itineraya-e2e-verification-u46j2n
git push origin main
```

**After merging — required, in this order:**

```bash
# 4. Apply the migration. Without it, chat_usage keeps its client grants.
#    The code fix already works without it; this is defence in depth.
supabase db push        # or run supabase/migrations/20260827090000_revoke_chat_usage_client_grants.sql
```

5. **Deploy**, then watch the Stripe webhook logs for 500s. Any that appear were previously silent data-loss.
6. **Run the quality bench against the real model** — this is the highest-value follow-up in this report:
   ```bash
   ANTHROPIC_API_KEY=… GOOGLE_PLACES_KEY=… \
     node --experimental-strip-types --import ./scripts/register-alias.mjs \
     scripts/generate-test-itinerary.ts scripts/scenarios/roma-primera-vez.json
   ```
   Then have someone who knows Rome read every line of it.

**Not included in this branch, by design:** `package-lock.json` (gitignored — this repo standardises on `bun.lock`; I used npm only because the pinned registry returned 403 in this container) and any prettier reformatting.
