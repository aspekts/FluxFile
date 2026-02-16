import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from './client';
import { Readable } from 'stream';

export async function uploadFile(
  key: string,
  body: Readable | Buffer,
  contentType: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await r2Client.send(command);
}
