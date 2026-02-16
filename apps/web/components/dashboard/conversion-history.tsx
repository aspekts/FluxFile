'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatFileSize, formatDate, formatDuration } from '@/lib/utils';

interface Job {
  id: string;
  inputFormat: string;
  outputFormat: string;
  inputFileSize: string;
  outputFileSize: string | null;
  status: string;
  progress: number;
  currentStage: string | null;
  createdAt: string;
  completedAt: string | null;
  processingTimeMs: number | null;
  errorMessage: string | null;
}

interface ConversionHistoryProps {
  jobs: Job[];
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'PROCESSING':
      return <Badge variant="default">Processing</Badge>;
    case 'PENDING':
      return <Badge variant="secondary">Pending</Badge>;
    case 'SCANNING':
      return <Badge variant="secondary">Scanning</Badge>;
    case 'FAILED':
      return <Badge variant="destructive">Failed</Badge>;
    case 'CANCELLED':
      return <Badge variant="outline">Cancelled</Badge>;
    case 'EXPIRED':
      return <Badge variant="outline">Expired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export function ConversionHistory({ jobs }: ConversionHistoryProps) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">No conversions yet</p>
        <p className="text-sm text-muted-foreground">Your conversion history will appear here.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Conversion</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Duration</TableHead>
          <TableHead className="text-right">Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium">
              {job.inputFormat.toUpperCase()} → {job.outputFormat.toUpperCase()}
            </TableCell>
            <TableCell>
              <span className="text-sm">
                {formatFileSize(parseInt(job.inputFileSize))}
                {job.outputFileSize && (
                  <span className="text-muted-foreground">
                    {' → '}
                    {formatFileSize(parseInt(job.outputFileSize))}
                  </span>
                )}
              </span>
            </TableCell>
            <TableCell>{getStatusBadge(job.status)}</TableCell>
            <TableCell>
              {job.processingTimeMs ? (
                <span className="text-sm">{formatDuration(job.processingTimeMs)}</span>
              ) : (
                <span className="text-sm text-muted-foreground">--</span>
              )}
            </TableCell>
            <TableCell className="text-right text-sm text-muted-foreground">
              {formatDate(job.createdAt)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
