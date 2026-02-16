import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from './client';
import { Readable } from 'stream';

export async function downloadFile(key: string): Promise<Readable> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await r2Client.send(command);

  if (!response.Body) {
    throw new Error('No file body in response');
  }

  return response.Body as Readable;
}
