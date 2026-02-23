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
  onFilesSelect?: (files: File[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  tier?: AccountTier;
  disabled?: boolean;
  className?: string;
}

export function DropZone({
  onFileSelect,
  onFilesSelect,
  multiple = false,
  maxFiles = 20,
  tier = 'FREE',
  disabled = false,
  className,
}: DropZoneProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);

      if (acceptedFiles.length === 0) {
        return;
      }

      // Validate all files
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of acceptedFiles) {
        const validation = validateFile(
          { name: file.name, type: file.type, size: file.size },
          tier
        );
        if (validation.valid) {
          validFiles.push(file);
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (errors.length > 0 && validFiles.length === 0) {
        setError(errors[0]);
        return;
      }

      if (errors.length > 0) {
        setError(`${errors.length} file(s) skipped due to validation errors`);
      }

      if (multiple) {
        // Limit total files
        const totalFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
        setSelectedFiles(totalFiles);
        onFilesSelect?.(totalFiles);
      } else {
        const file = validFiles[0];
        setSelectedFiles([file]);
        onFileSelect(file);
      }
    },
    [onFileSelect, onFilesSelect, multiple, maxFiles, selectedFiles, tier]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    disabled,
    accept: getAcceptedMimeTypes(),
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection) {
        setError(rejection.errors[0]?.message || 'File type not supported');
      }
    },
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (multiple) {
      onFilesSelect?.(newFiles);
    } else if (newFiles.length === 0) {
      setError(null);
    }
  };

  const removeAllFiles = () => {
    setSelectedFiles([]);
    setError(null);
    if (multiple) {
      onFilesSelect?.([]);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" strokeWidth={1.5} />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedFiles.length > 0 ? (
        <div className="space-y-2">
          {/* File list */}
          <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-xl border border-border/60 bg-background p-3">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between rounded-lg bg-accent/30 p-3"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileType2 className="h-4 w-4 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{file.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              {multiple && ` (max ${maxFiles})`}
            </p>
            <div className="flex gap-2">
              {multiple && selectedFiles.length < maxFiles && (
                <Button variant="outline" size="sm" {...getRootProps()}>
                  <input {...getInputProps()} />
                  Add more
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={removeAllFiles}>
                Clear all
              </Button>
            </div>
          </div>
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
            {isDragActive
              ? `Drop your file${multiple ? 's' : ''} here`
              : `Drag & drop ${multiple ? 'files' : 'a file'} here`}
          </p>
          <p className="text-sm text-muted-foreground">or click to browse your files</p>
          <p className="mt-6 text-xs text-muted-foreground">
            Supports audio, video, document, and image files
            {multiple && ` (up to ${maxFiles} files)`}
          </p>
        </div>
      )}
    </div>
  );
}
