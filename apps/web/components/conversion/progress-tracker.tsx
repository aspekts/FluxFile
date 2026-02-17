'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2, Download, Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface ProgressTrackerProps {
  jobId: string;
  onComplete?: (downloadUrl: string) => void;
  onError?: (error: string) => void;
}

interface JobStatus {
  id: string;
  status: string;
  progress: number;
  currentStage: string | null;
  errorMessage: string | null;
  processingTimeMs: number | null;
  estimatedTimeMs: number | null;
  downloadUrl: string | null;
  inputFormat: string;
  outputFormat: string;
}

export function ProgressTracker({ jobId, onComplete, onError }: ProgressTrackerProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!polling) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error('Failed to fetch job status');
        const data = await response.json();
        setJob(data);

        if (data.status === 'COMPLETED') {
          setPolling(false);
          if (data.downloadUrl && onComplete) {
            onComplete(data.downloadUrl);
          }
        } else if (data.status === 'FAILED' || data.status === 'CANCELLED') {
          setPolling(false);
          if (onError && data.errorMessage) {
            onError(data.errorMessage);
          }
        }
      } catch (error) {
        console.error('Failed to fetch job status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000);

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete, onError]);

  const handleCancel = async () => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' });
      setPolling(false);
    } catch (error) {
      console.error('Failed to cancel job:', error);
    }
  };

  if (!job) {
    return (
      <Card className="border-border/60 shadow-xl">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" strokeWidth={1.5} />
          <span className="ml-2 text-sm text-muted-foreground">Loading job status...</span>
        </CardContent>
      </Card>
    );
  }

  const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    PENDING: {
      icon: <Clock className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Queued',
      color: 'text-amber-500',
    },
    SCANNING: {
      icon: <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />,
      label: 'Scanning',
      color: 'text-blue-500',
    },
    PROCESSING: {
      icon: <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.5} />,
      label: 'Processing',
      color: 'text-primary',
    },
    COMPLETED: {
      icon: <CheckCircle2 className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Completed',
      color: 'text-emerald-500',
    },
    FAILED: {
      icon: <XCircle className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Failed',
      color: 'text-destructive',
    },
    CANCELLED: {
      icon: <XCircle className="h-5 w-5" strokeWidth={1.5} />,
      label: 'Cancelled',
      color: 'text-muted-foreground',
    },
  };

  const status = statusConfig[job.status] || statusConfig.PENDING;

  return (
    <Card className="border-border/60 shadow-xl">
      <CardContent className="space-y-4 p-6">
        {/* Status header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={status.color}>{status.icon}</span>
            <span className="text-sm font-medium">{status.label}</span>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {job.inputFormat?.toUpperCase()} &rarr; {job.outputFormat?.toUpperCase()}
          </Badge>
        </div>

        {/* Progress bar */}
        {['PENDING', 'SCANNING', 'PROCESSING'].includes(job.status) && (
          <div className="space-y-2">
            <Progress value={job.progress} />
            <div className="flex justify-between font-mono text-xs text-muted-foreground">
              <span>{job.currentStage || 'Waiting...'}</span>
              <span>{job.progress}%</span>
            </div>
            {job.estimatedTimeMs && (
              <p className="font-mono text-xs text-muted-foreground">
                Estimated time: {formatDuration(job.estimatedTimeMs)}
              </p>
            )}
          </div>
        )}

        {/* Error message */}
        {job.status === 'FAILED' && job.errorMessage && (
          <p className="text-sm text-destructive">{job.errorMessage}</p>
        )}

        {/* Completed info */}
        {job.status === 'COMPLETED' && job.processingTimeMs && (
          <p className="font-mono text-sm text-muted-foreground">
            Completed in {formatDuration(job.processingTimeMs)}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {job.status === 'COMPLETED' && job.downloadUrl && (
            <Button asChild className="w-full">
              <a href={job.downloadUrl} download>
                <Download className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Download
              </a>
            </Button>
          )}
          {['PENDING', 'SCANNING', 'PROCESSING'].includes(job.status) && (
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
