/**
 * The result returned by any format-specific processor.
 */
export interface ProcessorResult {
  /** Absolute path to the converted output file on disk. */
  outputPath: string;
  /** Size of the output file in bytes. */
  outputFileSize: number;
}
