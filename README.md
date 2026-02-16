# FluxFile - Universal File Converter

A premium, web-based universal file converter with enterprise features, built with modern web technologies and designed for scale.

## 🚀 Features

- **Universal Conversion**: Audio, Video, Documents, and Images
- **Enterprise-Ready**: Team management, audit logs, SSO support
- **Zero-Knowledge Privacy**: Files encrypted and auto-deleted after 24 hours
- **Real-time Progress**: Live conversion tracking via WebSocket
- **Scalable Architecture**: Serverless frontend, distributed workers
- **Cost-Optimized**: Cloudflare R2 for zero-egress storage costs

## 📦 Tech Stack

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Auth**: BetterAuth with Resend email
- **Database**: PostgreSQL + Prisma ORM
- **Queue**: BullMQ + Redis
- **Storage**: Cloudflare R2 (S3-compatible)
- **Workers**: Node.js + Docker (FFmpeg, LibreOffice, Sharp, Tesseract)
- **Payments**: Stripe
- **Monitoring**: Sentry + Axiom

## 🏗️ Project Structure

```
fluxfile/
├── apps/
│   ├── web/              # Next.js frontend (Vercel)
│   └── worker/           # Conversion workers (Railway/Docker)
├── packages/
│   ├── db/               # Prisma schema + migrations
│   ├── queue/            # BullMQ shared config
│   ├── storage/          # R2 client wrapper
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── docker/               # Docker configs
├── docs/                 # Documentation
└── .github/workflows/    # CI/CD pipelines
```

## 🚦 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16+
- Redis 7+
- Cloudflare R2 account (or S3-compatible storage)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd fluxfile
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Setup environment variables**:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit apps/web/.env.local with your credentials
   ```

4. **Setup database**:
   
   **Option A: Using Docker Compose (Recommended)**
   ```bash
   docker-compose -f docker/docker-compose.yml up -d postgres redis
   ```

   **Option B: Native Installation**
   - Install PostgreSQL 16 and Redis 7
   - Create database: `createdb fluxfile`
   - Start Redis: `redis-server`

5. **Run database migrations**:
   ```bash
   pnpm db:migrate
   pnpm db:seed
   ```

6. **Start development server**:
   ```bash
   pnpm dev
   ```

7. **Open browser**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Database Studio: `pnpm db:studio`

## 🛠️ Development

### Available Commands

```bash
# Development
pnpm dev                  # Start all apps in dev mode
pnpm build                # Build all apps
pnpm lint                 # Lint all apps
pnpm format               # Format code with Prettier
pnpm type-check           # TypeScript type checking

# Database
pnpm db:migrate           # Run database migrations
pnpm db:generate          # Generate Prisma client
pnpm db:seed              # Seed development data
pnpm db:studio            # Open Prisma Studio

# Worker
pnpm worker:dev           # Start worker in dev mode

# Testing
pnpm test                 # Run tests
```

### Development Credentials

After running `pnpm db:seed`, you can login with:

- **Admin**: `admin@fluxfile.aspekts.dev`
- **Free User**: `user@example.com`
- **Enterprise User**: `enterprise@example.com`

## 📚 Documentation

- [Product Requirements Document](./docs/PRD.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)

## 🚀 Deployment

### Web App (Vercel)

```bash
# Deploy to production
vercel --prod
```

### Worker (Railway)

```bash
# Deploy worker
railway up --service worker
```

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## 🔒 Security

- All files encrypted at rest (AES-256)
- TLS 1.3 enforced for all connections
- Automatic malware scanning (ClamAV)
- Files auto-deleted after 24 hours
- Zero-knowledge processing

## 📊 Supported Formats

### Audio
MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS

### Video
MP4, MOV, WEBM, AVI, MKV, FLV, WMV

### Documents
PDF, DOCX, XLSX, PPTX, TXT, ODT, RTF, CSV

### Images
PNG, JPG, WEBP, HEIC, SVG, TIFF, BMP, GIF, ICO

## 🎯 Roadmap

- [ ] Phase 1: Core conversion engine
- [ ] Phase 2: User authentication & dashboard
- [ ] Phase 3: Enterprise features
- [ ] Phase 4: Payment integration
- [ ] Phase 5: WebSocket real-time updates
- [ ] Phase 6: Production deployment

## 📝 License

Proprietary - All rights reserved

## 🤝 Contributing

This is a private project. Contact the team for contribution guidelines.

## 📧 Contact

- **Production**: fluxfile.aspekts.dev
- **Support**: support@aspekts.dev
- **Sales**: sales@aspekts.dev
