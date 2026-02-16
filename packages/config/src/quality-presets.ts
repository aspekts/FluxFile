import type { ConversionSettings } from '@fluxfile/types';

export const AUDIO_PRESETS: Record<string, ConversionSettings> = {
  low: {
    audioBitrate: 128,
    audioSampleRate: 44100,
  },
  standard: {
    audioBitrate: 192,
    audioSampleRate: 44100,
  },
  high: {
    audioBitrate: 320,
    audioSampleRate: 48000,
  },
};

export const VIDEO_PRESETS: Record<string, ConversionSettings> = {
  low: {
    videoResolution: '720p',
    videoBitrate: 1500,
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: 128,
  },
  standard: {
    videoResolution: '1080p',
    videoBitrate: 3000,
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: 192,
  },
  high: {
    videoResolution: '4k',
    videoBitrate: 8000,
    videoCodec: 'h264',
    audioCodec: 'aac',
    audioBitrate: 256,
  },
};

export const IMAGE_PRESETS: Record<string, ConversionSettings> = {
  low: {
    imageWidth: 500,
    imageQuality: 70,
    imageFit: 'inside',
  },
  standard: {
    imageWidth: 1920,
    imageQuality: 85,
    imageFit: 'inside',
  },
  high: {
    imageQuality: 95,
  },
  original: {
    imageQuality: 100,
  },
};

export const DOCUMENT_PRESETS: Record<string, ConversionSettings> = {
  standard: {
    documentDPI: 300,
  },
  high: {
    documentDPI: 600,
  },
};
