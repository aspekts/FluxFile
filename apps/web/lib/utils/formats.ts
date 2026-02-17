import { FORMAT_COMPATIBILITY, getFormatCategory, FORMAT_MIME_TYPES } from '@fluxfile/config';
import type { FormatCategory } from '@fluxfile/types';

/**
 * Get the available output formats for a given input format.
 */
export function getOutputFormats(inputFormat: string): string[] {
  const category = getFormatCategory(inputFormat);
  if (!category) return [];

  const compatibility = FORMAT_COMPATIBILITY[category];
  if (!compatibility) return [];

  // Return all outputs except the input format itself
  return compatibility.outputs.filter((f: string) => f !== inputFormat);
}

/**
 * Get all supported input formats grouped by category.
 */
export function getSupportedFormats(): Record<FormatCategory, string[]> {
  return {
    audio: FORMAT_COMPATIBILITY.audio.inputs as unknown as string[],
    video: FORMAT_COMPATIBILITY.video.inputs as unknown as string[],
    document: FORMAT_COMPATIBILITY.document.inputs as unknown as string[],
    image: FORMAT_COMPATIBILITY.image.inputs as unknown as string[],
  };
}

/**
 * Get the MIME types for a format.
 */
export function getMimeTypes(format: string): string[] {
  return (FORMAT_MIME_TYPES as Record<string, string[]>)[format] || [];
}

/**
 * Get all accepted MIME types for file upload.
 */
export function getAcceptedMimeTypes(): Record<string, string[]> {
  const accept: Record<string, string[]> = {};

  for (const category of ['audio', 'video', 'document', 'image'] as FormatCategory[]) {
    const formats = FORMAT_COMPATIBILITY[category].inputs;
    for (const format of formats) {
      const mimeTypes = getMimeTypes(format as string);
      for (const mimeType of mimeTypes) {
        accept[mimeType] = [`.${format}`];
      }
    }
  }

  return accept;
}

/**
 * Get a human-readable label for a format.
 */
export function getFormatLabel(format: string): string {
  return format.toUpperCase();
}

/**
 * Get the category icon name for lucide-react.
 */
export function getCategoryIcon(category: FormatCategory): string {
  const icons: Record<FormatCategory, string> = {
    audio: 'Music',
    video: 'Film',
    document: 'FileText',
    image: 'Image',
  };
  return icons[category];
}
