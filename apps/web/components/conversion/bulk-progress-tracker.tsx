'use client';

import { useEffect, useState, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Clock,
  FileType2,
  ChevronDown,
  ChevronUp,
  DownloadCloud,
} from 'lucide-react';
import { formatDuration, cn } from '@/lib/utils';

export interface BulkJob {
  id: string;
  fileName: string;
  status: 'uploading' | 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  uploadProgress?: number;
  currentStage?: string | null;
  errorMessage?: string | null;
  downloadUrl?: string | null;
  inputFormat: string;
  outputFormat: string;
  processingTimeMs?: number | null;
}

interface BulkProgressTrackerProps {
  jobs: BulkJob[];
  onJobUpdate?: (jobId: string, updates: Partial<BulkJob>) => void;
  onAllComplete?: () => void;
}

export function BulkProgressTracker({
  jobs,
  onJobUpdate,
  onAllComplete,
}: BulkProgressTrackerProps) {
  const [expanded, setExpanded] = useState(true);
  const [polling, setPolling] = useState(true);

  // Get job IDs that need polling (queued or processing)
  const jobsToPolll = jobs.filter((j) => j.status === 'queued' || j.status === 'processing');

  // Poll for job updates
  useEffect(() => {
    if (!polling || jobsToPolll.length === 0) return;

    const fetchStatuses = async () => {
      for (const job of jobsToPolll) {
        try {
          const response = await fetch(`/api/jobs/${job.id}`);
          if (!response.ok) continue;
          const data = await response.json();

          const statusMap: Record<string, BulkJob['status']> = {
            PENDING: 'queued',
            SCANNING: 'processing',
            PROCESSING: 'processing',
            COMPLETED: 'completed',
            FAILED: 'failed',
            CANCELLED: 'cancelled',
          };

          onJobUpdate?.(job.id, {
            status: statusMap[data.status] || 'processing',
            progress: data.progress,
            currentStage: data.currentStage,
            errorMessage: data.errorMessage,
            downloadUrl: data.downloadUrl,
            processingTimeMs: data.processingTimeMs,
          });
        } catch (error) {
          console.error(`Failed to fetch status for job ${job.id}:`, error);
        }
      }
    };

    fetchStatuses();
    const interval = setInterval(fetchStatuses, 2000);

    return () => clearInterval(interval);
  }, [polling, jobsToPolll, onJobUpdate]);

  // Check if all jobs are complete
  useEffect(() => {
    const allDone = jobs.every(
      (j) => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled'
    );
    if (allDone && jobs.length > 0) {
      setPolling(false);
      onAllComplete?.();
    }
  }, [jobs, onAllComplete]);

  // Stats
  const completedCount = jobs.filter((j) => j.status === 'completed').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const inProgressCount = jobs.filter(
    (j) => j.status === 'uploading' || j.status === 'queued' || j.status === 'processing'
  ).length;
  const totalProgress =
    jobs.length > 0
      ? Math.round(
          jobs.reduce((acc, j) => acc + (j.status === 'completed' ? 100 : j.progress), 0) /
            jobs.length
        )
      : 0;

  // Download all completed files
  const downloadAll = () => {
    const completedJobs = jobs.filter((j) => j.status === 'completed' && j.downloadUrl);
    completedJobs.forEach((job, index) => {
      // Stagger downloads to prevent browser blocking
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = job.downloadUrl!;
        link.download = '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 500);
    });
  };

  const getStatusIcon = (status: BulkJob['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" strokeWidth={1.5} />;
      case 'queued':
        return <Clock className="h-4 w-4 text-amber-500" strokeWidth={1.5} />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.5} />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.5} />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" strokeWidth={1.5} />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />;
    }
  };

  const getStatusLabel = (status: BulkJob['status']) => {
    switch (status) {
      case 'uploading':
        return 'Uploading';
      case 'queued':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      case 'cancelled':
        return 'Cancelled';
    }
  };

  return (
    <Card className="border-border/60 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Bulk Conversion Progress</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
            )}
          </Button>
        </div>

        {/* Overall progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {completedCount} of {jobs.length} completed
              {failedCount > 0 && ` (${failedCount} failed)`}
            </span>
            <span className="font-mono">{totalProgress}%</span>
          </div>
          <Progress value={totalProgress} />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Expanded job list */}
        {expanded && (
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg p-3',
                  job.status === 'completed'
                    ? 'bg-emerald-500/5'
                    : job.status === 'failed'
                      ? 'bg-destructive/5'
                      : 'bg-accent/30'
                )}
              >
                {/* Status icon */}
                <div className="shrink-0">{getStatusIcon(job.status)}</div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{job.fileName}</p>
                    <Badge variant="outline" className="shrink-0 font-mono text-[10px]">
                      {job.inputFormat.toUpperCase()} → {job.outputFormat.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Progress or status text */}
                  {(job.status === 'uploading' || job.status === 'processing') && (
                    <div className="mt-1.5 space-y-1">
                      <Progress
                        value={job.status === 'uploading' ? job.uploadProgress : job.progress}
                        className="h-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {job.status === 'uploading'
                          ? `Uploading... ${job.uploadProgress || 0}%`
                          : job.currentStage || `Processing... ${job.progress}%`}
                      </p>
                    </div>
                  )}

                  {job.status === 'queued' && (
                    <p className="mt-1 text-xs text-muted-foreground">Waiting in queue...</p>
                  )}

                  {job.status === 'failed' && job.errorMessage && (
                    <p className="mt-1 truncate text-xs text-destructive">{job.errorMessage}</p>
                  )}

                  {job.status === 'completed' && job.processingTimeMs && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Completed in {formatDuration(job.processingTimeMs)}
                    </p>
                  )}
                </div>

                {/* Download button */}
                {job.status === 'completed' && job.downloadUrl && (
                  <Button variant="ghost" size="icon" className="shrink-0" asChild>
                    <a href={job.downloadUrl} download>
                      <Download className="h-4 w-4" strokeWidth={1.5} />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        {completedCount > 0 && (
          <Button onClick={downloadAll} className="w-full">
            <DownloadCloud className="mr-2 h-4 w-4" strokeWidth={1.5} />
            Download All ({completedCount} file{completedCount !== 1 ? 's' : ''})
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
