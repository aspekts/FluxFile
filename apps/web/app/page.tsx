'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { DropZone } from '@/components/conversion/drop-zone';
import { FormatSelector } from '@/components/conversion/format-selector';
import { ProgressTracker } from '@/components/conversion/progress-tracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { requestUploadUrl, uploadFileToR2 } from '@/lib/storage/upload';
import { getFormatFromMimeType } from '@/lib/validation/file-validation';
import { ArrowRight, Zap, Shield, Clock, Music, Film, FileText, Image } from 'lucide-react';
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
      <section className="container mx-auto max-w-6xl px-4 py-16 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight sm:text-6xl">
          Convert any file, <span className="text-primary">instantly</span>
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg text-muted-foreground">
          Fast, secure file conversion with enterprise-grade privacy. Audio, video, documents, and
          images - all in one place.
        </p>

        {/* Conversion Interface */}
        <Card className="mx-auto max-w-2xl">
          <CardContent className="space-y-6 p-6">
            {/* Drop Zone */}
            <DropZone
              onFileSelect={handleFileSelect}
              disabled={state === 'uploading' || state === 'converting'}
            />

            {/* Format Selection */}
            {file && inputFormat && state === 'idle' && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="mb-1 text-sm font-medium text-muted-foreground">From</p>
                    <p className="rounded-md border bg-muted/50 p-2 text-center font-medium">
                      {inputFormat.toUpperCase()}
                    </p>
                  </div>
                  <ArrowRight className="mt-5 h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <FormatSelector
                      inputFormat={inputFormat}
                      selectedFormat={outputFormat}
                      onFormatChange={setOutputFormat}
                    />
                  </div>
                </div>

                {/* Quality Preset */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quality</label>
                  <Select value={qualityPreset} onValueChange={setQualityPreset}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Smaller file</SelectItem>
                      <SelectItem value="standard">Standard - Balanced</SelectItem>
                      <SelectItem value="high">High - Best quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Convert Button */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleConvert}
                  disabled={!outputFormat}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Convert to {outputFormat ? outputFormat.toUpperCase() : '...'}
                </Button>
              </div>
            )}

            {/* Upload Progress */}
            {state === 'uploading' && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Uploading... {uploadProgress}%</p>
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all"
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
          </CardContent>
        </Card>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why FluxFile?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Zap className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Lightning Fast</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Powered by dedicated workers running FFmpeg, Sharp, and LibreOffice. Most
                  conversions complete in seconds.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>Zero-Knowledge Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your files are encrypted in transit and at rest. Automatically deleted after 24
                  hours. We never access your content.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="mb-2 h-8 w-8 text-primary" />
                <CardTitle>No Waiting</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Priority queue for Pro and Enterprise users. Real-time progress tracking with
                  estimated completion times.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Supported Formats Section */}
      <section className="py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Supported Formats</h2>
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Music className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Audio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  MP3, WAV, FLAC, AAC, OGG, M4A, WMA, OPUS
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Film className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Video</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">MP4, MOV, WebM, AVI, MKV, FLV, WMV</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <FileText className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  PDF, DOCX, XLSX, PPTX, TXT, ODT, RTF, CSV
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Image className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Images</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  PNG, JPG, WebP, HEIC, SVG, TIFF, BMP, GIF, ICO
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-16">
        <div className="container mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready for more?</h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Create a free account to unlock higher limits, conversion history, and priority
            processing.
          </p>
          <div className="flex justify-center gap-4">
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
