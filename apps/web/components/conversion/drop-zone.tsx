'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileType2, X, AlertCircle } from 'lucide-react';
import { cn, formatFileSize } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAcceptedMimeTypes } from '@/lib/utils/formats';
import { validateFile } from '@/lib/validation/file-validation';
import type { AccountTier } from '@fluxfile/types';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  tier?: AccountTier;
  disabled?: boolean;
  className?: string;
}

export function DropZone({
  onFileSelect,
  tier = 'FREE',
  disabled = false,
  className,
}: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      const file = acceptedFiles[0];

      // Validate file
      const validation = validateFile({ name: file.name, type: file.type, size: file.size }, tier);

      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        return;
      }

      setSelectedFile(file);
      onFileSelect(file);
    },
    [onFileSelect, tier]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    disabled,
    accept: getAcceptedMimeTypes(),
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        setError(rejection.errors[0]?.message || 'File type not supported');
      }
    },
  });

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFile ? (
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileType2 className="h-5 w-5 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="font-mono text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={removeFile}>
            <X className="h-4 w-4" strokeWidth={1.5} />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'group relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-16 transition-all duration-200',
            isDragActive
              ? 'scale-[1.01] border-solid border-primary bg-primary/5 shadow-lg shadow-primary/10'
              : 'border-border hover:border-primary/50 hover:bg-accent/50 shadow-sm',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <UploadCloud
            className={cn(
              'mb-4 h-10 w-10 transition-colors',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
            strokeWidth={1.5}
          />
          <p className="mb-1 text-base font-medium">
            {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-muted-foreground">or click to browse your files</p>
          <p className="mt-6 text-xs text-muted-foreground">
            Supports audio, video, document, and image files
          </p>
        </div>
      )}
    </div>
  );
}
