# UrbanCare Solution: Design System (Mobile-First)

Use this file as the single source of truth for UI work. Give it to your AI coding tool together with the task prompt.
Tagline: "Your Space | Our Care" · Market: Kharar, Mohali, Sectors 94–111

---

## 0. Scope rules (always apply)

- All layout and visual changes apply **only below 768px** unless a section says otherwise. Desktop (1024px+) must look the same as before, except for color-token corrections.
- Work on a new git branch. No new dependencies. No unrelated refactors.
- Reuse existing components, routes, APIs, service data, booking flow, and the configured Call/WhatsApp numbers. Never invent contact details or hardcode prices.
- Do not copy another brand's colors, images, icons, or copy. Take inspiration from layout patterns only.
- Do not claim "fully responsive" until it has been tested. Report anything that was not tested.

---

## 1. Design principles

1. **Services first.** A user should see search and the first row of services without scrolling on a 360x740 screen.
2. **One action per color.** Orange = booking. Green = structure. Status colors = status only.
3. **Thumb-friendly.** Every tap target is at least 44x44px; primary actions are 52px tall.
4. **Quiet and clean.** White space over borders, 1 accent color, no decorative effects.
5. **Trust through clarity.** Show price, duration, and warranty plainly. No demo or test data in the customer view.

---

## 2. Color tokens

### 2.1 Light theme (default)

```css
:root {
  /* Brand */
  --color-primary: #0D3B2E;        /* header, headings, primary buttons, active chips */
  --color-primary-hover: #0A2E24;
  --color-primary-soft: #E7F3EC;   /* selected tiles, icon backgrounds */

  --color-cta: #F79324;            /* booking actions ONLY */
  --color-cta-hover: #E2810F;
  --color-cta-soft: #FFF4E0;       /* promo highlights, price badges */
  --color-on-cta: #0D3B2E;         /* text on orange. NEVER white */

  /* Neutrals */
  --color-bg: #F7F8F7;
  --color-surface: #FFFFFF;
  --color-border: #E2E6E4;
  --color-text: #202124;
  --color-text-muted: #626B73;

  /* Status */
  --color-success: #15803D;
  --color-warning: #B45309;
  --color-error: #B42318;
  --color-whatsapp: #25D366;       /* WhatsApp icon only, not large buttons */
}
```

### 2.2 Dark theme (optional, add last)

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* mirror in :root[data-theme="dark"] */
    --color-bg: #0B1512;
    --color-surface: #12201B;
    --color-surface-raised: #182A24;
    --color-border: #24382F;
    --color-text: #EAF1EE;
    --color-text-muted: #9DB0A8;
    --color-primary: #3FA882;
    --color-primary-soft: #143026;
    --color-cta: #F79324;
    --color-on-cta: #0D3B2E;
    --color-success: #4ADE80;
    --color-warning: #FBBF24;
    --color-error: #F87171;
  }
}
```

Dark mode rules: no pure black, use borders instead of shadows, keep orange unchanged.

### 2.3 Contrast (WCAG AA needs 4.5:1)

| Pair | Ratio | Result |
|---|---|---|
| Dark green on orange | 5.4 | Pass |
| White on orange | 2.3 | **Fail, never use** |
| White on forest green | 12.5 | Pass |
| Text on background | 15.1 | Pass |
| Muted text on white | 5.4 | Pass |
| White on `#15803D` | 5.0 | Pass |

### 2.4 Color rules

- No hardcoded hex values in components; use the tokens only.
- Max 3 colors per screen: green, orange, neutrals.
- Replace any lavender or purple page tints with `--color-bg`.
- Admin metric tiles use white surfaces with a status accent (dot or number color), not many pastel backgrounds.

---

## 3. Typography

Use the existing project font; fall back to `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`.

| Style | Mobile size / line-height | Weight |
|---|---|---|
| H1 | clamp(1.5rem, 6vw, 1.875rem) / 1.2 | 700 |
| H2 (section) | 1.25rem / 1.3 | 700 |
| H3 (card title) | 1.0625rem / 1.35 | 600 |
| Body | 1rem (16px) / 1.5 | 400 |
| Small | 0.875rem (14px) / 1.45 | 400 |
| Caption / label | 0.8125rem (13px) / 1.4 | 500 |
| Button | 1rem / 1 | 600 |

Rules: inputs are always **16px** (prevents iOS zoom); nothing below 13px; no more than 2 weights per screen; limit lines to about 40 to 60 characters.

---

## 4. Spacing, radius, elevation

- Spacing scale (8px grid): 4, 8, 12, 16, 24, 32, 40
- Page padding: 16px (mobile), 24px (tablet), container max-width 1200px (desktop)
- Radius: chips 999px, buttons 12px, inputs 12px, cards 16px, sheets 20px (top corners)
- Shadow: `0 1px 2px rgba(16,24,20,.06), 0 4px 12px rgba(16,24,20,.06)` for cards only; none on dark theme

---

## 5. Breakpoints

| Name | Range | Notes |
|---|---|---|
| Mobile | 320–767px | Designed first; all new rules live here |
| Tablet | 768–1023px | 2-column grids, wider cards |
| Desktop | 1024px+ | Existing layout, unchanged |

Test widths: 320, 360, 375, 390, 430, 768, 1024, 1440. Support portrait and landscape.

---

## 6. Components

### 6.1 Buttons

| Type | Style | Height |
|---|---|---|
| Primary CTA | bg `--color-cta`, text `--color-on-cta`, radius 12px, full-width on mobile | 52px |
| Secondary | bg transparent, 1.5px `--color-primary` border, text `--color-primary` | 48px |
| Tertiary / link | text `--color-primary`, underline on focus | 44px tap area |
| Icon button | 44x44px, 1px border, 12px radius | 44px |

All buttons need hover, pressed, disabled, and a visible focus ring (`outline: 2px solid var(--color-primary); outline-offset: 2px`).

### 6.2 Customer header (sticky, 56px)

- One row: logo icon (32px) + brand name (truncate with ellipsis, `min-width:0`), compact location pill "Sector 94 ▾", Call and WhatsApp icon buttons (44x44px).
- Hide the tagline below 400px. Nothing may overflow at 320px.
- Add `padding-top: env(safe-area-inset-top)`.
- Call uses the existing `tel:` number; WhatsApp uses the existing configured `wa.me` link.

### 6.3 Search

- Inside the green header block, directly under the header row.
- Height 52px, 16px font, radius 12px, placeholder "Search AC, plumbing, repairs…" (never truncates).
- Search button becomes icon-only below 380px. Enter key submits. Visible focus state.

### 6.4 Chips (filters)

- Single horizontally scrollable row, no wrapping, no visible scrollbar, scroll-snap, edge fade to show more.
- Height 40–44px, 16px side padding, 8px gap. Active = primary background with white text.
- Subcategory chips appear only after a category is selected.

### 6.5 Promo banner

- One card, 16px radius, green gradient (`--color-primary` to `#145A45`).
- Copy: "Services from ₹{min active price} • ₹0 advance • Pay after completion" (price computed from data).
- One orange "Book a Service" button. Use an illustration or icon, not stock photos.

### 6.6 Service category tiles

- 3-column grid, equal squares, surface `--color-bg`, radius 16px, icon on top, 1–2 line label (14px), min tap area 44px.
- Order from a config array: Deep Cleaning, Electrician, Plumber, AC & Appliances, Carpenter, All Services.
- Icons (Lucide or existing set): sparkles, zap, droplets, snowflake, hammer, layout-grid. One consistent style.

### 6.7 Service card (catalogue and popular repairs)

- Short display name (2-line max), rating + duration on one line, bold price "from ₹X", "Add" or "Book" button on the same row as price.
- "What's included" collapsed behind a Details toggle.
- Do not show the "General Repairs" tag. Show the 30-day guarantee once in the trust strip, not on every card.
- Popular repairs: horizontal scroll, only Active services, sorted by price ascending.

### 6.8 Trust strip

- Horizontally scrollable compact cards with check icons: ₹0 Advance · Pay After Completion · Verified Professionals · 30-Day Warranty.
- Text 13–14px. No oversized pills. Preserve claims only if approved and accurate.

### 6.9 Bottom action bar (customer, mobile only)

- Call | WhatsApp | Book Now (primary orange). Height 64px + `env(safe-area-inset-bottom)`.
- Must fit within 100vw (no clipped button). Add matching bottom padding to the page.
- Hide while any input is focused or the keyboard is open, and do not cover modals or cookie notices. Hidden at 768px and above.

### 6.10 Auth bottom sheet (Sign in / Sign up)

- Bottom sheet on mobile: `max-height: 90dvh`, scrollable content, sticky footer with the submit button, safe-area padding.
- Validate on blur and on submit only; never show an error on an untouched empty field.
- Labels all the same size; inputs 16px / 48px; consent checkbox tap area 44px. Keep the DPDP Act consent text.
- Attributes: `inputmode="numeric"` + `autocomplete="tel"` (mobile), `autocomplete="email"`, `new-password`, `current-password`.
- Address is optional at signup and requested at booking. Optional later: mobile OTP login behind a feature flag.

### 6.11 Admin layout (Operations Command)

- Own layout: **no customer header or customer bottom bar** in admin.
- Compact 56px top bar: menu button, one-line truncated title "Operations", user menu.
- Mobile bottom nav: Dashboard, Requests, Assignment, Payments, More (opens the full menu).
- Alerts: one-row items with a count badge and chevron, not big banners.
- Metrics: 4 priority tiles in a 2x2 grid (New Requests, Ready for Assignment, In Progress, Reassignment Required) plus a "More metrics" expander.
- Action queue shows only requests needing action. No completed jobs or "Test" data in it.
- Settings-type information (service radius, auto-dispatch) belongs in Settings, not in the navigation menu.
- Confirm admin routes are protected server-side, not only hidden in the UI.

---

## 7. Page layouts (mobile)

### 7.1 Home
1. Green header block: header row + search
2. Promo banner
3. "Our Services" 3-column tile grid
4. Trust strip
5. Popular repairs (horizontal scroll)
6. Small intro line with the SEO H1 "Trusted Home Repairs in Kharar & Mohali", then the footer with "Serving Sectors 94–111"
7. Fixed bottom action bar

### 7.2 Catalogue
1. One-line H1 + small subtitle
2. Search
3. Category chip row, then subcategory chips (only after selection)
4. Service cards
5. "Post Custom Requirement" as a small secondary link next to the section heading
6. Remove the "Demo Values" banner from the customer view (dev mode and admins only)

### 7.3 Admin dashboard
1. Admin top bar
2. Alert rows
3. 2x2 priority metrics, "More metrics" expander
4. Action queue
5. Financial and quota summary
6. Bottom nav

---

## 8. Accessibility checklist

- Touch targets at least 44x44px (48px preferred for frequent actions)
- Contrast at least 4.5:1 for text, 3:1 for large text and UI components
- Visible focus indicator on every interactive element; logical tab order
- Alt text on images, labels on all inputs, `aria-label` on icon-only buttons
- Respect browser zoom and text enlargement (use rem, no fixed widths)
- `prefers-reduced-motion` respected for any animation
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- Use `100dvh` rather than `100vh`; no layout shift (set image width/height, lazy-load below the fold)

---

## 9. Do and don't

| Do | Don't |
|---|---|
| Use tokens for every color | Hardcode hex values |
| Orange for booking CTAs only | White text on orange |
| Short card names with details one tap away | Repeat "General Repairs" or the warranty on every card |
| Compact status rows | Large stacked banners and 12 pastel tiles |
| Separate admin and customer layouts | Show the customer header in admin |
| Real data from the API | Test data (e.g. "Test1") or demo banners in production |
| Fix the root cause of overflow | Hide it with `overflow-x: hidden` everywhere |

---

## 10. QA before merge

1. Screenshots at 320, 360, 375, 390, 430, 768, 1024, 1440 for Home, Catalogue, Sign in, Sign up, Admin dashboard (save in `/screenshots/after`, compare with `/screenshots/before`).
2. No horizontal scroll on any page.
3. Header, bottom bar, and modals never clip or overlap.
4. Tap targets, font sizes, and contrast verified.
5. Search, booking, Call, WhatsApp, location selector, auth, and admin links all work.
6. Desktop (1280px) screenshots match the "before" set apart from approved color fixes.
7. Existing build, lint, and tests pass; the console has no errors.
8. Final report lists files changed, what passed or failed, and what could not be tested.

---

## 11. Prompt header (paste at the top of every task)

```
Follow UrbanCare_Design_System.md as the single source of truth for colors, typography, spacing, components, and layouts. Apply all layout changes only below 768px; desktop must remain unchanged apart from color-token fixes. Work on branch "mobile-optimization", add no dependencies, reuse existing components and data, and do not invent contact details or prices. Test at 320, 360, 390, 430, 768, 1024 and 1440px and report what you could not test.
```
