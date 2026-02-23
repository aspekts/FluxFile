import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

export interface PdfToTextResult {
  outputPath: string;
  fileSize: number;
}

/**
 * Convert a PDF to plain text using pdftotext (from poppler-utils).
 * This provides much better text extraction than LibreOffice.
 */
export async function convertPdfToText(
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<PdfToTextResult> {
  onProgress?.(10);

  const absInputPath = path.resolve(inputPath);
  const absOutputPath = path.resolve(outputPath);

  // Ensure output directory exists
  const outputDir = path.dirname(absOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`pdftotext command: pdftotext -layout "${absInputPath}" "${absOutputPath}"`);

  onProgress?.(20);

  return new Promise((resolve, reject) => {
    // pdftotext arguments:
    // -layout: Maintain original physical layout
    // -enc UTF-8: Use UTF-8 encoding for output
    const args = ['-layout', '-enc', 'UTF-8', absInputPath, absOutputPath];

    const proc = spawn('pdftotext', args);

    let stderrOutput = '';

    proc.stderr?.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
      console.log(`pdftotext stderr: ${data.toString()}`);
    });

    proc.on('close', (code) => {
      console.log(`pdftotext exited with code: ${code}`);

      if (code !== 0) {
        reject(new Error(`pdftotext exited with code ${code}: ${stderrOutput}`));
        return;
      }

      onProgress?.(80);

      // Check if output file was created
      if (!fs.existsSync(absOutputPath)) {
        reject(new Error(`pdftotext completed but output file not found: ${absOutputPath}`));
        return;
      }

      const stat = fs.statSync(absOutputPath);
      console.log(`pdftotext output: ${absOutputPath} (${stat.size} bytes)`);

      onProgress?.(100);
      resolve({
        outputPath: absOutputPath,
        fileSize: stat.size,
      });
    });

    proc.on('error', (err) => {
      // If pdftotext is not installed, provide a helpful error
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        reject(
          new Error(
            'pdftotext not found. Install poppler-utils: apt-get install poppler-utils (Linux) or brew install poppler (macOS)'
          )
        );
      } else {
        reject(new Error(`pdftotext failed to start: ${err.message}`));
      }
    });
  });
}
