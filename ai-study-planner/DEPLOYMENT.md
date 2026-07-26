# Uploading to GitHub & Deploying

## 1. Install once locally (so lock files exist before you commit)

```bash
cd server && npm install && cd ..
cd client && npm install && cd ..
```

This generates `package-lock.json` in both folders — commit those along with
everything else so CI and your hosting provider install the exact same
dependency versions you tested with.

## 2. Push to GitHub

1. Create a new **empty** repository on GitHub (skip the README/.gitignore/license
   options — this project already has them).
2. From the project root:

   ```bash
   git init
   git add .
   git commit -m "Initial commit: AI Study Planner"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

A CI workflow at `.github/workflows/ci.yml` will automatically install both
`server/` and `client/`, syntax-check the API, and build the frontend on
every push — check the **Actions** tab on GitHub after pushing.

## 3. Deploy the backend (`server/`) — Render

1. Go to [render.com](https://render.com) → **New +** → **Web Service** → connect your GitHub repo.
2. **Root directory:** `server`
3. **Build command:** `npm install`
4. **Start command:** `npm start`
5. Add environment variables (from `server/.env.example`):
   - `CLIENT_ORIGIN` — set this after step 4 once you know your frontend URL
   - `ANTHROPIC_API_KEY` — optional, only if you want Claude-powered recommendations
   - Render sets `PORT` automatically; the app already reads `process.env.PORT`
6. Deploy, then copy the resulting URL (e.g. `https://your-app.onrender.com`).

**On SQLite persistence:** Render's free web services use an ephemeral
filesystem, so the SQLite file resets on every redeploy or restart. That's
fine for a demo or class project. For anything longer-lived, either add a
[persistent disk](https://render.com/docs/disks) mounted at `server/data`
on a paid plan, or swap SQLite for a hosted database (e.g. Postgres) —
[Railway](https://railway.app) and [Fly.io](https://fly.io) are good
alternatives that make persistent volumes easier to attach.

## 4. Deploy the frontend (`client/`) — Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the same repo.
2. **Root directory:** `client`
3. Framework preset: **Vite** (auto-detected)
4. Environment variable: `VITE_API_URL` = the Render URL from step 3 (no trailing slash)
5. Deploy.

`client/vercel.json` already includes the rewrite rule that keeps client-side
routes (like `/timetable` or `/insights`) working on refresh.

*(Deploying to Netlify instead? The same steps apply — root directory
`client`, build command `npm run build`, publish directory `dist`,
same `VITE_API_URL` variable. `client/public/_redirects` handles the
SPA routing there.)*

## 5. Connect the two

Go back to your Render service → environment variables → set
`CLIENT_ORIGIN` to your exact Vercel URL (e.g. `https://your-app.vercel.app`,
no trailing slash) → save, which triggers a redeploy. This is what allows
the backend's CORS policy to accept requests from your deployed frontend.

## Local development recap

Two terminals, run from the project root:

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

Frontend: http://localhost:5173 · Backend: http://localhost:4000
