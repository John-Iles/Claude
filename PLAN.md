# Picked — Project Plan

**Brand:** Picked · **Domain:** picked.coffee  
**Stack:** Shopify Basic + Klaviyo. No custom backend.  
**Build mode:** Phase-by-phase. Gate each phase before proceeding.

---

## Scope (this document)

**Phase 0 only — pre-launch waitlist.**  
Full site architecture is documented in the architecture brief and will be built in Phases 1–3.

---

## Phase 0 — Pre-launch Waitlist

**Goal:** Branded coming-soon site on the real Shopify theme, password-protected, with email capture into Klaviyo (double opt-in, GDPR). Seeds the launch audience.

### Sub-phases

| # | Name | Gate |
|---|---|---|
| 0.1 | Store + DNS | `https://picked.coffee` resolves to Shopify; password page visible |
| 0.2 | Theme / brand foundation | `shopify theme push` succeeds; header + footer render, no errors |
| 0.3 | Landing content sections | All sections render at 375px and 1280px; FAQ accordion works natively |
| 0.4 | Klaviyo integration | Test email → pending → confirmed → welcome flow email received; duplicate = silent success |
| 0.5 | SEO / analytics | OG preview valid; Organization + FAQPage JSON-LD pass Rich Results Test; GA4 events fire |
| 0.6 | Consent / legal | Consent banner appears in incognito; reject suppresses GA4; /privacy and /terms render |
| 0.7 | Polish / a11y | Lighthouse mobile ≥ 90 perf / 100 a11y; zero axe critical violations; no CLS |
| 0.8 | Acceptance | All 9 criteria in §6.7 of the brief checked off |

### Acceptance criteria (§6.7)

1. Store live on `picked.coffee` in coming-soon mode; branded landing renders, responsive 320px→desktop, no CLS
2. Waitlist form → Klaviyo list, double opt-in, welcome flow fires, duplicates handled gracefully
3. Manifesto / how-it-works / FAQ / launch-partner tease all present
4. Referral mechanic works if enabled (toggle-controlled)
5. Metadata, OG, Organization + FAQPage schema, sitemap, robots all valid
6. Consent banner + `/privacy` + `/terms` present
7. Analytics funnel firing; no secret keys exposed client-side
8. Theme structured so Phase 1 routes activate without a rebuild (password off → nav toggle → additive sections)
9. `README.md` with setup/deploy steps; `.env.example` complete

---

## Phase 1 — Proof of concept (0–100 subscribers)

*Planned; not yet built.*

- Shopify subscription product (native Subscriptions app, single monthly plan)
- Full site routes active: `/`, `/subscribe`, `/how-it-works`, `/this-month`, `/roasters`, `/manifesto`, `/journal`, `/faq`, `/contact`, `/account`
- Manual CRM feedback (Typeform or personal email)
- One roaster partner, one SKU, 250g letterbox packaging
- Target: 100 paying subscribers + first handoff cohort

---

## Phase 2 — Partnership engine (100–500 subscribers)

*Planned; not yet built.*

- Formalised roaster agreements + featured-month calendar
- Automated Klaviyo feedback + handoff flows
- Referral incentives, tiered subscription
- Roaster case study from Phase 1 used for outreach

---

## Phase 3 — Platform (500+ subscribers)

*Planned; not yet built.*

- Self-serve roaster portal
- Anonymised taste-data product
- Format expansion (two-SKU month, seasonal drops, corporate gifting)

---

## Open decisions (resolve before Phase 1; not blocking Phase 0)

- Final monthly price (£12–15 range)
- Named launch roaster partner (warm 1:1, in parallel with Phase 0)
- Roaster agreement terms: fulfilment cost, packaging standards, referral-fee mechanics
- Whether to activate the refer-to-climb-the-queue mechanic in Phase 0
- Subscription app decision point for Phase 2 (native vs Recharge/Skio)
