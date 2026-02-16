# FluxFile Development Guide

## Prerequisites

- **Node.js** 20+
- **pnpm** 8.15.0+
- **Docker** and **Docker Compose** (for PostgreSQL and Redis)
- **FFmpeg** (for audio/video conversion during local worker dev)
- **LibreOffice** (for document conversion during local worker dev)

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd fluxfile
pnpm install
```

### 2. Environment Variables

Copy the example env files and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/worker/.env.example apps/worker/.env
```

Required variables for local development:

| Variable               | Description                  | Default                                                  |
| ---------------------- | ---------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/fluxfile` |
| `REDIS_URL`            | Redis connection string      | `redis://localhost:6379`                                 |
| `R2_ENDPOINT`          | Cloudflare R2 endpoint       | Your R2 endpoint                                         |
| `R2_ACCESS_KEY_ID`     | R2 access key                | Your access key                                          |
| `R2_SECRET_ACCESS_KEY` | R2 secret key                | Your secret key                                          |
| `R2_BUCKET_NAME`       | R2 bucket name               | `fluxfile`                                               |
| `BETTER_AUTH_SECRET`   | BetterAuth signing secret    | Generate a random string                                 |
| `BETTER_AUTH_URL`      | BetterAuth base URL          | `http://localhost:3000`                                  |
| `RESEND_API_KEY`       | Resend email API key         | Your Resend key                                          |

### 3. Start Infrastructure Services

```bash
docker-compose -f docker/docker-compose.yml up -d
```

This starts:

- **PostgreSQL 16** on port 5432
- **Redis 7** on port 6379

### 4. Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed development data
pnpm db:seed
```

### 5. Start Development

```bash
# Start all apps (web + worker)
pnpm dev

# Or start individually:
pnpm --filter @fluxfile/web dev      # Web app on port 3000
pnpm --filter @fluxfile/worker dev   # Worker process
```

## Project Structure

```
fluxfile/
├── apps/
│   ├── web/                # Next.js 15 frontend
│   │   ├── app/            # App Router pages and API routes
│   │   ├── components/     # React components
│   │   └── lib/            # Utility functions
│   └── worker/             # BullMQ conversion worker
│       ├── src/
│       │   ├── processors/ # Format-specific processors
│       │   ├── services/   # FFmpeg, Sharp, LibreOffice wrappers
│       │   └── utils/      # Helper utilities
│       └── Dockerfile
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── config/             # Shared configuration constants
│   ├── db/                 # Prisma schema and client
│   ├── storage/            # Cloudflare R2 wrapper
│   └── queue/              # BullMQ queue configuration
├── docker/
│   ├── docker-compose.yml  # Local dev services
│   └── Dockerfile.worker   # Worker production image
└── docs/                   # Documentation
```

## Common Development Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm build                  # Build all packages
pnpm type-check             # TypeScript type checking
pnpm lint                   # Lint all code
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting

# Database
pnpm db:generate            # Regenerate Prisma client
pnpm db:migrate             # Run pending migrations
pnpm db:seed                # Seed development data
pnpm db:studio              # Open Prisma Studio GUI

# Worker
pnpm worker:dev             # Start worker in watch mode
```

## Development Accounts

After running `pnpm db:seed`, these accounts are available:

| Email                        | Role       | Tier       |
| ---------------------------- | ---------- | ---------- |
| `admin@fluxfile.aspekts.dev` | ADMIN      | PRO        |
| `user@example.com`           | USER       | FREE       |
| `enterprise@example.com`     | ENTERPRISE | ENTERPRISE |

## Adding a New Conversion Format

1. Add the format type in `packages/types/src/formats.ts`
2. Add MIME type mapping in `packages/config/src/formats.ts`
3. Update the compatibility matrix in `packages/config/src/formats.ts`
4. Add quality presets in `packages/config/src/quality-presets.ts` if needed
5. Add processor logic in the appropriate `apps/worker/src/processors/` file

## Workspace Package Dependencies

The monorepo uses pnpm workspaces. Internal packages are referenced with `workspace:*`:

```json
{
  "dependencies": {
    "@fluxfile/types": "workspace:*",
    "@fluxfile/config": "workspace:*",
    "@fluxfile/db": "workspace:*"
  }
}
```

Turborepo handles the build order based on the dependency graph defined in `turbo.json`.

## Troubleshooting

### Prisma client not found

```bash
pnpm db:generate
```

### Docker services won't start

```bash
docker-compose -f docker/docker-compose.yml down -v
docker-compose -f docker/docker-compose.yml up -d
```

### Worker can't find FFmpeg

Install FFmpeg locally:

- **macOS**: `brew install ffmpeg`
- **Ubuntu**: `sudo apt install ffmpeg`
- **Windows**: Download from https://ffmpeg.org/download.html

### Port conflicts

Default ports: PostgreSQL (5432), Redis (6379), Web (3000). Update `docker-compose.yml` or app configs if these are in use.
