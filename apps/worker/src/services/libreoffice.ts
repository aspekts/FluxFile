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
 * LibreOffice requires specific filter names, not just extensions.
 * See: https://help.libreoffice.org/latest/en-US/text/shared/guide/convertfilters.html
 */
function getLibreOfficeFilter(outputFormat: DocumentFormat, inputFormat?: string): string {
  // For text output, we need different filters based on input type
  if (outputFormat === 'txt') {
    return 'Text (encoded):UTF8';
  }

  const filterMap: Record<string, string> = {
    pdf: 'pdf',
    docx: 'MS Word 2007 XML',
    xlsx: 'Calc MS Excel 2007 XML',
    csv: 'Text - txt - csv (StarCalc)',
    odt: 'writer8',
    rtf: 'Rich Text Format',
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
 * Recursively search for a file with the given extension in a directory.
 */
function findOutputFile(
  searchDirs: string[],
  inputBasename: string,
  expectedExt: string,
  inputFileName: string
): string | null {
  for (const dir of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const files = fs.readdirSync(dir);
      // First, try exact match
      const exactMatch = `${inputBasename}.${expectedExt}`;
      if (files.includes(exactMatch)) {
        return path.join(dir, exactMatch);
      }

      // Then try any file with the right extension that's not the input
      const matchingFile = files.find((f) => f.endsWith(`.${expectedExt}`) && f !== inputFileName);
      if (matchingFile) {
        return path.join(dir, matchingFile);
      }
    } catch (e) {
      // Directory not readable, skip
    }
  }
  return null;
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

  // Ensure we use absolute paths (LibreOffice can have issues with relative paths)
  const absOutputDir = path.resolve(outputDir);
  const absInputPath = path.resolve(inputPath);

  // Ensure output directory exists
  if (!fs.existsSync(absOutputDir)) {
    fs.mkdirSync(absOutputDir, { recursive: true });
  }

  // Build LibreOffice command arguments
  const args: string[] = [
    '--headless',
    '--norestore',
    '--nolockcheck',
    '--nologo',
    '--convert-to',
    filter,
    '--outdir',
    absOutputDir,
    absInputPath,
  ];

  console.log(`LibreOffice command: libreoffice ${args.join(' ')}`);

  onProgress?.(20);

  return new Promise((resolve, reject) => {
    // Try common LibreOffice binary names
    const binaryNames = ['libreoffice', 'soffice', '/usr/bin/libreoffice', '/usr/bin/soffice'];
    let binaryToUse = binaryNames[0];

    // On macOS, try the app bundle path
    if (process.platform === 'darwin') {
      binaryNames.push('/Applications/LibreOffice.app/Contents/MacOS/soffice');
    }

    // On Windows, try additional paths
    if (process.platform === 'win32') {
      binaryNames.push(
        'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
        'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe'
      );
    }

    // Create a temporary user profile directory to avoid conflicts
    const userProfileDir = path.join(absOutputDir, '.libreoffice-profile');
    if (!fs.existsSync(userProfileDir)) {
      fs.mkdirSync(userProfileDir, { recursive: true });
    }

    const proc = spawn(binaryToUse, args, {
      cwd: absOutputDir, // Run from the output directory
      env: {
        ...process.env,
        HOME: userProfileDir, // Use dedicated profile dir to prevent lock issues
      },
    });

    let stderrOutput = '';
    let stdoutOutput = '';

    proc.stdout?.on('data', (data: Buffer) => {
      const text = data.toString();
      stdoutOutput += text;
      console.log(`LibreOffice stdout: ${text}`);
      onProgress?.(50);
    });

    proc.stderr?.on('data', (data: Buffer) => {
      const text = data.toString();
      stderrOutput += text;
      console.log(`LibreOffice stderr: ${text}`);
    });

    proc.on('close', async (code) => {
      console.log(`LibreOffice exited with code: ${code}`);
      console.log(`LibreOffice stdout: ${stdoutOutput}`);
      console.log(`LibreOffice stderr: ${stderrOutput}`);

      if (code !== 0) {
        reject(new Error(`LibreOffice exited with code ${code}: ${stderrOutput || stdoutOutput}`));
        return;
      }

      onProgress?.(80);

      // Find the output file - LibreOffice names it based on the input filename
      const inputBasename = path.basename(absInputPath, path.extname(absInputPath));
      const inputFileName = path.basename(absInputPath);
      const expectedExt = getOutputExtension(outputFormat);
      const inputDir = path.dirname(absInputPath);

      // Search in multiple locations where LibreOffice might have put the file
      const searchDirs = [
        absOutputDir, // Specified output directory
        inputDir, // Same directory as input file
        process.cwd(), // Current working directory
      ];

      // LibreOffice sometimes takes a moment to write the file - wait and retry
      const maxRetries = 5;
      const retryDelay = 500; // ms

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          console.log(`Retry ${attempt}/${maxRetries} - waiting for output file...`);
          await new Promise((r) => setTimeout(r, retryDelay));
        }

        console.log(`Searching for output file in: ${searchDirs.join(', ')}`);
        console.log(`Looking for: ${inputBasename}.${expectedExt}`);

        // List contents of each directory for debugging
        for (const dir of searchDirs) {
          if (fs.existsSync(dir)) {
            try {
              const files = fs.readdirSync(dir);
              console.log(`Contents of ${dir}: ${files.join(', ') || '(empty)'}`);
            } catch (e) {
              console.log(`Cannot read ${dir}: ${e}`);
            }
          }
        }

        const foundPath = findOutputFile(searchDirs, inputBasename, expectedExt, inputFileName);

        if (foundPath) {
          const stat = fs.statSync(foundPath);
          console.log(`Found output file: ${foundPath} (${stat.size} bytes)`);
          onProgress?.(100);
          resolve({
            outputPath: foundPath,
            fileSize: stat.size,
          });
          return;
        }
      }

      reject(
        new Error(
          `LibreOffice conversion succeeded but output file not found after ${maxRetries} attempts. ` +
            `Expected: ${inputBasename}.${expectedExt} in ${searchDirs.join(' or ')}. ` +
            `stdout: ${stdoutOutput}. stderr: ${stderrOutput}`
        )
      );
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
