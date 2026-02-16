import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

/**
 * Ensure a directory exists, creating it recursively if needed.
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}

/**
 * Remove a directory and all its contents.
 */
export async function cleanupDir(dirPath: string): Promise<void> {
  try {
    await fs.promises.rm(dirPath, { recursive: true, force: true });
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Write a readable stream to a file on disk.
 */
export async function streamToFile(stream: Readable, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(filePath);
    stream.pipe(writeStream);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
    stream.on('error', reject);
  });
}

/**
 * Get the MIME type for a file format.
 */
export function getMimeType(format: string): string {
  const mimeMap: Record<string, string> = {
    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    aac: 'audio/aac',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    wma: 'audio/x-ms-wma',
    opus: 'audio/opus',
    // Video
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    flv: 'video/x-flv',
    wmv: 'video/x-ms-wmv',
    // Documents
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    odt: 'application/vnd.oasis.opendocument.text',
    rtf: 'application/rtf',
    csv: 'text/csv',
    // Images
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    heic: 'image/heic',
    svg: 'image/svg+xml',
    tiff: 'image/tiff',
    bmp: 'image/bmp',
    gif: 'image/gif',
    ico: 'image/x-icon',
  };

  return mimeMap[format] || 'application/octet-stream';
}
