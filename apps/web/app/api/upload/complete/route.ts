import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileKey, fileName, fileSize } = body;

    if (!fileKey || !fileName || !fileSize) {
      return NextResponse.json(
        { error: 'fileKey, fileName, and fileSize are required' },
        { status: 400 }
      );
    }

    // Get session (optional)
    const session = await getServerSession();

    return NextResponse.json({
      success: true,
      fileKey,
      fileName,
      fileSize,
      userId: session?.user?.id || null,
    });
  } catch (error) {
    console.error('Upload complete error:', error);
    return NextResponse.json({ error: 'Failed to complete upload' }, { status: 500 });
  }
}
