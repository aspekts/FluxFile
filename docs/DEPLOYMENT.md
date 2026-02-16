# FluxFile Deployment Guide

## Architecture Overview

- **Web App** (Next.js): Deployed to Vercel
- **Worker** (Node.js + FFmpeg/LibreOffice): Deployed to Railway via Docker
- **Database** (PostgreSQL): Managed PostgreSQL (e.g., Railway, Supabase, Neon)
- **Cache/Queue** (Redis): Managed Redis (e.g., Railway, Upstash)
- **Storage** (Cloudflare R2): S3-compatible object storage

---

## Web App Deployment (Vercel)

### Setup

1. Connect your GitHub repository to Vercel
2. Set the **Root Directory** to `apps/web`
3. Set the **Framework Preset** to `Next.js`
4. Set the **Build Command** to:
   ```
   cd ../.. && pnpm install && pnpm db:generate && pnpm --filter @fluxfile/web build
   ```
5. Set the **Install Command** to:
   ```
   pnpm install
   ```

### Environment Variables

Set these in the Vercel dashboard:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=fluxfile

BETTER_AUTH_SECRET=<random-secret>
BETTER_AUTH_URL=https://fluxfile.aspekts.dev
RESEND_API_KEY=re_...

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

SENTRY_DSN=https://...@sentry.io/...
NODE_ENV=production
```

### Custom Domain

1. Add `fluxfile.aspekts.dev` as a custom domain in Vercel
2. Configure DNS to point to Vercel's nameservers

### Automated Deployment

The `.github/workflows/deploy-web.yml` workflow automatically deploys to Vercel on pushes to `main` that affect web app or package files.

---

## Worker Deployment (Railway)

### Using Docker Image

The worker runs as a Docker container with FFmpeg, LibreOffice, and other conversion tools pre-installed.

1. Create a new Railway project
2. Add a service from the Docker image
3. Point to the `docker/Dockerfile.worker` in the repository

### Environment Variables

Set these in Railway:

```
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=fluxfile

WORKER_ID=worker-railway-01
WORKER_CONCURRENCY_AUDIO=5
WORKER_CONCURRENCY_VIDEO=2
WORKER_CONCURRENCY_DOCUMENT=5
WORKER_CONCURRENCY_IMAGE=20

NODE_ENV=production
```

### Scaling

To handle more conversions, scale horizontally by adding more worker instances. Each worker automatically picks jobs from the shared Redis queue. Assign unique `WORKER_ID` values to each instance.

### Automated Deployment

The `.github/workflows/deploy-worker.yml` workflow builds the Docker image, pushes to GHCR, and deploys to Railway on pushes to `main` that affect worker or package files.

---

## Database Setup (PostgreSQL)

### Option 1: Railway PostgreSQL

1. Add a PostgreSQL plugin to your Railway project
2. Copy the `DATABASE_URL` from Railway's variables

### Option 2: Neon

1. Create a project at neon.tech
2. Copy the connection string

### Option 3: Supabase

1. Create a project at supabase.com
2. Copy the connection string from Settings > Database

### Migrations

After setting `DATABASE_URL`, run:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed  # Only for initial setup
```

---

## Redis Setup

### Option 1: Railway Redis

1. Add a Redis plugin to your Railway project
2. Copy the `REDIS_URL`

### Option 2: Upstash

1. Create a database at upstash.com
2. Copy the Redis URL (use the `redis://` format, not REST)

---

## Cloudflare R2 Setup

1. Go to Cloudflare Dashboard > R2
2. Create a bucket named `fluxfile`
3. Create an API token with read/write permissions
4. Note down:
   - **Account ID** (from Cloudflare dashboard)
   - **Access Key ID** (from API token)
   - **Secret Access Key** (from API token)
5. Set `R2_ENDPOINT` to `https://<account-id>.r2.cloudflarestorage.com`

### CORS Configuration

Configure CORS on the R2 bucket to allow uploads from your domain:

```json
[
  {
    "AllowedOrigins": ["https://fluxfile.aspekts.dev"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## Monitoring

### Sentry (Error Tracking)

1. Create a Sentry project
2. Set `SENTRY_DSN` in both web and worker environments

### Health Checks

- Web app: Vercel handles health checks automatically
- Worker: Docker `HEALTHCHECK` instruction included in Dockerfile

---

## Production Checklist

- [ ] All environment variables set in Vercel and Railway
- [ ] Database migrations applied
- [ ] R2 bucket created with CORS configured
- [ ] Custom domain configured and DNS propagated
- [ ] Stripe webhooks configured for `fluxfile.aspekts.dev/api/webhooks/stripe`
- [ ] Resend domain verified for `fluxfile.aspekts.dev`
- [ ] Sentry configured for error monitoring
- [ ] Worker instances scaled appropriately
- [ ] SSL/TLS verified on all endpoints
- [ ] Tested a full conversion flow end-to-end
