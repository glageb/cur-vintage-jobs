# Help Wanted — Vintage Job Cards

A simple façade that turns job listings into short, 1930s–1950s style “want ad” cards so applicants can scan jobs in a fun, low-friction way.

## Setup

1. Copy `.env.example` to `.env` and add your [Adzuna](https://developer.adzuna.com/) credentials:
   ```bash
   cp .env.example .env
   ```
   Then set `VITE_ADZUNA_APP_ID` and `VITE_ADZUNA_APP_KEY` in `.env`.

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Open the URL shown (e.g. http://localhost:5173).

3. Pick a **region** (country), optional **location** and **keyword**, then click **Search**. Results appear as vintage-style cards; use **Apply** to open the full listing.

**Optional — LLM skill extraction:** Skills on each card are first inferred from a static keyword list. For richer, job-specific skills (any role or industry), run the extract-skills server and set `OPENAI_API_KEY` in `.env`:
   ```bash
   # In .env add: OPENAI_API_KEY=your_openai_api_key
   npm run server   # in a second terminal, runs on http://localhost:3001
   npm run dev      # Vite proxies /api/extract-skills to the server
   ```
   Then search as usual; cards will show skills from the LLM after a short delay. If the server is not running or the key is missing, the app falls back to the static skill list.

## Build

```bash
npm run build
npm run preview
```

In production the app calls the Adzuna API from the browser. If you hit CORS limits, run the API through your own backend proxy and point the app at it.

## Stack

- Vite + React + TypeScript
- Adzuna Jobs API (free tier)
- Vintage-inspired UI (Libre Baskerville, newsprint palette, simple cards)
