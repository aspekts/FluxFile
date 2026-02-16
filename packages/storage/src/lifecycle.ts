import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, BUCKET_NAME } from './client';

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);
}
