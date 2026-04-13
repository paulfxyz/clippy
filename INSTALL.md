# Installation & Deployment Guide

This guide covers every way to run or deploy Clippy — from local development to production hosting on various platforms.

---

## Table of Contents

1. [Local Development](#1-local-development)
2. [Building for Production](#2-building-for-production)
3. [Deploy via FTP (SiteGround / cPanel)](#3-deploy-via-ftp-siteground--cpanel)
4. [Deploy to Cloudflare Pages](#4-deploy-to-cloudflare-pages)
5. [Deploy to Vercel](#5-deploy-to-vercel)
6. [Deploy to Netlify](#6-deploy-to-netlify)
7. [Deploy to Fly.io](#7-deploy-to-flyio)
8. [Deploy to GitHub Pages](#8-deploy-to-github-pages)
9. [Docker](#9-docker)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Local Development

### Prerequisites

| Requirement | Minimum | Recommended |
|------------|---------|-------------|
| Node.js | 18.x | 20.x LTS |
| npm | 9.x | 10.x |
| Git | Any | Latest |
| OpenRouter API key | Required | — |

Get an OpenRouter API key at [openrouter.ai/keys](https://openrouter.ai/keys) — it's free to create. You pay per API call (tiny amounts — see cost estimates in README).

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/paulfxyz/clippy.git
cd clippy

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

The dev server starts at `http://localhost:5000`.

The development server is Express + Vite middleware. It does NOT proxy API calls or handle anything server-side — it's a pure static dev server. All OpenRouter calls go directly from your browser.

### What `npm install` installs

Key dependencies:
- `pdfjs-dist` — PDF parsing (runs in browser, not Node)
- `mammoth` — DOCX parsing (runs in browser, not Node)
- `react`, `react-dom` — UI framework
- `@tanstack/react-query` — async state management
- `wouter` — lightweight client-side router
- All `shadcn/ui` component dependencies (Radix UI primitives)
- Tailwind CSS + PostCSS

Dev dependencies:
- `vite` — build tool
- `typescript` — TypeScript compiler
- `@vitejs/plugin-react` — React fast refresh

---

## 2. Building for Production

```bash
npm run build
```

This runs `tsx script/build.ts` which:
1. Builds the frontend with Vite (output: `dist/public/`)
2. Compiles the Express server with esbuild (output: `dist/index.cjs`) — only needed if you want to run the Express dev server in production, which you don't need for static hosting

### Build output

```
dist/
└── public/
    ├── index.html          # Entry point
    └── assets/
        ├── index-[hash].js   # Main React bundle (~800KB gzipped: ~200KB)
        ├── pdf-[hash].js     # pdf.js lazy-loaded chunk
        └── index-[hash].css  # All styles
```

The `dist/public/` folder is **everything you need**. It's entirely self-contained. No Node.js required at runtime.

### Verifying the build locally

```bash
# Install serve globally (one-time)
npm install -g serve

# Serve the build output
serve dist/public -l 4567 --single
```

Then open `http://localhost:4567`.

---

## 3. Deploy via FTP (SiteGround / cPanel)

This is the method used for [clippy.legal](https://clippy.legal).

### Step 1: Build

```bash
npm run build
```

### Step 2: Connect to FTP

Use any FTP client (FileZilla, Cyberduck, or the command-line `ncftp` / `lftp`).

Example with `lftp` (Linux/macOS):

```bash
lftp -u "your-ftp-user,your-password" ftp://your-host.siteground.eu
```

Or with FileZilla:
- Host: `your-host.siteground.eu`
- Username: `ftp@yourdomain.com`
- Password: your FTP password
- Port: `21`

### Step 3: Upload files

Upload the **contents** of `dist/public/` to your webroot (usually `public_html/` or `www/`).

```bash
# With lftp
lcd dist/public
cd public_html
mirror --reverse --delete .
bye
```

The `--delete` flag removes files from the server that no longer exist locally, keeping the deployment clean.

### Step 4: Verify

Navigate to your domain. The app should load. If you get a 404 on navigation, ensure your server is configured to serve `index.html` for all routes (for the hash-based router, this is usually automatic).

### SiteGround-specific notes

- SiteGround's SG Optimizer plugin may aggressively cache JS files. After deployment, purge cache from **Websites → Speed → Caching → Purge Cache**.
- If you're on a shared hosting plan and your domain's webroot is `public_html/`, upload directly there.
- SiteGround supports `.htaccess`. If you need URL rewriting (not required for Clippy's hash router), you can add:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 4. Deploy to Cloudflare Pages

This is the recommended zero-config approach for public hosting.

### From GitHub (automatic deploys)

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Pages** → **Create a project** → **Connect to Git**
2. Select the `paulfxyz/clippy` repository
3. Set build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist/public`
   - **Root directory**: *(leave blank)*
4. Click **Save and Deploy**

Cloudflare Pages will:
- Build automatically on every push to `main`
- Provide a `*.pages.dev` subdomain instantly
- Handle `index.html` fallback routing automatically

### Custom domain

In Pages → your project → **Custom domains** → Add `clippy.legal`. Cloudflare will auto-provision a TLS certificate.

---

## 5. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from the project root
cd clippy
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: your account
# - Link to existing project: N
# - Project name: clippy
# - In which directory is your code: ./
# - Want to modify settings: Y
# - Build command: npm run build
# - Output directory: dist/public
```

For subsequent deploys: `vercel --prod`

### vercel.json (optional, for SPA routing)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Not strictly required since Clippy uses hash-based routing, but good practice.

---

## 6. Deploy to Netlify

### Option A: Drag and drop

1. Build: `npm run build`
2. Go to [app.netlify.com](https://app.netlify.com) → **Sites** → drag the `dist/public/` folder onto the deploy zone

Done. Netlify gives you a live URL immediately.

### Option B: CLI

```bash
npm install -g netlify-cli
netlify deploy --prod --dir dist/public
```

### `_redirects` file (optional)

Create `client/public/_redirects` with:
```
/*    /index.html   200
```

This ensures Netlify serves `index.html` for all routes (useful if you add path-based routing in the future).

---

## 7. Deploy to Fly.io

Use this if you want to run the Express server (e.g., to add server-side features in the future).

### Prerequisites

- `fly` CLI installed: [fly.io/docs/flyctl/install](https://fly.io/docs/flyctl/install/)
- Logged in: `fly auth login`

### Steps

```bash
cd clippy

# Initialize a Fly app (one-time)
fly launch --name clippy-app --region ams --no-deploy

# Build the app
npm run build

# Deploy
fly deploy
```

### Dockerfile for Fly.io

Create `Dockerfile` in the project root:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "dist/index.cjs"]
```

### fly.toml

```toml
app = "clippy-app"
primary_region = "ams"

[build]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

The `auto_stop_machines = true` config means the app sleeps when idle (free tier friendly).

---

## 8. Deploy to GitHub Pages

```bash
# Install gh-pages
npm install --save-dev gh-pages

# Add to package.json scripts:
# "deploy:gh": "npm run build && gh-pages -d dist/public"

npm run deploy:gh
```

Then in your GitHub repo settings → Pages → Source: `gh-pages` branch.

Note: GitHub Pages doesn't support custom domain TLS for `clippy.legal` without a CNAME record pointing to `paulfxyz.github.io`.

---

## 9. Docker

For fully containerized local runs or self-hosting:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/public /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

`nginx.conf`:
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    gzip on;
    gzip_types text/plain text/css application/javascript application/json;
}
```

```bash
docker build -t clippy .
docker run -p 8080:80 clippy
```

---

## 10. Troubleshooting

### "PDF failed to parse"

- Ensure the PDF is not password-protected. pdf.js cannot decrypt encrypted PDFs without the user password.
- Very scanned-only PDFs (images without text layers) will return empty text. Clippy needs machine-readable text.
- If the pdf.js CDN worker fails to load (offline environment), PDF parsing will fail. Use TXT export as a fallback.

### "Model returned invalid JSON"

This occasionally happens with models that ignore the `response_format` instruction. The fallback parser handles most cases. If a model consistently fails, try it alone with a shorter contract first.

### "HTTP 401" from OpenRouter

Your API key is incorrect or has expired. Generate a new one at [openrouter.ai/keys](https://openrouter.ai/keys).

### "HTTP 402" from OpenRouter

Your OpenRouter account has insufficient credits. Top up at [openrouter.ai/credits](https://openrouter.ai/credits).

### "HTTP 429" from OpenRouter

Rate limit hit. This can happen if you're running 8 models simultaneously on a new/free OpenRouter account. Wait a few seconds and retry, or reduce the number of models selected.

### App loads but shows blank screen

- Clear browser cache (hard refresh: ⌘+Shift+R / Ctrl+Shift+R)
- Check the browser console for JavaScript errors
- Ensure the `dist/public/assets/` folder was uploaded correctly (common FTP issue: some clients skip hidden folders or asset subdirectories)

### 404 on page refresh

Not applicable for Clippy (hash-based routing avoids this), but if you've modified the router to use path-based routing, configure your server to serve `index.html` for all routes (see SiteGround `.htaccess` above).
