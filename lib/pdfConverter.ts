import { jsPDF } from 'jspdf';
import type { CompressionLevel, CompressionResult } from './imageCompression';
import { compressImage, COMPRESSION_PRESETS, analyzeImage, calculateAdaptiveQuality } from './imageCompression';

export interface PdfConversionResult {
  blob: Blob;
  filename: string;
  originalSize: number;
  pdfSize: number;
  compressionRatio: number;
  pageWidth: number;
  pageHeight: number;
  imageCount: number;
  compressionLevel: CompressionLevel;
  adaptiveQuality: number;
}

export interface ImageProcessingResult {
  compressedBlob: Blob;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  originalSize: number;
  compressedSize: number;
  dpi: number;
  quality: number;
}

/**
 * Determine optimal DPI based on content analysis
 */
export function determineOptimalDPI(
  isDocument: boolean,
  hasText: boolean,
  compressionLevel: CompressionLevel
): number {
  const baseDPI = COMPRESSION_PRESETS[compressionLevel].preserveDPI;

  // Documents with text need higher DPI for readability
  if (isDocument && hasText) {
    return Math.max(baseDPI, 200);
  }

  if (isDocument) {
    return Math.max(baseDPI, 150);
  }

  return baseDPI;
}

/**
 * Convert a single image to PDF with compression
 */
export async function convertImageToPdf(
  files: File[],
  compressionLevel: CompressionLevel = 'balanced',
  onProgress?: (fileIndex: number, progress: number) => void
): Promise<PdfConversionResult> {
  if (files.length === 0) {
    throw new Error('No files provided');
  }

  const settings = COMPRESSION_PRESETS[compressionLevel];
  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  const processedImages: ImageProcessingResult[] = [];

  // Process each image
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    totalOriginalSize += file.size;

    if (onProgress) {
      onProgress(i, 0);
    }

    // Load and analyze image
    const imgData = await readImageFile(file);
    const img = await loadImage(imgData);

    // Analyze image for document detection
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to create canvas');

    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const analysis = await analyzeImage(imageData);

    // Calculate adaptive quality
    const adaptiveQuality = calculateAdaptiveQuality(analysis, settings.quality);
    const optimalDPI = determineOptimalDPI(analysis.isDocument, analysis.hasText, compressionLevel);

    // Calculate new dimensions
    let newWidth = img.width;
    let newHeight = img.height;

    if (settings.enableResize) {
      const ratio = Math.min(settings.maxWidth / img.width, settings.maxHeight / img.height);
      if (ratio < 1) {
        newWidth = Math.round(img.width * ratio);
        newHeight = Math.round(img.height * ratio);
      }
    }

    // Create optimized canvas
    canvas.width = newWidth;
    canvas.height = newHeight;
    const optCtx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });
    if (!optCtx) throw new Error('Failed to create optimized canvas');

    optCtx.imageSmoothingEnabled = true;
    optCtx.imageSmoothingQuality = 'high';
    optCtx.drawImage(img, 0, 0, newWidth, newHeight);

    // Convert to optimized JPEG
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to compress image'));
        },
        'image/jpeg',
        adaptiveQuality / 100
      );
    });

    totalCompressedSize += compressedBlob.size;

    processedImages.push({
      compressedBlob,
      originalWidth: img.width,
      originalHeight: img.height,
      newWidth,
      newHeight,
      originalSize: file.size,
      compressedSize: compressedBlob.size,
      dpi: optimalDPI,
      quality: adaptiveQuality,
    });

    if (onProgress) {
      onProgress(i, 100);
    }
  }

  // Create PDF
  const pdf = new jsPDF({
    orientation: processedImages[0].newWidth > processedImages[0].newHeight ? 'landscape' : 'portrait',
    unit: 'px',
    format: [processedImages[0].newWidth, processedImages[0].newHeight],
    compress: true,
  });

  // Add first page
  const firstImgUrl = URL.createObjectURL(processedImages[0].compressedBlob);
  const firstImg = await loadImage(firstImgUrl);

  pdf.addImage(
    firstImg,
    'JPEG',
    0,
    0,
    processedImages[0].newWidth,
    processedImages[0].newHeight,
    undefined,
    'MEDIUM'
  );

  URL.revokeObjectURL(firstImgUrl);

  // Add remaining pages
  for (let i = 1; i < processedImages.length; i++) {
    const processedImg = processedImages[i];

    pdf.addPage([processedImg.newWidth, processedImg.newHeight], processedImg.newWidth > processedImg.newHeight ? 'landscape' : 'portrait');

    const imgUrl = URL.createObjectURL(processedImg.compressedBlob);
    const img = await loadImage(imgUrl);

    pdf.addImage(
      img,
      'JPEG',
      0,
      0,
      processedImg.newWidth,
      processedImg.newHeight,
      undefined,
      'MEDIUM'
    );

    URL.revokeObjectURL(imgUrl);
  }

  // Generate PDF
  const pdfBlob = pdf.output('blob');

  // Generate filename
  const baseName = files[0].name.replace(/\.[^.]+$/, '');
  const filename = files.length === 1 ? `zorpdf.com-${baseName}.pdf` : `zorpdf.com-${baseName}-and-${files.length - 1}-more.pdf`;

  return {
    blob: pdfBlob,
    filename,
    originalSize: totalOriginalSize,
    pdfSize: pdfBlob.size,
    compressionRatio: totalOriginalSize / pdfBlob.size,
    pageWidth: processedImages[0].newWidth,
    pageHeight: processedImages[0].newHeight,
    imageCount: files.length,
    compressionLevel,
    adaptiveQuality: processedImages[0].quality,
  };
}

/**
 * Read image file as data URL
 */
function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load image from data URL
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

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
  const compressionEstimate = 0.3 + (qualityFactor * 0.5); // 30-80% of original

  // PDF overhead is around 10-20%
  const pdfOverhead = 1.15;

  const estimatedSize = totalSize * compressionEstimate * pdfOverhead;

  // Range based on content complexity
  return {
    minSize: Math.round(estimatedSize * 0.5),
    maxSize: Math.round(estimatedSize * 1.2),
  };
}
