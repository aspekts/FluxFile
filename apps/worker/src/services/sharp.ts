import type sharp from 'sharp';
import type { ConversionSettings, ImageFormat } from '@fluxfile/types';
import { IMAGE_PRESETS } from '@fluxfile/config';

// Sharp is imported dynamically to avoid issues when it's not installed
let sharpModule: typeof sharp | null = null;

async function getSharp(): Promise<typeof sharp> {
  if (!sharpModule) {
    const mod = await import('sharp');
    sharpModule = (mod as any).default || mod;
  }
  return sharpModule!;
}

export interface ImageConversionResult {
  outputPath: string;
  width: number;
  height: number;
  fileSize: number;
}

/**
 * Convert an image file using Sharp.
 */
export async function convertImage(
  inputPath: string,
  outputPath: string,
  outputFormat: ImageFormat,
  qualityPreset: string | undefined,
  customSettings: ConversionSettings | undefined,
  onProgress?: (percent: number) => void
): Promise<ImageConversionResult> {
  const sharp = await getSharp();

  // Determine settings
  let settings: ConversionSettings = {};
  if (customSettings) {
    settings = customSettings;
  } else if (qualityPreset) {
    settings = IMAGE_PRESETS[qualityPreset] || IMAGE_PRESETS['standard'] || {};
  }

  onProgress?.(10);

  // Create the Sharp pipeline
  let pipeline = sharp(inputPath);

  // Get input metadata for progress and dimension info
  const metadata = await pipeline.metadata();

  onProgress?.(20);

  // Resize if dimensions are specified
  if (settings.imageWidth || settings.imageHeight) {
    pipeline = pipeline.resize({
      width: settings.imageWidth || undefined,
      height: settings.imageHeight || undefined,
      fit: settings.imageFit || 'inside',
      withoutEnlargement: true,
    });
  }

  onProgress?.(40);

  // Convert to output format with quality settings
  const quality = settings.imageQuality || 85;

  switch (outputFormat) {
    case 'png':
      pipeline = pipeline.png({
        quality,
        compressionLevel: quality >= 90 ? 1 : quality >= 70 ? 6 : 9,
      });
      break;

    case 'jpg':
    case 'jpeg':
      pipeline = pipeline.jpeg({
        quality,
        mozjpeg: true,
      });
      break;

    case 'webp':
      pipeline = pipeline.webp({
        quality,
        effort: quality >= 90 ? 6 : 4,
      });
      break;

    case 'tiff':
      pipeline = pipeline.tiff({
        quality,
      });
      break;

    case 'gif':
      pipeline = pipeline.gif();
      break;

    case 'heic':
      // Sharp supports heif output if libheif is available
      pipeline = pipeline.heif({
        quality,
        compression: 'hevc',
      });
      break;

    default:
      // For formats like bmp, ico, svg - attempt toFormat
      pipeline = pipeline.toFormat(outputFormat as any, { quality });
      break;
  }

  onProgress?.(60);

  // Write output
  const outputInfo = await pipeline.toFile(outputPath);

  onProgress?.(100);

  return {
    outputPath,
    width: outputInfo.width,
    height: outputInfo.height,
    fileSize: outputInfo.size,
  };
}
