'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { DropZone } from '@/components/conversion/drop-zone';
import { FormatSelector } from '@/components/conversion/format-selector';
import { ProgressTracker } from '@/components/conversion/progress-tracker';
import { BulkProgressTracker, type BulkJob } from '@/components/conversion/bulk-progress-tracker';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { requestUploadUrl, uploadFileToR2 } from '@/lib/storage/upload';
import { getFormatFromMimeType } from '@/lib/validation/file-validation';
import { useSession } from '@/lib/auth/client';
import { TIER_LIMITS } from '@fluxfile/config';
import type { AccountTier } from '@fluxfile/types';
import {
  ArrowRight,
  Sparkles,
  Shield,
  Clock,
  Music,
  Film,
  FileText,
  Image,
  Files,
} from 'lucide-react';
import { toast } from 'sonner';

type ConversionState = 'idle' | 'uploading' | 'converting' | 'complete' | 'error';

export default function HomePage() {
  // Get user session and tier
  const { data: session } = useSession();
  const tier: AccountTier = (session?.user?.accountTier as AccountTier) || 'ANONYMOUS';
  const tierLimits = TIER_LIMITS[tier];
  const maxBatchSize = tierLimits.batchSize;

  // Mode toggle
  const [bulkMode, setBulkMode] = useState(false);

  // Single file state
  const [file, setFile] = useState<File | null>(null);
  const [inputFormat, setInputFormat] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<string>('');
  const [qualityPreset, setQualityPreset] = useState('standard');
  const [state, setState] = useState<ConversionState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // Bulk file state
  const [files, setFiles] = useState<File[]>([]);
  const [bulkJobs, setBulkJobs] = useState<BulkJob[]>([]);
  const [bulkState, setBulkState] = useState<ConversionState>('idle');

  // Get common input format for bulk mode (all files must be same category)
  const bulkInputFormat = files.length > 0 ? getFormatFromMimeType(files[0].type) || '' : '';

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

  const handleFilesSelect = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setOutputFormat('');
    setBulkState('idle');
    setBulkJobs([]);
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
          originalFileName: file.name,
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

  const handleBulkConvert = async () => {
    if (files.length === 0 || !outputFormat) {
      toast.error('Please select files and an output format');
      return;
    }

    setBulkState('uploading');

    // Initialize bulk jobs
    const initialJobs: BulkJob[] = files.map((f, index) => ({
      id: `temp-${index}`,
      fileName: f.name,
      status: 'uploading',
      progress: 0,
      uploadProgress: 0,
      inputFormat: getFormatFromMimeType(f.type) || '',
      outputFormat,
    }));
    setBulkJobs(initialJobs);

    // Process files concurrently (with limit)
    const concurrencyLimit = 3;
    const results: BulkJob[] = [...initialJobs];

    const processFile = async (file: File, index: number) => {
      try {
        // Upload
        const { url, key } = await requestUploadUrl(file.name, file.type);

        await uploadFileToR2(url, file, (progress) => {
          setBulkJobs((prev) =>
            prev.map((j, i) => (i === index ? { ...j, uploadProgress: progress } : j))
          );
        });

        // Update status to queued
        setBulkJobs((prev) =>
          prev.map((j, i) => (i === index ? { ...j, status: 'queued', uploadProgress: 100 } : j))
        );

        // Create job
        const jobResponse = await fetch('/api/jobs/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inputFileKey: key,
            originalFileName: file.name,
            inputFormat: getFormatFromMimeType(file.type),
            outputFormat,
            inputFileSize: file.size,
            qualityPreset,
          }),
        });

        if (!jobResponse.ok) {
          const error = await jobResponse.json();
          throw new Error(error.error || 'Failed to create job');
        }

        const { jobId } = await jobResponse.json();

        // Update with real job ID
        setBulkJobs((prev) =>
          prev.map((j, i) => (i === index ? { ...j, id: jobId, status: 'queued' } : j))
        );

        results[index] = { ...results[index], id: jobId, status: 'queued' };
      } catch (error) {
        setBulkJobs((prev) =>
          prev.map((j, i) =>
            i === index
              ? {
                  ...j,
                  status: 'failed',
                  errorMessage: error instanceof Error ? error.message : 'Upload failed',
                }
              : j
          )
        );
        results[index] = {
          ...results[index],
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Upload failed',
        };
      }
    };

    // Process in batches
    for (let i = 0; i < files.length; i += concurrencyLimit) {
      const batch = files.slice(i, i + concurrencyLimit);
      await Promise.all(batch.map((file, batchIndex) => processFile(file, i + batchIndex)));
    }

    setBulkState('converting');
  };

  const handleJobUpdate = useCallback((jobId: string, updates: Partial<BulkJob>) => {
    setBulkJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...updates } : j)));
  }, []);

  const handleConversionComplete = (url: string) => {
    setState('complete');
    setDownloadUrl(url);
    toast.success('Conversion complete! Your file is ready to download.');
  };

  const handleBulkComplete = useCallback(() => {
    setBulkState('complete');
    toast.success('All conversions complete!');
  }, []);

  const handleReset = () => {
    setFile(null);
    setFiles([]);
    setInputFormat('');
    setOutputFormat('');
    setQualityPreset('standard');
    setState('idle');
    setBulkState('idle');
    setUploadProgress(0);
    setJobId(null);
    setDownloadUrl(null);
    setBulkJobs([]);
  };

  const isProcessing =
    state === 'uploading' ||
    state === 'converting' ||
    bulkState === 'uploading' ||
    bulkState === 'converting';

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
          {/* Bulk Mode Toggle */}
          {state === 'idle' && bulkState === 'idle' && (
            <div className="flex items-center justify-center gap-3">
              <Label htmlFor="bulk-mode" className="text-sm text-muted-foreground">
                Single file
              </Label>
              <Switch
                id="bulk-mode"
                checked={bulkMode}
                onCheckedChange={(checked) => {
                  setBulkMode(checked);
                  handleReset();
                }}
              />
              <Label
                htmlFor="bulk-mode"
                className="flex items-center gap-1.5 text-sm text-muted-foreground"
              >
                <Files className="h-4 w-4" strokeWidth={1.5} />
                Bulk convert (up to {maxBatchSize})
              </Label>
            </div>
          )}

          {/* Drop Zone */}
          {!bulkMode ? (
            <DropZone onFileSelect={handleFileSelect} disabled={isProcessing} />
          ) : (
            <DropZone
              onFileSelect={() => {}}
              onFilesSelect={handleFilesSelect}
              multiple
              maxFiles={maxBatchSize}
              disabled={isProcessing}
            />
          )}

          {/* Single File Format Selection */}
          {!bulkMode && file && inputFormat && state === 'idle' && (
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

          {/* Bulk Format Selection */}
          {bulkMode && files.length > 0 && bulkInputFormat && bulkState === 'idle' && (
            <div className="space-y-4 rounded-xl border border-border/60 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected
                  </p>
                  <p className="rounded-lg border border-border/60 bg-background p-2.5 text-center font-mono text-sm font-medium">
                    {bulkInputFormat.toUpperCase()}
                  </p>
                </div>
                <ArrowRight className="mt-5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
                <div className="flex-1">
                  <FormatSelector
                    inputFormat={bulkInputFormat}
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
              <Button
                size="lg"
                className="w-full"
                onClick={handleBulkConvert}
                disabled={!outputFormat}
              >
                <Sparkles className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Convert {files.length} file{files.length !== 1 ? 's' : ''} to{' '}
                {outputFormat ? outputFormat.toUpperCase() : '...'}
              </Button>
            </div>
          )}

          {/* Single File Upload Progress */}
          {!bulkMode && state === 'uploading' && (
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

          {/* Single File Conversion Progress */}
          {!bulkMode && (state === 'converting' || state === 'complete') && jobId && (
            <ProgressTracker
              jobId={jobId}
              onComplete={handleConversionComplete}
              onError={(error) => {
                setState('error');
                toast.error(error);
              }}
            />
          )}

          {/* Bulk Progress Tracker */}
          {bulkMode && bulkJobs.length > 0 && (
            <BulkProgressTracker
              jobs={bulkJobs}
              onJobUpdate={handleJobUpdate}
              onAllComplete={handleBulkComplete}
            />
          )}

          {/* Reset */}
          {(state === 'complete' ||
            state === 'error' ||
            bulkState === 'complete' ||
            bulkState === 'error') && (
            <Button variant="outline" onClick={handleReset} className="w-full">
              Convert more files
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
