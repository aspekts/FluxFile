import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import type { ConversionSettings, DocumentFormat } from '@fluxfile/types';
import { DOCUMENT_PRESETS } from '@fluxfile/config';

export interface DocumentConversionResult {
  outputPath: string;
  fileSize: number;
}

/**
 * Map output format to the LibreOffice filter name.
 */
function getLibreOfficeFilter(outputFormat: DocumentFormat): string {
  const filterMap: Record<string, string> = {
    pdf: 'pdf',
    docx: 'docx',
    xlsx: 'xlsx',
    txt: 'txt',
    csv: 'csv',
    odt: 'odt',
    rtf: 'rtf',
  };
  return filterMap[outputFormat] || outputFormat;
}

/**
 * Determine the LibreOffice output file extension for a given target format.
 */
function getOutputExtension(outputFormat: DocumentFormat): string {
  return outputFormat;
}

/**
 * Convert a document using LibreOffice's headless mode.
 *
 * LibreOffice does not provide real-time progress for conversions,
 * so we report synthetic progress milestones.
 */
export async function convertDocument(
  inputPath: string,
  outputDir: string,
  outputFormat: DocumentFormat,
  qualityPreset: string | undefined,
  customSettings: ConversionSettings | undefined,
  onProgress?: (percent: number) => void
): Promise<DocumentConversionResult> {
  // Determine settings
  let settings: ConversionSettings = {};
  if (customSettings) {
    settings = customSettings;
  } else if (qualityPreset) {
    settings = DOCUMENT_PRESETS[qualityPreset] || DOCUMENT_PRESETS['standard'] || {};
  }

  onProgress?.(10);

  const filter = getLibreOfficeFilter(outputFormat);

  // Build LibreOffice command arguments
  const args: string[] = [
    '--headless',
    '--norestore',
    '--nolockcheck',
    '--nologo',
    '--convert-to',
    filter,
    '--outdir',
    outputDir,
    inputPath,
  ];

  onProgress?.(20);

  return new Promise((resolve, reject) => {
    // Try common LibreOffice binary names
    const binaryNames = ['libreoffice', 'soffice', '/usr/bin/libreoffice', '/usr/bin/soffice'];
    let binaryToUse = binaryNames[0];

    // On Windows, try additional paths
    if (process.platform === 'win32') {
      binaryNames.push(
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
      );
    }

    const proc = spawn(binaryToUse, args, {
      env: {
        ...process.env,
        HOME: outputDir, // Prevents lock file issues in containers
      },
    });

    let stderrOutput = '';
    let stdoutOutput = '';

    proc.stdout?.on('data', (data: Buffer) => {
      stdoutOutput += data.toString();
      onProgress?.(50);
    });

    proc.stderr?.on('data', (data: Buffer) => {
      stderrOutput += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`LibreOffice exited with code ${code}: ${stderrOutput || stdoutOutput}`));
        return;
      }

      onProgress?.(80);

      // Find the output file - LibreOffice names it based on the input filename
      const inputBasename = path.basename(inputPath, path.extname(inputPath));
      const expectedExt = getOutputExtension(outputFormat);
      const expectedOutput = path.join(outputDir, `${inputBasename}.${expectedExt}`);

      if (!fs.existsSync(expectedOutput)) {
        // Sometimes LibreOffice uses a slightly different naming - scan the directory
        const files = fs.readdirSync(outputDir);
        const matchingFile = files.find(
          (f) =>
            f.startsWith(inputBasename) &&
            f.endsWith(`.${expectedExt}`) &&
            f !== path.basename(inputPath)
        );

        if (matchingFile) {
          const foundPath = path.join(outputDir, matchingFile);
          const stat = fs.statSync(foundPath);
          onProgress?.(100);
          resolve({
            outputPath: foundPath,
            fileSize: stat.size,
          });
        } else {
          reject(
            new Error(
              `LibreOffice conversion succeeded but output file not found. Expected: ${expectedOutput}. Directory contents: ${files.join(', ')}`
            )
          );
        }
        return;
      }

      const stat = fs.statSync(expectedOutput);
      onProgress?.(100);
      resolve({
        outputPath: expectedOutput,
        fileSize: stat.size,
      });
    });

    proc.on('error', (err) => {
      reject(
        new Error(
          `LibreOffice not found or failed to start: ${err.message}. Ensure LibreOffice is installed.`
        )
      );
    });
  });
}
