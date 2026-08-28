import type { CompressionLevel } from './imageCompression';
import { COMPRESSION_PRESETS } from './imageCompression';

/**
 * Estimate PDF size before conversion
 */
export function estimatePdfSize(
  files: File[],
  compressionLevel: CompressionLevel
): { minSize: number; maxSize: number } {
  const settings = COMPRESSION_PRESETS[compressionLevel];
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.size;
  }

  // Estimate compression based on quality
  const qualityFactor = settings.quality / 100;
  const compressionEstimate = 0.3 + (qualityFactor * 0.5);

  // PDF overhead is around 10-20%
  const pdfOverhead = 1.15;

  const estimatedSize = totalSize * compressionEstimate * pdfOverhead;

  return {
    minSize: Math.round(estimatedSize * 0.5),
    maxSize: Math.round(estimatedSize * 1.2),
  };
}

/**
 * Estimate total JPG output size when extracting pages from a PDF.
 *
 * Rasterizing a page to JPG usually lands in a different size range than
 * the source PDF (vector text compresses very differently to pixels), so
 * this uses a wider, quality-driven multiplier range rather than the
 * PDF-specific overhead used above.
 */
export function estimateJpgSizeFromPdf(
  files: File[],
  compressionLevel: CompressionLevel
): { minSize: number; maxSize: number } {
  const settings = COMPRESSION_PRESETS[compressionLevel];
  let totalSize = 0;

  for (const file of files) {
    totalSize += file.size;
  }

  const qualityFactor = settings.quality / 100;

  const lowMultiplier = 0.4 + qualityFactor * 0.6;
  const highMultiplier = 0.8 + qualityFactor * 1.5;

  return {
    minSize: Math.round(totalSize * lowMultiplier),
    maxSize: Math.round(totalSize * highMultiplier),
  };
}
