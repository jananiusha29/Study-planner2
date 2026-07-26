# AI Study Planner

A full-stack study planner with a timetable generator, assignment tracker,
Pomodoro-style study timer, exam countdown, AI-backed study recommendations,
and performance charts — built as a clean **client / server** project.

## Features

- **Timetable generator** — add study blocks by hand, or auto-generate a
  week's schedule that's weighted toward subjects with closer exams and
  more pending assignments (a small proportional-apportionment algorithm
  running server-side).
- **Assignment tracker** — per-subject assignments with due dates, priority,
  and a status you can cycle through (pending → in progress → done).
- **Study timer** — a Pomodoro-style focus/break timer with a circular
  readout; completed sessions are logged automatically per subject.
- **Exam countdown** — every exam, soonest first, with a live days-remaining
  readout that shifts color as the date approaches.
- **AI study recommendations** — a rule-based engine (no setup required)
  ranks your subjects by urgency and explains why. Drop your own Anthropic
  API key into `server/.env` and it upgrades automatically to a short,
  natural-language plan written by Claude.
- **Performance graphs** — daily study-time trend, time-by-subject, and
  assignment-status charts.

## Tech stack

- **Client:** React 18 + Vite, React Router, Recharts, lucide-react icons
- **Server:** Node.js + Express + SQLite (`better-sqlite3`)
- No build step beyond Vite's — nothing to compile by hand.

## Project structure

```
ai-study-planner/
├── client/                     # React + Vite frontend
│   ├── src/
│   │   ├── api/client.js        # fetch wrapper (reads VITE_API_URL)
│   │   ├── components/          # Layout (sidebar nav) + shared UI bits
│   │   ├── pages/                # Dashboard, Subjects, Timetable, Assignments,
│   │   │                         # Timer, Exams, Recommendations, Performance
│   │   └── styles/index.css      # design tokens + all styling
│   ├── vercel.json               # SPA rewrite for Vercel
│   ├── public/_redirects         # SPA rewrite for Netlify
│   └── package.json
├── server/                     # Express + SQLite backend
│   ├── server.js
│   ├── db.js                     # schema + seed data
│   ├── utils/insights.js         # shared urgency-scoring logic
│   ├── routes/
│   │   ├── subjects.js
│   │   ├── timetable.js          # includes POST /generate
│   │   ├── assignments.js
│   │   ├── timer.js
│   │   ├── exams.js
│   │   ├── recommendations.js    # rules engine + optional Claude call
│   │   └── performance.js
│   └── package.json
├── .github/workflows/ci.yml    # installs + builds both folders on push
├── DEPLOYMENT.md               # GitHub + hosting walkthrough
└── README.md
```

## Local setup

**Requires Node.js 18+.**

```bash
# 1. Backend
cd server
npm install
cp .env.example .env      # optionally add ANTHROPIC_API_KEY
npm start                 # http://localhost:4000

# 2. Frontend (in a second terminal)
cd client
npm install
cp .env.example .env      # defaults to http://localhost:4000, fine for local dev
npm run dev                # http://localhost:5173
```

Open **http://localhost:5173**. The database is created automatically at
`server/data/planner.db` on first run, seeded with a few sample subjects
(Mathematics, Physics, Chemistry, English) so the app isn't empty.

## AI recommendations: two modes

- **Rule-based (default, no setup):** `/api/recommendations` scores every
  subject using exam proximity, pending assignment count/urgency, and
  study time over the last 7 days, then returns a templated summary plus
  a per-subject breakdown.
- **Claude-powered (optional):** set `ANTHROPIC_API_KEY` in `server/.env`
  (get one at [console.anthropic.com](https://console.anthropic.com)) and
  the same structured data is sent to Claude to produce a short, specific,
  natural-language plan instead. If the API call fails for any reason, it
  falls back to the rule-based summary automatically — the feature never
  breaks the page.

## API reference

| Method | Route                          | Description                              |
|--------|----------------------------------|-------------------------------------------|
| GET/POST/PUT/DELETE | `/api/subjects[/:id]`     | Manage subjects                          |
| GET/POST/DELETE     | `/api/timetable[/:id]`    | Manage timetable blocks                  |
| POST   | `/api/timetable/generate`         | Auto-generate a weighted week            |
| GET/POST/PUT/DELETE | `/api/assignments[/:id]`  | Manage assignments (`?status=`, `?subject_id=` filters on GET) |
| GET/POST/PUT/DELETE | `/api/exams[/:id]`        | Manage exams                             |
| GET/POST | `/api/timer/sessions`, `/api/timer/today` | Log & read study sessions   |
| GET    | `/api/recommendations`            | AI (or rule-based) study recommendations |
| GET    | `/api/performance/overview?days=` | Chart data for the Performance page      |

## Uploading to GitHub & deploying

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for a full walkthrough: pushing
this repo to GitHub, deploying the backend to Render (or Railway/Fly.io),
and the frontend to Vercel (or Netlify), including the CORS/env wiring
between them.

## Notes

- This is a single-user, local-first app — there's no login. If you deploy
  it publicly and want to restrict access, put the backend behind basic
  auth or add a login layer similar to a typical admin panel.
- SQLite is file-based, so it's ideal for local use and demos. See
  `DEPLOYMENT.md` for notes on persistence when hosting the backend.
