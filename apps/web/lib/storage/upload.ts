import { generateUploadUrl } from '@fluxfile/storage';

/**
 * Request a presigned upload URL from the server.
 * Client-side function that calls the API.
 */
export async function requestUploadUrl(
  fileName: string,
  contentType: string
): Promise<{ url: string; key: string }> {
  const response = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, contentType }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get upload URL');
  }

  return response.json();
}

/**
 * Upload a file directly to R2 using a presigned URL.
 * Client-side function.
 */
export async function uploadFileToR2(
  presignedUrl: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    xhr.open('PUT', presignedUrl);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

/**
 * Complete the upload process by notifying the server.
 * Client-side function.
 */
export async function completeUpload(fileKey: string, fileName: string, fileSize: number) {
  const response = await fetch('/api/upload/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileKey, fileName, fileSize }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete upload');
  }

  return response.json();
}
