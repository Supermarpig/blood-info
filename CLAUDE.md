# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start Next.js dev server
pnpm build        # Production build
pnpm lint         # ESLint (Next.js core-web-vitals + TypeScript)
pnpm updateData   # Scrape blood centers + PTT, output to /data/ and MongoDB
pnpm importReports # Import reports into database
pnpm geocode      # Geocode locations via Google Maps API (requires GOOGLE_MAPS_API_KEY)
```

## Architecture

**Taiwan blood donation info platform** — Next.js 15 App Router, React 19, TypeScript, MongoDB Atlas, Tailwind CSS + shadcn/ui.

### Data flow

Two data sources feed the UI:

1. **Static JSON in `/content/news/`** — health education articles written in JSON with `slug`, `title`, `date`, `author`, `summary`, and `sections` fields. New articles are written here directly (see `/health` skill).
2. **Dynamic donation events in `/data/`** — daily-scraped JSON files (`bloodInfo-YYYYMM.json`) + MongoDB for queries. The GitHub Actions workflow (`.github/workflows/daily-update.yml`) runs daily at 07:40 TW time, executes `scripts/updateData.js` (scrapes blood center sites + PTT Lifeismoney, does OCR via Tesseract.js on images), and auto-creates a PR with updated data files.

### Key directories

- `app/` — Next.js App Router pages. Dynamic routes: `/city/[slug]`, `/region/[slug]`, `/gift/[slug]`, `/news/[slug]`
- `app/api/` — API routes for blood donations, inventory, rooms, and image uploads (Imgur)
- `components/` — React UI components (map via Leaflet, filter panels, modals, inventory panel)
- `lib/` — Config maps: `cityConfig.ts`, `regionConfig.ts`, `giftConfig.ts`; `mongodb.js` for DB connection
- `services/` — Business logic: `bloodService.ts` (donation queries), `reportService.ts`
- `hooks/` — `useNearbyLocations.ts` for geolocation
- `scripts/` — Data pipeline scripts (Node.js, not bundled with Next.js)
- `content/news/` — Static health education article JSON files

### Path alias

`@/*` maps to the repo root (configured in `tsconfig.json`).

### Environment variables

```
NEXT_PUBLIC_BASE_URL      # Public URL for the app
MONGODB_URI               # MongoDB Atlas connection string
IMGUR_CLIENT_ID           # Imgur image hosting
IMGUR_ACCESS_TOKEN
GOOGLE_MAPS_API_KEY       # Geocoding + map tiles
GITHUB_TOKEN              # Reports/wishlist issues (form + admin + importReports)
GITHUB_REPO               # owner/repo for the above
AUTH_SECRET               # Auth.js session secret (`npx auth secret`)
ADMIN_USERNAME            # /admin 後台登入帳號
ADMIN_PASSWORD            # /admin 後台登入密碼
```

### Admin backend (`/admin`)

The admin manages **GitHub Issues** — the same single source of truth as the public flow. The public report form (`/api/reports`) is unchanged: location reports open a `donation-report` issue, wishlist opens a `wishlist` issue; `scripts/importReports.js` then imports `donation-report` issues into `/data`.

- Auth.js v5 (`auth.ts`) credentials login, gated by `middleware.ts`. Login page: `/admin/login`.
- `services/githubIssuesService.ts` wraps the GitHub Issues API (list / parse body / create / edit / open-close); admin routes `/api/admin/reports` (GET list by `label`+`state`, POST create) and `/api/admin/reports/[number]` (PATCH edit fields / open / close) are guarded by `lib/apiAuth.ts`.
- UI tabs (`app/admin/_components/`): 回報審核 (donation-report issues, open/closed, edit + close/reopen), 功能許願 (wishlist issues), 手動新增 (creates a donation-report issue). Closing an issue triggers the existing `notify-contributor` workflow (thank-you email).

## Content (news articles)

Articles in `content/news/` are JSON. The `/health` skill selects an unwritten topic and writes a new article directly into that directory. When adding articles manually, match the existing JSON schema (slug, title, date, author, summary, sections array).
