# Global Track Cargo

A fake/demo shipment tracking site for showcasing how a tracking experience
works — not connected to any real courier. Two parts:

- **Admin panel** (`/admin`) — password-protected. Create, edit, hold/resume,
  and delete shipments.
- **Public tracker** (`/` and `/track/:trackingNumber`) — anyone with a
  tracking number can see a live-updating map and shipment details.

Built with **React + Vite** (no Next.js, no 3D libraries) so it stays light
enough to run comfortably on a 4GB RAM machine. The moving "airplane" is a
plain SVG element animated with React state — no Three.js, no WebGL.

---

## 1. Tech stack

- React 18 + Vite 5 (frontend)
- React Router (client-side routing)
- Express (tiny local API server — the only thing holding your Supabase
  service role key, so it never reaches the browser)
- Supabase (Postgres database + image storage)
- Plain CSS (no Tailwind/PostCSS build step, keeps things light)
- Lightweight inline SVG world map (no map tile libraries)

No 3D rendering, no animation libraries beyond CSS transitions and basic
`setInterval` ticks.

---

## 2. Set up Supabase (one-time)

1. Create a free project at [supabase.com](https://supabase.com).
2. In your project dashboard, go to **SQL Editor → New Query**.
3. Open `supabase_schema.sql` from this project, copy all of it, paste it
   into the SQL editor, and click **Run**. This creates all 4 tables
   (`shipments`, `shipment_images`, `shipment_status_history`,
   `geocode_cache`), enables Row Level Security with public-read policies,
   and creates the `shipment-images` storage bucket.
4. Go to **Project Settings → API**. You'll need two values:
   - **Project URL** (e.g. `https://abcd1234.supabase.co`)
   - **service_role key** (under "Project API keys" — click reveal). This
     key is secret; never share it or commit it.

---

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```
VITE_SUPABASE_URL=[https://your-project-ref.supabase.co](https://your-project-ref.supabase.co/)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-admin-password
API_PORT=
```

`ADMIN_PASSWORD` is the single shared password that gates `/admin` — there's
no real user account system, just one password (by design, per the brief).

---

## 4. Install and run

```bash
npm install
npm run dev
```

This starts **two processes together** (frontend + API server):
- Vite dev server at `http://localhost:5173` (the site you open in a browser)
- Express API at `http://localhost:8787` (Vite proxies `/api/*` requests to
  it automatically — you never need to open this URL directly)

Should be ready in well under 10 seconds on most machines. Open
`http://localhost:5173` in your browser.

- Public tracker: `http://localhost:5173/`
- Admin panel: `http://localhost:5173/admin` (you'll be redirected to
  `/admin/login` first)

---

## 5. How the tracking animation works

Every shipment stores `created_at` and `estimated_delivery`. The progress
shown on the map is calculated as:

```
progress = (now - created_at - total_held_seconds) / (estimated_delivery - created_at)
```

clamped between 0 and 1, recalculated every second in the browser (no
server round-trip needed for the ticking animation itself — just plain
JavaScript math against the clock).

**Progress speed** (slow / medium / fast) does not change *when* a shipment
arrives — every shipment still reaches 100% exactly at its estimated
delivery time. It only changes the *shape* of the motion: fast shipments
cover ground quickly at first and ease in near the end, slow shipments
creep at first and rush near the end, medium eases smoothly throughout.

**Hold / Resume**: clicking "Hold" in the admin panel records `held_at`
(when the hold started) and freezes the progress calculation. Clicking
"Resume" adds the elapsed hold duration to `total_held_seconds` (a running
total) and clears `held_at`. Because the formula subtracts held time from
elapsed time, the shipment continues from exactly where it paused — it
doesn't jump forward to "catch up" to the original schedule.

---

## 6. Project structure

```
shiptrack/
├── server/                  # Tiny Express API (holds the Supabase service key)
│   ├── index.js             # Server entry point
│   ├── supabaseAdmin.js     # Service-role Supabase client
│   ├── authStore.js         # Simple in-memory session tokens
│   ├── trackingNumber.js    # Tracking code generator
│   └── routes/
│       ├── auth.js          # POST /api/auth/login
│       ├── shipments.js     # CRUD + hold/resume + public lookup
│       ├── images.js        # Image upload to Supabase Storage
│       └── geocode.js       # Place name -> lat/lng, with caching
│
├── src/                     # React frontend
│   ├── main.jsx, App.jsx    # Entry point + routes
│   ├── lib/
│   │   ├── api.js           # fetch() wrapper for the Express API
│   │   └── progress.js      # Shared progress-calculation math
│   ├── components/
│   │   ├── WorldMap.jsx     # Lightweight SVG map + animated marker
│   │   ├── CheckpointStrip.jsx
│   │   ├── ImageUploader.jsx
│   │   ├── FormFields.jsx
│   │   └── StatusBadge.jsx
│   └── pages/
│       ├── TrackHome.jsx    # "/" — enter tracking number
│       ├── TrackResult.jsx  # "/track/:trackingNumber"
│       └── admin/           # "/admin/*" — login, list, new, detail
│
├── supabase_schema.sql      # Run once in Supabase SQL Editor
├── .env.example
└── vite.config.js
```

---

## 7. Notes on the world map

Per the brief, this uses a **simplified, stylized 2D SVG map** — soft
continent shapes (not precise borders), a curved dashed route between
origin and destination, and an animated dot marker. It's deliberately not
a real geographic dataset or mapping library (like Leaflet or Mapbox),
which keeps the bundle small and avoids any tile-loading network calls
beyond the one-time geocoding lookup when a shipment is created.

Geocoding (turning "Lagos, Nigeria" into coordinates) uses the free
OpenStreetMap Nominatim API and caches results in the `geocode_cache`
table, so the same place name is never looked up twice.

---

## 8. Production build

```bash
npm run build
```

Outputs static files to `dist/`. You'll still need to run the Express
server (`server/index.js`) somewhere reachable — e.g. a small Node host —
since it holds the Supabase service role key and proxies admin writes.
Point your static host's `/api` routes at wherever you deploy that server.
