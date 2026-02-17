'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { DropZone } from '@/components/conversion/drop-zone';
import { FormatSelector } from '@/components/conversion/format-selector';
import { ProgressTracker } from '@/components/conversion/progress-tracker';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { requestUploadUrl, uploadFileToR2 } from '@/lib/storage/upload';
import { getFormatFromMimeType } from '@/lib/validation/file-validation';
import { ArrowRight, Sparkles, Shield, Clock, Music, Film, FileText, Image } from 'lucide-react';
import { toast } from 'sonner';

type ConversionState = 'idle' | 'uploading' | 'converting' | 'complete' | 'error';

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('');
  const [qualityPreset, setQualityPreset] = useState('standard');
  const [state, setState] = useState<ConversionState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const format = getFormatFromMimeType(selectedFile.type);
    if (format) {
      setInputFormat(format);
      setOutputFormat('');
    }
    setState('idle');
    setJobId(null);
    setDownloadUrl(null);
  }, []);

  const handleConvert = async () => {
    if (!file || !inputFormat || !outputFormat) {
      toast.error('Please select a file and output format');
      return;
    }

    try {
      // Step 1: Get presigned URL and upload
      setState('uploading');
      setUploadProgress(0);

      const { url, key } = await requestUploadUrl(file.name, file.type);
      await uploadFileToR2(url, file, setUploadProgress);

      // Step 2: Create conversion job
      setState('converting');

      const jobResponse = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputFileKey: key,
          inputFormat,
          outputFormat,
          inputFileSize: file.size,
          qualityPreset,
        }),
      });

      if (!jobResponse.ok) {
        const error = await jobResponse.json();
        throw new Error(error.error || 'Failed to create conversion job');
      }

      const { jobId: newJobId } = await jobResponse.json();
      setJobId(newJobId);
    } catch (error) {
      setState('error');
      toast.error(error instanceof Error ? error.message : 'Conversion failed');
    }
  };

  const handleConversionComplete = (url: string) => {
    setState('complete');
    setDownloadUrl(url);
    toast.success('Conversion complete! Your file is ready to download.');
  };

  const handleReset = () => {
    setFile(null);
    setInputFormat('');
    setOutputFormat('');
    setQualityPreset('standard');
    setState('idle');
    setUploadProgress(0);
    setJobId(null);
    setDownloadUrl(null);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight-h1 md:text-6xl">
            Convert any file, <span className="text-primary">instantly</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
            Fast, secure file conversion with enterprise-grade privacy. Audio, video, documents, and
            images — all in one place.
          </p>
        </div>

        {/* Conversion Interface */}
        <div className="mt-12 space-y-6">
          {/* Drop Zone */}
          <DropZone
            onFileSelect={handleFileSelect}
            disabled={state === 'uploading' || state === 'converting'}
          />

          {/* Format Selection */}
          {file && inputFormat && state === 'idle' && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    From
                  </p>
                  <p className="rounded-lg border border-border/60 bg-background p-2.5 text-center font-mono text-sm font-medium">
                    {inputFormat.toUpperCase()}
                  </p>
                </div>
                <ArrowRight className="mt-5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <div className="flex-1">
                  <FormatSelector
                    inputFormat={inputFormat}
                    selectedFormat={outputFormat}
                    onFormatChange={setOutputFormat}
                  />
                </div>
              </div>

              {/* Quality Preset */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Quality
                </label>
                <Select value={qualityPreset} onValueChange={setQualityPreset}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low — Smaller file</SelectItem>
                    <SelectItem value="standard">Standard — Balanced</SelectItem>
                    <SelectItem value="high">High — Best quality</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Convert Button */}
              <Button size="lg" className="w-full" onClick={handleConvert} disabled={!outputFormat}>
                <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Convert to {outputFormat ? outputFormat.toUpperCase() : '...'}
              </Button>
            </div>
          )}

          {/* Upload Progress */}
          {state === 'uploading' && (
            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Uploading...</p>
                <p className="font-mono text-sm text-muted-foreground">{uploadProgress}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Conversion Progress */}
          {(state === 'converting' || state === 'complete') && jobId && (
            <ProgressTracker
              jobId={jobId}
              onComplete={handleConversionComplete}
              onError={(error) => {
                setState('error');
                toast.error(error);
              }}
            />
          )}

          {/* Reset */}
          {(state === 'complete' || state === 'error') && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              Convert another file
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border/40 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight-h2">
            Why FluxFile?
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Sparkles,
                title: 'Lightning Fast',
                desc: 'Powered by dedicated workers running FFmpeg, Sharp, and LibreOffice. Most conversions complete in seconds.',
              },
              {
                icon: Shield,
                title: 'Zero-Knowledge Privacy',
                desc: 'Your files are encrypted in transit and at rest. Automatically deleted after 24 hours. We never access your content.',
              },
              {
                icon: Clock,
                title: 'No Waiting',
                desc: 'Priority queue for Pro and Enterprise users. Real-time progress tracking with estimated completion times.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-border/60 bg-card p-6 shadow-sm"
              >
                <feature.icon className="mb-3 h-5 w-5 text-primary" strokeWidth={1.5} />
                <h3 className="mb-1.5 text-sm font-semibold">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Formats Section */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-12 text-center text-2xl font-semibold tracking-tight-h2">
            Supported Formats
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { icon: Music, title: 'Audio', formats: 'MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS' },
              { icon: Film, title: 'Video', formats: 'MP4, MOV, WebM, AVI, MKV, FLV, WMV' },
              {
                icon: FileText,
                title: 'Documents',
                formats: 'PDF, DOCX, XLSX, PPTX, TXT, ODT, RTF, CSV',
              },
              {
                icon: Image,
                title: 'Images',
                formats: 'PNG, JPG, WebP, HEIC, SVG, TIFF, BMP, GIF, ICO',
              },
            ].map((cat) => (
              <div
                key={cat.title}
                className="rounded-xl border border-border/60 bg-card p-5 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <cat.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  <h3 className="text-sm font-semibold">{cat.title}</h3>
                </div>
                <p className="font-mono text-xs leading-relaxed text-muted-foreground">
                  {cat.formats}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border/40 py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-3 text-2xl font-semibold tracking-tight-h2">Ready for more?</h2>
          <p className="mx-auto mb-8 max-w-md text-sm text-muted-foreground">
            Create a free account to unlock higher limits, conversion history, and priority
            processing.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/signup">Create Free Account</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
