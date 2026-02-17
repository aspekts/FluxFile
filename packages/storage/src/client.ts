import { S3Client } from '@aws-sdk/client-s3';

if (!process.env.R2_ENDPOINT) {
  throw new Error('R2_ENDPOINT environment variable is required');
}
if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID environment variable is required');
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY environment variable is required');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
  // Cloudflare R2 does not support the CRC32 request checksums that
  // AWS SDK v3.568+ adds by default. Disabling them prevents
  // SignatureDoesNotMatch errors on presigned URLs.
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'fluxfile';
