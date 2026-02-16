# FluxFile API Documentation

Base URL: `https://fluxfile.aspekts.dev` (production) or `http://localhost:3000` (development)

## Authentication

FluxFile uses BetterAuth for authentication. Auth endpoints are handled via the catch-all route at `/api/auth/[...betterauth]`.

### Sign Up

```
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

### Sign In

```
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Sign Out

```
POST /api/auth/signout
```

### Get Session

```
GET /api/auth/session
```

Returns the current user session or `null` if not authenticated.

---

## File Upload

### Get Presigned Upload URL

Request a presigned URL to upload a file directly to Cloudflare R2.

```
POST /api/upload/presigned-url
Content-Type: application/json

{
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576
}
```

**Response:**

```json
{
  "uploadUrl": "https://r2.cloudflarestorage.com/...",
  "fileKey": "uploads/abc123/document.pdf"
}
```

**Errors:**

- `400` - Invalid file type or size
- `429` - Daily quota exceeded

### Complete Upload

Notify the server that a file upload to R2 is complete.

```
POST /api/upload/complete
Content-Type: application/json

{
  "fileKey": "uploads/abc123/document.pdf",
  "filename": "document.pdf",
  "contentType": "application/pdf",
  "fileSize": 1048576
}
```

---

## Conversion Jobs

### Create Job

Start a new file conversion job.

```
POST /api/jobs/create
Content-Type: application/json

{
  "inputFileKey": "uploads/abc123/document.pdf",
  "inputFormat": "pdf",
  "outputFormat": "docx",
  "inputFileSize": 1048576,
  "qualityPreset": "standard"
}
```

**Quality Presets:** `low`, `standard`, `high`, `original`

**Response:**

```json
{
  "jobId": "clxyz123...",
  "status": "PENDING"
}
```

**Errors:**

- `400` - Invalid format conversion (e.g., audio to image)
- `403` - Quota exceeded
- `413` - File too large for account tier

### Get Job Status

Poll for job status and progress.

```
GET /api/jobs/{jobId}
```

**Response:**

```json
{
  "id": "clxyz123...",
  "status": "PROCESSING",
  "progress": 65,
  "currentStage": "Converting",
  "inputFormat": "pdf",
  "outputFormat": "docx",
  "inputFileSize": 1048576,
  "outputFileSize": null,
  "downloadUrl": null,
  "createdAt": "2025-01-15T10:30:00Z",
  "completedAt": null
}
```

**Job Statuses:**

| Status       | Description                             |
| ------------ | --------------------------------------- |
| `PENDING`    | Job queued, waiting for a worker        |
| `SCANNING`   | File being scanned for malware          |
| `PROCESSING` | Conversion in progress                  |
| `COMPLETED`  | Conversion finished, download available |
| `FAILED`     | Conversion failed                       |
| `CANCELLED`  | Job cancelled by user                   |
| `EXPIRED`    | Download link expired                   |

When `status` is `COMPLETED`, the response includes a `downloadUrl` field.

### Cancel Job

Cancel a pending or in-progress job.

```
POST /api/jobs/{jobId}/cancel
```

**Response:**

```json
{
  "success": true,
  "status": "CANCELLED"
}
```

---

## Download

### Download Converted File

Download the converted file. Available for 24 hours after conversion completes.

```
GET /api/download/{jobId}
```

Returns a redirect to the presigned R2 download URL.

**Errors:**

- `404` - Job not found or not completed
- `410` - Download link expired

---

## Account Tiers & Limits

| Feature         | Anonymous | Free   | Pro    | Enterprise |
| --------------- | --------- | ------ | ------ | ---------- |
| Conversions/day | 5         | 25     | 500    | Unlimited  |
| Max file size   | 50 MB     | 200 MB | 500 MB | 2 GB       |
| Batch size      | 1         | 5      | 10     | 50         |
| Priority queue  | No        | No     | Yes    | Yes        |
| Price           | Free      | Free   | $9/mo  | Custom     |

## Supported Format Conversions

### Audio

**Input:** MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS
**Output:** MP3, WAV, FLAC, AAC, OGG, M4A, OPUS

### Video

**Input:** MP4, MOV, WEBM, AVI, MKV, FLV, WMV
**Output:** MP4, WEBM, MOV, AVI

### Documents

**Input:** PDF, DOCX, XLSX, PPTX, TXT, ODT, RTF, CSV
**Output:** PDF, DOCX, XLSX, TXT, CSV

### Images

**Input:** PNG, JPG, JPEG, WEBP, HEIC, SVG, TIFF, BMP, GIF, ICO
**Output:** PNG, JPG, JPEG, WEBP, PDF

## Error Types

When a job fails, the `errorType` field indicates the category:

| Error Type           | Description                         |
| -------------------- | ----------------------------------- |
| `CORRUPT_FILE`       | Input file is corrupt or unreadable |
| `MALWARE_DETECTED`   | Malware scan flagged the file       |
| `WORKER_TIMEOUT`     | Conversion exceeded time limit      |
| `WORKER_CRASH`       | Worker process crashed              |
| `UNSUPPORTED_FORMAT` | Format not supported for conversion |
| `FILE_TOO_LARGE`     | File exceeds size limit             |
| `QUOTA_EXCEEDED`     | Daily quota exceeded                |
| `STORAGE_ERROR`      | R2 storage operation failed         |
| `UNKNOWN`            | Unclassified error                  |

## Rate Limiting

- Anonymous users: 5 requests per hour
- Free users: 25 requests per day
- Pro users: 500 requests per day
- Enterprise users: Unlimited (configurable)

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 25
X-RateLimit-Remaining: 23
X-RateLimit-Reset: 1705312800
```
