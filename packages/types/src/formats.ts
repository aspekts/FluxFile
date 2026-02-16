// Supported format categories and types
export type AudioFormat =
  | 'mp3'
  | 'wav'
  | 'flac'
  | 'aac'
  | 'ogg'
  | 'm4a'
  | 'wma'
  | 'opus';

export type VideoFormat =
  | 'mp4'
  | 'mov'
  | 'webm'
  | 'avi'
  | 'mkv'
  | 'flv'
  | 'wmv';

export type DocumentFormat =
  | 'pdf'
  | 'docx'
  | 'xlsx'
  | 'pptx'
  | 'txt'
  | 'odt'
  | 'rtf'
  | 'csv';

export type ImageFormat =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'webp'
  | 'heic'
  | 'svg'
  | 'tiff'
  | 'bmp'
  | 'gif'
  | 'ico';

export type ConversionFormat = AudioFormat | VideoFormat | DocumentFormat | ImageFormat;

export type FormatCategory = 'audio' | 'video' | 'document' | 'image';

export interface FormatInfo {
  format: ConversionFormat;
  category: FormatCategory;
  mimeTypes: string[];
  extensions: string[];
}
