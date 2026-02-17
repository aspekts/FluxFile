import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, BUCKET_NAME } from './client';
import { R2_PATHS, PRESIGNED_URL_EXPIRY, DOWNLOAD_URL_EXPIRY } from './constants';

export async function generateUploadUrl(
  key: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const fullKey = `${R2_PATHS.UPLOADS}${key}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fullKey,
    ContentType: contentType,
  });

  const url = await getSignedUrl(r2Client, command, {
    expiresIn: PRESIGNED_URL_EXPIRY,
    // Only sign the host header. This prevents SDK-injected headers
    // (like x-amz-checksum-crc32) from being included in the signature,
    // which would cause SignatureDoesNotMatch when the browser makes the
    // actual PUT request without those headers.
    signableHeaders: new Set(['host']),
  });

  return { url, key: fullKey };
}

export async function generateDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2Client, command, {
    expiresIn: DOWNLOAD_URL_EXPIRY,
  });
}
