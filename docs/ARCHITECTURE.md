# FluxFile Architecture

## System Overview

```
                                    ┌─────────────┐
                                    │  Cloudflare  │
                                    │     R2       │
                                    │   (Storage)  │
                                    └──────┬───────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
    ┌─────────▼──────────┐    ┌────────────▼───────────┐    ┌──────────▼──────────┐
    │    Next.js Web      │    │     BullMQ Worker(s)   │    │     PostgreSQL      │
    │    (Vercel)         │    │     (Railway/Docker)    │    │     (Database)      │
    │                     │    │                         │    │                     │
    │  - App Router       │    │  - FFmpeg (audio/video) │    │  - Users            │
    │  - API Routes       │    │  - Sharp (images)       │    │  - Jobs             │
    │  - BetterAuth       │    │  - LibreOffice (docs)   │    │  - Enterprise       │
    │  - Server Actions   │    │  - Progress reporting   │    │  - Audit Logs       │
    └─────────┬───────────┘    └────────────┬───────────┘    └─────────────────────┘
              │                             │
              │         ┌──────────┐        │
              └─────────►  Redis   ◄────────┘
                        │ (Queue)  │
                        └──────────┘
```

## Request Flow: File Conversion

1. **Upload**: Client requests a presigned URL from the web API, then uploads the file directly to R2
2. **Job Creation**: Client calls `POST /api/jobs/create`, which validates the request, creates a database record, and enqueues a BullMQ job
3. **Processing**: A worker picks up the job, downloads the file from R2, converts it using the appropriate tool, and uploads the result back to R2
4. **Polling**: Client polls `GET /api/jobs/{jobId}` for status updates
5. **Download**: Once complete, the API generates a presigned download URL for the converted file

```
Client                Web API              Redis Queue          Worker              R2 Storage
  │                     │                     │                   │                    │
  │ GET presigned URL   │                     │                   │                    │
  │────────────────────>│                     │                   │                    │
  │<────────────────────│                     │                   │                    │
  │                     │                     │                   │                    │
  │ PUT file ──────────────────────────────────────────────────────────────────────────>│
  │                     │                     │                   │                    │
  │ POST /jobs/create   │                     │                   │                    │
  │────────────────────>│ Add job to queue    │                   │                    │
  │                     │────────────────────>│                   │                    │
  │<────────────────────│                     │                   │                    │
  │                     │                     │ Dequeue job       │                    │
  │                     │                     │──────────────────>│                    │
  │                     │                     │                   │ Download input     │
  │                     │                     │                   │───────────────────>│
  │                     │                     │                   │<───────────────────│
  │                     │                     │                   │                    │
  │                     │                     │                   │ [Convert file]     │
  │                     │                     │                   │                    │
  │                     │                     │                   │ Upload output      │
  │                     │                     │                   │───────────────────>│
  │ GET /jobs/{id}      │                     │                   │                    │
  │────────────────────>│                     │                   │                    │
  │<────── status ──────│                     │                   │                    │
  │                     │                     │                   │                    │
  │ GET /download/{id}  │                     │                   │                    │
  │────────────────────>│ Generate presigned URL                  │                    │
  │<── redirect ────────│                     │                   │                    │
  │ GET file ──────────────────────────────────────────────────────────────────────────>│
```

## Monorepo Structure

The project uses **Turborepo** with **pnpm workspaces** to manage multiple apps and shared packages.

### Dependency Graph

```
@fluxfile/web ──┬── @fluxfile/types
                ├── @fluxfile/config
                ├── @fluxfile/db
                ├── @fluxfile/storage
                └── @fluxfile/queue

@fluxfile/worker ──┬── @fluxfile/types
                   ├── @fluxfile/config
                   ├── @fluxfile/db
                   ├── @fluxfile/storage
                   └── @fluxfile/queue

@fluxfile/config ──── @fluxfile/types
@fluxfile/queue ───── @fluxfile/types
@fluxfile/storage ──── (standalone)
@fluxfile/db ────────── (standalone)
@fluxfile/types ─────── (standalone, no deps)
```

## Package Descriptions

### `@fluxfile/types`

Shared TypeScript type definitions. No runtime dependencies. Provides format types (AudioFormat, VideoFormat, etc.), job status types, user/enterprise types, and API request/response interfaces.

### `@fluxfile/config`

Shared configuration constants. Depends on `@fluxfile/types`. Contains the format compatibility matrix, MIME type mappings, account tier limits, worker concurrency settings, queue names, and quality presets.

### `@fluxfile/db`

Prisma ORM layer. Contains the schema definition (User, Session, Job, Enterprise, AuditLog), seed data, and a singleton PrismaClient export.

### `@fluxfile/storage`

Cloudflare R2 client wrapper. Provides functions for generating presigned upload/download URLs, streaming file uploads/downloads, and deleting files. Uses the AWS S3 SDK for R2 compatibility.

### `@fluxfile/queue`

BullMQ configuration. Exports the Redis connection, the `ConversionJobData` type, and the initialized conversion queue with retry strategy and job removal policies.

### `@fluxfile/web`

Next.js 15 frontend application. Uses App Router, Server Components, and Server Actions. Handles authentication via BetterAuth, file upload UI, conversion tracking, dashboard, and settings.

### `@fluxfile/worker`

BullMQ worker application. Listens on the conversion queue, downloads files from R2, converts them using FFmpeg (audio/video), Sharp (images), or LibreOffice (documents), uploads results back to R2, and updates job status in PostgreSQL.

## Worker Conversion Pipeline

Each conversion job goes through these stages:

1. **PENDING** - Job is in the queue waiting for a worker
2. **PROCESSING** - Worker picked up the job
   - Download input file from R2 to temp directory
   - Detect format category (audio/video/image/document)
   - Route to appropriate processor
   - Run conversion with progress tracking
   - Upload output file to R2
3. **COMPLETED** - Output file available for download (24h expiry)
4. **FAILED** - Conversion failed, error classified and stored

### Processor Selection

| Category | Tool                   | Capabilities                                           |
| -------- | ---------------------- | ------------------------------------------------------ |
| Audio    | FFmpeg                 | Format conversion, bitrate/sample rate control         |
| Video    | FFmpeg                 | Format conversion, resolution scaling, codec selection |
| Image    | Sharp                  | Format conversion, resize, quality adjustment          |
| Document | LibreOffice (headless) | PDF/DOCX/XLSX/TXT/CSV conversion                       |

## Database Schema

Key models and their relationships:

- **User** - Has many Jobs, Sessions, Accounts. Belongs to optional Enterprise.
- **Job** - Belongs to optional User. Tracks full conversion lifecycle.
- **Enterprise** - Has many Users and AuditLogs. Stores contract and billing info.
- **Session** / **Account** - BetterAuth authentication models.
- **AuditLog** - Enterprise compliance tracking.

## Security Considerations

- Files are uploaded directly to R2 via presigned URLs (never touch the web server)
- Presigned upload URLs expire after 15 minutes
- Download URLs expire after 24 hours
- Worker runs as non-root user in Docker
- All database queries go through Prisma (SQL injection protection)
- Authentication via BetterAuth with secure session cookies
- Rate limiting based on account tier

## Scaling Strategy

- **Web**: Vercel auto-scales serverless functions
- **Workers**: Scale horizontally by adding more Railway instances, each consuming from the same Redis queue
- **Database**: Managed PostgreSQL with connection pooling
- **Queue**: Redis handles job distribution and deduplication
- **Storage**: R2 scales automatically with zero egress fees
