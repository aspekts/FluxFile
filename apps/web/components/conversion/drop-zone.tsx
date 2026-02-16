'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, AlertCircle } from 'lucide-react';
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
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFile ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <File className="h-8 w-8 text-primary" />
            <div>
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload
            className={cn(
              'mb-4 h-10 w-10',
              isDragActive ? 'text-primary' : 'text-muted-foreground'
            )}
          />
          <p className="mb-1 text-lg font-medium">
            {isDragActive ? 'Drop your file here' : 'Drag & drop a file here'}
          </p>
          <p className="text-sm text-muted-foreground">or click to browse your files</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Supports audio, video, document, and image files
          </p>
        </div>
      )}
    </div>
  );
}
