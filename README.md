# SteamClock — Next Steam Sale Countdown & History

Live countdown to the next Steam seasonal sale, official 2026–2027 fest schedule, multi-year Steam sales history archive, and sale budget planner.

---

## Run Locally

**Prerequisites:** Node.js (v18+ or v20+ recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## Deploy to Netlify

This project is fully configured for Netlify hosting out of the box.

### Option 1: Continuous Deployment via Git (Recommended)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. In the [Netlify Dashboard](https://app.netlify.com), click **Add new site** > **Import an existing project**.
3. Select your repository.
4. Netlify will automatically detect [`netlify.toml`](file:///C:/Users/dumia/antigravity/SteamClock-—-Next-Steam-Sale-Countdown-&-History/netlify.toml):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Node version:** `20`
5. Click **Deploy site**.

### Option 2: Manual Deploy via Netlify CLI
To deploy directly from your local terminal:
```bash
# Build the production bundle
npm run build

# Deploy to production
npx netlify deploy --prod --dir=dist
```

### Netlify Configuration Included
- **[`netlify.toml`](file:///C:/Users/dumia/antigravity/SteamClock-—-Next-Steam-Sale-Countdown-&-History/netlify.toml)**:
  - Validated against Netlify's JSON Schema (`$schema = "https://open-api.netlify.com/netlify.schema.json"`).
  - `[[redirects]]` SPA history fallback rule (`/*` → `/index.html 200`) ensuring direct visits to subpaths or URL parameters (e.g. `?sale=...`) load seamlessly without 404s.
  - `[[headers]]` for HTTP cache-control (1-year immutable caching for Vite assets, stale-while-revalidate for illustrations) and modern security headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`).
- **[`public/_redirects`](file:///C:/Users/dumia/antigravity/SteamClock-—-Next-Steam-Sale-Countdown-&-History/public/_redirects)**:
  - Automatically copied to `dist/_redirects` by Vite during build, providing redundant SPA rewrite protection across all Netlify deploy pipelines (Git, CLI, and Drag & Drop).
- **[`.gitignore`](file:///C:/Users/dumia/antigravity/SteamClock-—-Next-Steam-Sale-Countdown-&-History/.gitignore)**:
  - Includes `.netlify/` to prevent committing local CLI state and credentials.
