# Proposal: Closer to Vintage Newspaper Visual

Changes to align the app with the newspaper-style mockup and reference card design.

---

## 1. Page & background

| Change | Detail |
|--------|--------|
| **Warmer newsprint** | Slightly warmer cream for `--newsprint` and `--card-bg` (e.g. `#f0ebe0`, `#f8f4eb`) so it feels more like old paper. |
| **Column rules** | Thin vertical line between the 3 columns (`column-rule: 1px solid var(--border)`) so columns read like a newspaper. |
| **Section header above cards** | Add a “HELP WANTED” (or “Situations Wanted”) line above the card list: small caps, serif, with a double rule under it. |

---

## 2. Card structure (match reference layout)

| Element | Current | Proposed |
|---------|---------|----------|
| **Title** | Plain text, very small (0.72rem) | Slightly larger (e.g. 1rem), bold serif, default case. |
| **Company** | Plain text (0.54rem) | Slightly larger (e.g. 0.85rem), muted, default case. |
| **Salary row** | Coins icon + plain text | Coins icon + **salary in a dark pill** (background `var(--ink)`, white text, rounded), like the reference. |
| **Posted date** | Not shown | Add **“WIRED ON: YYYY-MM-DD”** under salary when we have `created` from Adzuna (new field + mapping). |
| **Divider** | None | **Double horizontal rule** (two thin lines) between salary/date and description. |
| **Description** | Only when snippet differs | Short **description excerpt** (strip HTML, ~120 chars) with small “Introduction” or document icon above it. |
| **Footer** | Location + “See ad” link | **Location on the left**, **“APPLY” as a solid dark button** on the right (same style as Search button). |
| **Border** | 1px solid ink | Keep; optional very subtle inner shadow so cards look like clipped paper. |

---

## 3. Typography & readability

| Change | Detail |
|--------|--------|
| **Title size** | 0.72rem → **~1rem** so it’s readable but still “reduced” vs a big headline. |
| **Company size** | 0.54rem → **~0.85rem** (proportional to title). |
| **Card font** | Use **Libre Baskerville** (or existing serif) for all card text. |
| **“WIRED ON” / “APPLY”** | Small caps or letter-spacing for a period feel (optional). |

---

## 4. Data & API

| Change | Detail |
|--------|--------|
| **Posted date** | Add `posted?: string` (e.g. `created?.slice(0, 10)`) to `JobCard` and show “WIRED ON: {posted}” on the card. |
| **Description excerpt** | Add `descriptionExcerpt?: string` to `JobCard`; in Adzuna mapping, strip HTML from `description` and take first ~120 chars + “…” for the card. |
| **Salary pill** | Use existing `salaryDisplay`; only the **presentation** changes (pill style). |

---

## 5. Layout (keep, small tweaks)

| Change | Detail |
|--------|--------|
| **3 columns** | Keep `column-count: 3` and responsive 2/1 columns. |
| **Column rule** | As in section 1. |
| **Card sizes** | Keep tall/short variants; optionally make “tall” cards a bit taller (e.g. 18rem) so the mix feels more like the proposal. |

---

## 6. Implementation order

1. **CSS variables & page** – Warmer newsprint/paper colours; column-rule; optional “HELP WANTED” header above cards.
2. **Card CSS** – Salary pill, double rule, footer (location left + APPLY button right), readable title/company sizes.
3. **JobCard.tsx** – Restructure: title → company → salary row (icon + pill) → “WIRED ON” (when `posted`) → double rule → description excerpt → footer (location + APPLY button).
4. **Types + Adzuna** – Add `posted` and `descriptionExcerpt` to `JobCard` and populate in `adzuna.ts`.

---

## Summary

- **Page:** Warmer paper colours, column rules, optional “HELP WANTED” header.
- **Cards:** Salary in a dark pill, “WIRED ON” date, double rule, description excerpt, footer with location + solid APPLY button; slightly larger title/company.
- **Data:** `posted` and `descriptionExcerpt` on the card model and from Adzuna.

No new dependencies; only CSS, [JobCard.tsx](src/JobCard.tsx), [App.css](src/App.css), [index.css](src/index.css), [types.ts](src/types.ts), and [api/adzuna.ts](src/api/adzuna.ts).
