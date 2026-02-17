import { FORMAT_MIME_TYPES, FORMAT_COMPATIBILITY, getFormatCategory } from '@fluxfile/config';
import { TIER_LIMITS, CATEGORY_LIMITS } from '@fluxfile/config';
import type { AccountTier, FormatCategory } from '@fluxfile/types';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  format?: string;
  category?: FormatCategory;
}

/**
 * Validate a file based on its MIME type and size against tier limits.
 */
export function validateFile(
  file: { name: string; type: string; size: number },
  tier: AccountTier = 'FREE'
): FileValidationResult {
  // Determine format from MIME type
  const format = getFormatFromMimeType(file.type);
  if (!format) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Please upload a supported file format.`,
    };
  }

  const category = getFormatCategory(format);
  if (!category) {
    return {
      valid: false,
      error: `Could not determine category for format: ${format}`,
    };
  }

  // Check tier file size limit
  const tierLimits = TIER_LIMITS[tier];
  if (file.size > tierLimits.maxFileSize) {
    const maxMB = Math.round(tierLimits.maxFileSize / (1024 * 1024));
    return {
      valid: false,
      error: `File size exceeds the ${maxMB}MB limit for your plan. Consider upgrading for larger files.`,
    };
  }

  // Check category-specific size limit
  const categoryLimits = CATEGORY_LIMITS[category];
  if (file.size > categoryLimits.maxSize) {
    const maxMB = Math.round(categoryLimits.maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `${category} files are limited to ${maxMB}MB maximum.`,
    };
  }

  return { valid: true, format, category };
}

/**
 * Validate that a conversion from one format to another is supported.
 */
export function validateConversion(
  inputFormat: string,
  outputFormat: string
): { valid: boolean; error?: string } {
  const category = getFormatCategory(inputFormat);
  if (!category) {
    return { valid: false, error: `Unsupported input format: ${inputFormat}` };
  }

  const compatibility = FORMAT_COMPATIBILITY[category];
  if (!compatibility) {
    return { valid: false, error: `No conversion rules for category: ${category}` };
  }

  if (!compatibility.inputs.includes(inputFormat as never)) {
    return { valid: false, error: `${inputFormat} is not a supported input format.` };
  }

  if (!compatibility.outputs.includes(outputFormat as never)) {
    return {
      valid: false,
      error: `${outputFormat} is not a supported output format for ${category} files.`,
    };
  }

  if (inputFormat === outputFormat) {
    return { valid: false, error: 'Input and output formats are the same.' };
  }

  return { valid: true };
}

/**
 * Get the format string from a MIME type.
 */
export function getFormatFromMimeType(mimeType: string): string | null {
  for (const [format, mimeTypes] of Object.entries(FORMAT_MIME_TYPES)) {
    if ((mimeTypes as string[]).includes(mimeType)) {
      return format;
    }
  }
  return null;
}

/**
 * Get the file extension from a format string.
 */
export function getExtensionFromFormat(format: string): string {
  return `.${format}`;
}
