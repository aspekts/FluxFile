import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { ConversionSettings, AudioFormat, VideoFormat } from '@fluxfile/types';
import { AUDIO_PRESETS, VIDEO_PRESETS } from '@fluxfile/config';

export interface FFmpegProgress {
  percent: number;
  currentTime: number;
  totalTime: number;
}

export interface FFmpegResult {
  outputPath: string;
  duration: number;
  fileSize: number;
}

/**
 * Get the duration of a media file in seconds using ffprobe.
 */
export async function getMediaDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffprobe', [
      '-v',
      'quiet',
      '-print_format',
      'json',
      '-show_format',
      inputPath,
    ]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
        return;
      }
      try {
        const info = JSON.parse(stdout);
        const duration = parseFloat(info.format?.duration || '0');
        resolve(duration);
      } catch {
        reject(new Error(`Failed to parse ffprobe output: ${stdout}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`ffprobe not found or failed to start: ${err.message}`));
    });
  });
}

/**
 * Build FFmpeg arguments for audio conversion.
 */
function buildAudioArgs(
  inputPath: string,
  outputPath: string,
  outputFormat: AudioFormat,
  settings: ConversionSettings
): string[] {
  const args: string[] = ['-i', inputPath, '-y'];

  // Preserve metadata from input file
  args.push('-map_metadata', '0');

  // Audio codec mapping
  const codecMap: Partial<Record<AudioFormat, string>> = {
    mp3: 'libmp3lame',
    aac: 'aac',
    ogg: 'libvorbis',
    opus: 'libopus',
    flac: 'flac',
    wav: 'pcm_s16le',
    m4a: 'aac',
  };

  const codec = codecMap[outputFormat];
  if (codec) {
    args.push('-acodec', codec);
  }

  if (settings.audioBitrate) {
    args.push('-b:a', `${settings.audioBitrate}k`);
  }

  if (settings.audioSampleRate) {
    args.push('-ar', String(settings.audioSampleRate));
  }

  if (settings.audioChannels) {
    args.push('-ac', String(settings.audioChannels));
  }

  // Strip video streams for audio-only output
  args.push('-vn');

  args.push(outputPath);
  return args;
}

/**
 * Build FFmpeg arguments for video conversion.
 */
function buildVideoArgs(
  inputPath: string,
  outputPath: string,
  outputFormat: VideoFormat,
  settings: ConversionSettings
): string[] {
  const args: string[] = ['-i', inputPath, '-y'];

  // Preserve metadata from input file
  args.push('-map_metadata', '0');

  // Video codec
  const videoCodec = settings.videoCodec || 'h264';
  const videoCodecMap: Record<string, string> = {
    h264: 'libx264',
    h265: 'libx265',
    vp8: 'libvpx',
    vp9: 'libvpx-vp9',
    av1: 'libaom-av1',
  };
  args.push('-c:v', videoCodecMap[videoCodec] || 'libx264');

  // Audio codec
  const audioCodec = settings.audioCodec || 'aac';
  const audioCodecMap: Record<string, string> = {
    aac: 'aac',
    mp3: 'libmp3lame',
    opus: 'libopus',
    vorbis: 'libvorbis',
  };
  args.push('-c:a', audioCodecMap[audioCodec] || 'aac');

  // Video bitrate
  if (settings.videoBitrate) {
    args.push('-b:v', `${settings.videoBitrate}k`);
  }

  // Audio bitrate
  if (settings.audioBitrate) {
    args.push('-b:a', `${settings.audioBitrate}k`);
  }

  // Resolution
  if (settings.videoResolution) {
    const resolutionMap: Record<string, string> = {
      '480p': '854:480',
      '720p': '1280:720',
      '1080p': '1920:1080',
      '1440p': '2560:1440',
      '4k': '3840:2160',
    };
    const scale = resolutionMap[settings.videoResolution];
    if (scale) {
      // Use scale filter with -2 to maintain aspect ratio with even dimensions
      const [w] = scale.split(':');
      args.push('-vf', `scale=${w}:-2`);
    }
  }

  // Frame rate
  if (settings.videoFrameRate) {
    args.push('-r', String(settings.videoFrameRate));
  }

  // Format-specific flags
  if (outputFormat === 'mp4') {
    args.push('-movflags', '+faststart');
  }

  args.push(outputPath);
  return args;
}

/**
 * Run FFmpeg with progress tracking.
 */
export async function runFFmpeg(
  inputPath: string,
  outputPath: string,
  outputFormat: string,
  qualityPreset: string | undefined,
  customSettings: ConversionSettings | undefined,
  category: 'audio' | 'video',
  onProgress?: (progress: FFmpegProgress) => void
): Promise<FFmpegResult> {
  // Determine settings from preset or custom
  let settings: ConversionSettings = {};
  if (customSettings) {
    settings = customSettings;
  } else if (qualityPreset) {
    const presets = category === 'audio' ? AUDIO_PRESETS : VIDEO_PRESETS;
    settings = presets[qualityPreset] || presets['standard'] || {};
  }

  // Get duration for progress tracking
  let totalDuration = 0;
  try {
    totalDuration = await getMediaDuration(inputPath);
  } catch {
    // If we can't get duration, progress will be estimated
    console.warn('Could not determine media duration for progress tracking');
  }

  // Build FFmpeg arguments
  const args =
    category === 'audio'
      ? buildAudioArgs(inputPath, outputPath, outputFormat as AudioFormat, settings)
      : buildVideoArgs(inputPath, outputPath, outputFormat as VideoFormat, settings);

  return new Promise((resolve, reject) => {
    // Add progress flag
    const fullArgs = ['-progress', 'pipe:1', ...args];

    const proc: ChildProcess = spawn('ffmpeg', fullArgs);

    let stderrOutput = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      for (const line of lines) {
        if (line.startsWith('out_time_ms=')) {
          const timeMs = parseInt(line.split('=')[1], 10);
          if (!isNaN(timeMs) && totalDuration > 0) {
            const currentTime = timeMs / 1_000_000;
            const percent = Math.min(Math.round((currentTime / totalDuration) * 100), 99);
            onProgress?.({
              percent,
              currentTime,
              totalTime: totalDuration,
            });
          }
        }
      }
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderrOutput.slice(-500)}`));
        return;
      }

      try {
        const stat = fs.statSync(outputPath);
        resolve({
          outputPath,
          duration: totalDuration,
          fileSize: stat.size,
        });
      } catch (err) {
        reject(new Error(`Output file not found after conversion: ${outputPath}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`FFmpeg not found or failed to start: ${err.message}`));
    });
  });
}
