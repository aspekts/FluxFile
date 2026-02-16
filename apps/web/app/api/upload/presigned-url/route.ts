import { NextResponse } from 'next/server';
import { generateUploadUrl } from '@fluxfile/storage';
import { getServerSession } from '@/lib/auth/session';
import { validateFile } from '@/lib/validation/file-validation';
import { v4 as uuidv4 } from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType } = body;

    if (!fileName || !contentType) {
      return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 });
    }

    // Get session (optional - anonymous users can upload too)
    const session = await getServerSession();
    const tier = (session?.user as any)?.accountTier || 'ANONYMOUS';

    // Validate the file type
    const validation = validateFile({ name: fileName, type: contentType, size: 0 }, tier);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate a unique key for the upload
    const fileId = crypto.randomUUID();
    const extension = fileName.split('.').pop() || '';
    const key = `${fileId}.${extension}`;

    // Generate presigned upload URL
    const { url, key: uploadKey } = await generateUploadUrl(key, contentType);

    return NextResponse.json({
      url,
      key: uploadKey,
      fileId,
    });
  } catch (error) {
    console.error('Presigned URL error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
