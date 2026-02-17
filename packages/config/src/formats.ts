import type { FormatCategory, ConversionFormat } from '@fluxfile/types';

export const FORMAT_COMPATIBILITY = {
  audio: {
    inputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'] as const,
    outputs: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus'] as const,
  },
  video: {
    inputs: ['mp4', 'mov', 'webm', 'avi', 'mkv', 'flv', 'wmv'] as const,
    outputs: ['mp4', 'webm', 'mov', 'avi'] as const,
  },
  document: {
    inputs: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'odt', 'rtf', 'csv'] as const,
    outputs: ['pdf', 'docx', 'xlsx', 'txt', 'csv'] as const,
  },
  image: {
    inputs: ['png', 'jpg', 'jpeg', 'webp', 'heic', 'svg', 'tiff', 'bmp', 'gif', 'ico'] as const,
    outputs: ['png', 'jpg', 'jpeg', 'webp', 'pdf'] as const,
  },
} as const;

export const FORMAT_MIME_TYPES: Record<ConversionFormat, string[]> = {
  // Audio
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/wave'],
  flac: ['audio/flac'],
  aac: ['audio/aac', 'audio/x-aac'],
  ogg: ['audio/ogg'],
  m4a: ['audio/mp4', 'audio/x-m4a'],
  wma: ['audio/x-ms-wma'],
  opus: ['audio/opus'],

  // Video
  mp4: ['video/mp4'],
  mov: ['video/quicktime'],
  webm: ['video/webm'],
  avi: ['video/x-msvideo'],
  mkv: ['video/x-matroska'],
  flv: ['video/x-flv'],
  wmv: ['video/x-ms-wmv'],

  // Documents
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt: ['text/plain'],
  odt: ['application/vnd.oasis.opendocument.text'],
  rtf: ['application/rtf'],
  csv: ['text/csv'],

  // Images
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  heic: ['image/heic', 'image/heif'],
  svg: ['image/svg+xml'],
  tiff: ['image/tiff'],
  bmp: ['image/bmp'],
  gif: ['image/gif'],
  ico: ['image/x-icon'],
};

export function getFormatCategory(format: ConversionFormat): FormatCategory {
  for (const [category, { inputs }] of Object.entries(FORMAT_COMPATIBILITY)) {
    if ((inputs as readonly string[]).includes(format)) {
      return category as FormatCategory;
    }
  }
  throw new Error(`Unknown format: ${format}`);
}

export function isValidConversion(input: ConversionFormat, output: ConversionFormat): boolean {
  const inputCategory = getFormatCategory(input);
  const outputCategory = getFormatCategory(output);

  if (inputCategory !== outputCategory) {
    return false;
  }

  const { outputs } = FORMAT_COMPATIBILITY[inputCategory];
  return (outputs as readonly string[]).includes(output);
}
