'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getOutputFormats, getFormatLabel } from '@/lib/utils/formats';
import { getFormatCategory } from '@fluxfile/config';

interface FormatSelectorProps {
  inputFormat: string;
  selectedFormat: string;
  onFormatChange: (format: string) => void;
  disabled?: boolean;
}

export function FormatSelector({
  inputFormat,
  selectedFormat,
  onFormatChange,
  disabled = false,
}: FormatSelectorProps) {
  const outputFormats = useMemo(() => getOutputFormats(inputFormat), [inputFormat]);
  const category = useMemo(() => getFormatCategory(inputFormat), [inputFormat]);

  if (outputFormats.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No conversion options available for this format.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Convert to</label>
      <Select value={selectedFormat} onValueChange={onFormatChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select output format" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel className="font-mono text-xs uppercase tracking-wider">
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Formats'}
            </SelectLabel>
            {outputFormats.map((format) => (
              <SelectItem key={format} value={format} className="font-mono text-sm">
                {getFormatLabel(format)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
