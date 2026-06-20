# Picked — Shopify Theme (Phase 0)

Pre-launch waitlist landing for [picked.coffee](https://picked.coffee). Built as a minimal Shopify Online Store 2.0 theme — no npm dependencies, no build step.

---

## Prerequisites

- [Shopify CLI v3](https://shopify.dev/docs/api/shopify-cli) — `npm install -g @shopify/cli`
- A Shopify Basic store (create at [shopify.com](https://www.shopify.com))
- A [Klaviyo](https://www.klaviyo.com) account

---

## Local development

```bash
# Authenticate with your store
shopify auth login --store picked.myshopify.com

# Start local dev server (live preview with hot reload)
shopify theme dev --store picked.myshopify.com
```

The CLI opens a preview URL in your browser. Changes to Liquid, CSS, and JS files sync automatically.

---

## Deploy to production

```bash
shopify theme push --store picked.myshopify.com
```

To create a new unpublished theme (safe preview before going live):

```bash
shopify theme push --store picked.myshopify.com --unpublished --theme-name "Picked v1"
```

---

## Klaviyo setup

1. **Create the waitlist list**
   - Klaviyo → Audience → Lists & Segments → Create list
   - Name: `Picked Waitlist`
   - Note the **List ID** (e.g. `AbCdEf`) — you'll need this in Theme settings

2. **Enable double opt-in** (required for GDPR)
   - Open the list → Settings → Double opt-in → On

3. **Get your public API key**
   - Klaviyo → Account → Settings → API Keys
   - Copy the **Public API Key** (6 characters, starts with something like `Pk...`)
   - This is client-safe — it's read-only

4. **Configure in Shopify Theme Editor**
   - Shopify Admin → Online Store → Themes → Customize
   - Theme settings → Klaviyo
   - Paste **Public key** and **List ID**

5. **Build the welcome flow** (after launch)
   - Trigger: "Added to list: Picked Waitlist" (fires after double opt-in confirmed)
   - Email 1: Welcome + manifesto (send immediately)
   - Email 2: "What's coming" tease (send Day 3)
   - If referral mechanic is enabled: include `?ref={{ person.Properties.referral_code }}` in Email 1

---

## Store setup (Shopify Admin)

### Password protection (Phase 0)
Online Store → Preferences → Password protection → Enable

### Domain
Online Store → Domains → Add existing domain → `picked.coffee`

At your DNS registrar, add:
```
Type: CNAME
Name: @  (or www)
Value: shops.myshopify.com
```

SSL is provisioned automatically by Shopify (allow 24–48 hours).

### Legal pages
Create these two pages in Shopify Admin → Pages:
- **Handle:** `privacy` — Title: "Privacy Policy" — content: your privacy policy text
- **Handle:** `terms` — Title: "Terms & Conditions" — content: your T&Cs

The theme templates `page.privacy.json` and `page.terms.json` will render their content automatically.

---

## Theme settings (Theme Editor)

Open: Shopify Admin → Online Store → Themes → Customize

| Setting | Where | What to set |
|---|---|---|
| Logo image | Theme settings → Brand | Upload your logo (SVG/PNG, max 200px wide) |
| Social sharing image | Theme settings → Brand | 1200×630 px OG image |
| Meta description | Theme settings → SEO | 160-char description |
| Klaviyo public key | Theme settings → Klaviyo | 6-char public company ID |
| Waitlist list ID | Theme settings → Klaviyo | List ID from Klaviyo |
| GA4 Measurement ID | Theme settings → Analytics | `G-XXXXXXXXXX` (optional) |
| Instagram / TikTok / Twitter | Theme settings → Social | Your social URLs |
| Cookie consent banner | Theme settings → Consent | On (required for UK/GDPR) |

### Section settings
- **Hero** → Upload a background image (1800×1200 px recommended), edit heading/CTA copy
- **Launch partner** → Toggle "Roaster confirmed" on once the first partner is signed; add name, logo, blurb
- **Waitlist form** → Confirm heading/CTA copy

---

## Phase 1 activation checklist

When ready to go live with the full store:

- [ ] Disable password protection (Online Store → Preferences)
- [ ] Theme settings → Phase flags → turn on `show_nav`
- [ ] Hero section → update CTA label and scroll target to `#subscribe`
- [ ] Waitlist form section → set `visible: false` (or remove from template)
- [ ] Add product `picked-subscription` in Shopify (single monthly selling plan)
- [ ] Create and publish `templates/product.json`, `templates/collection.json`
- [ ] Add Phase 1 sections: `subscribe-cta`, `this-month-feature`, `social-proof`
- [ ] Update `klaviyo_list_id` in Theme settings to the subscriber list
- [ ] Activate post-delivery feedback flow in Klaviyo

---

## Environment variables

Copy `.env.example` → `.env` and fill in values. These are for local CLI use only — never committed, never exposed to the browser. All client-safe keys (Klaviyo public key, GA4 ID) are configured in Theme settings, not in `.env`.

```bash
cp .env.example .env
```

---

## File structure

```
picked/
├── config/            — Theme Editor settings schema + data
├── layout/
│   └── theme.liquid   — Single HTML shell (head, header, main, footer, consent)
├── sections/          — Page sections (each with {% schema %})
├── snippets/          — Reusable partials (seo-head, klaviyo-init, consent-banner, …)
├── templates/         — JSON page templates (OS2 format)
├── assets/            — CSS (tokens, base, per-section) + JS (form, consent, referral)
└── locales/           — UI strings (en.default.json)
```

Zero npm dependencies. Zero build step. Push the folder directly to Shopify.
