export type CompressionLevel = 'low' | 'balanced' | 'high' | 'ultra';

import { getZorPdfFileName } from './fileNaming';

export interface CompressionSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  enableResize: boolean;
  removeMetadata: boolean;
  preserveDPI: number;
}

export const COMPRESSION_PRESETS: Record<CompressionLevel, CompressionSettings> = {
  low: {
    quality: 92,
    maxWidth: 3508,
    maxHeight: 3508,
    enableResize: false,
    removeMetadata: true,
    preserveDPI: 300,
  },
  balanced: {
    quality: 88,
    maxWidth: 2480,
    maxHeight: 3508,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 300,
  },
  high: {
    quality: 78,
    maxWidth: 2000,
    maxHeight: 2800,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 220,
  },
  ultra: {
    quality: 65,
    maxWidth: 1654,
    maxHeight: 2339,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 160,
  },
};

export interface CompressionResult {
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  newWidth: number;
  newHeight: number;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
}

export interface ImageAnalysis {
  isDocument: boolean;
  hasText: boolean;
  complexity: 'low' | 'medium' | 'high';
  dominantColors: string[];
  brightness: number;
}

type CropBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const WHITE_THRESHOLD = 245;
const MIN_CONTENT_THRESHOLD = 238;
const CROP_PADDING_RATIO = 0.015;

function isNearWhite(r: number, g: number, b: number): boolean {
  return r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD;
}

function isContentPixel(r: number, g: number, b: number): boolean {
  // Text/lines/photo area detect. Pure white background ignore.
  return !(r >= MIN_CONTENT_THRESHOLD && g >= MIN_CONTENT_THRESHOLD && b >= MIN_CONTENT_THRESHOLD);
}

function getAutoCropBox(imageData: ImageData): CropBox {
  const { width, height, data } = imageData;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  // Fast scan, but enough for document photos.
  const step = Math.max(1, Math.floor(Math.min(width, height) / 1200));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isContentPixel(r, g, b)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no content detected, keep original.
  if (maxX < 0 || maxY < 0 || minX >= width || minY >= height) {
    return { x: 0, y: 0, width, height };
  }

  const contentWidth = maxX - minX + 1;
  const contentHeight = maxY - minY + 1;

  // Avoid over-cropping normal photos. Only crop when content is meaningfully inside a white page/background.
  const marginLeft = minX;
  const marginTop = minY;
  const marginRight = width - maxX - 1;
  const marginBottom = height - maxY - 1;

  const hasBigWhiteMargins =
    marginLeft > width * 0.025 ||
    marginTop > height * 0.025 ||
    marginRight > width * 0.025 ||
    marginBottom > height * 0.025;

  const contentRatio = (contentWidth * contentHeight) / (width * height);

  if (!hasBigWhiteMargins || contentRatio > 0.98) {
    return { x: 0, y: 0, width, height };
  }

  const pad = Math.round(Math.min(width, height) * CROP_PADDING_RATIO);

  const x = Math.max(0, minX - pad);
  const y = Math.max(0, minY - pad);
  const right = Math.min(width, maxX + pad);
  const bottom = Math.min(height, maxY + pad);

  return {
    x,
    y,
    width: Math.max(1, right - x),
    height: Math.max(1, bottom - y),
  };
}

function canvasHasMostlyWhiteBorder(ctx: CanvasRenderingContext2D, width: number, height: number): boolean {
  const sampleSize = Math.max(2, Math.floor(Math.min(width, height) * 0.02));
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let borderPixels = 0;
  let whitePixels = 0;

  function checkPixel(x: number, y: number) {
    const idx = (y * width + x) * 4;
    borderPixels += 1;
    if (isNearWhite(data[idx], data[idx + 1], data[idx + 2])) whitePixels += 1;
  }

  const step = Math.max(1, Math.floor(Math.min(width, height) / 600));

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < sampleSize; x += step) checkPixel(x, y);
    for (let x = width - sampleSize; x < width; x += step) checkPixel(x, y);
  }

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < sampleSize; y += step) checkPixel(x, y);
    for (let y = height - sampleSize; y < height; y += step) checkPixel(x, y);
  }

  return borderPixels > 0 && whitePixels / borderPixels > 0.78;
}

/**
 * Analyze image to detect document characteristics
 */
export async function analyzeImage(imageData: ImageData): Promise<ImageAnalysis> {
  const data = imageData.data;
  let totalBrightness = 0;
  let edgeCount = 0;
  const uniqueColors = new Set<string>();
  let textIndicator = 0;

  const step = 4;
  let sampledPixels = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;

    const colorKey = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
    uniqueColors.add(colorKey);

    if (i + step * 4 < data.length) {
      const nextR = data[i + step * 4];
      const nextG = data[i + step * 4 + 1];
      const nextB = data[i + step * 4 + 2];
      const diff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
      if (diff > 100) edgeCount++;
    }

    if (brightness < 40 || brightness > 225) textIndicator++;
    sampledPixels++;
  }

  const avgBrightness = totalBrightness / sampledPixels;
  const edgeDensity = edgeCount / sampledPixels;
  const colorComplexity = uniqueColors.size;
  const textDensity = textIndicator / sampledPixels;

  const isDocument = textDensity > 0.22 && colorComplexity < 90;
  const hasText = edgeDensity > 0.08;

  let complexity: 'low' | 'medium' | 'high';
  if (colorComplexity < 30 && edgeDensity < 0.1) {
    complexity = 'low';
  } else if (colorComplexity > 100 || edgeDensity > 0.3) {
    complexity = 'high';
  } else {
    complexity = 'medium';
  }

  return {
    isDocument,
    hasText,
    complexity,
    dominantColors: Array.from(uniqueColors).slice(0, 5),
    brightness: avgBrightness,
  };
}

/**
 * Calculate adaptive quality based on image analysis
 */
export function calculateAdaptiveQuality(
  analysis: ImageAnalysis,
  baseQuality: number
): number {
  let quality = baseQuality;

  if (analysis.isDocument || analysis.hasText) {
    quality = Math.max(quality, 82);
    if (analysis.complexity === 'high') quality = Math.min(quality + 8, 92);
  }

  if (analysis.complexity === 'low' && !analysis.isDocument) {
    quality = Math.max(quality - 5, 70);
  }

  if (analysis.brightness < 50 || analysis.brightness > 200) {
    quality = Math.min(quality + 4, 92);
  }

  return Math.max(65, Math.min(92, quality));
}

/**
 * Resize image while maintaining aspect ratio
 */
export function resizeImage(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}

/**
 * Compress an image with auto white-margin crop.
 * This is made for document JPG/PNG to PDF conversion.
 */
export async function compressImage(
  file: File,
  level: CompressionLevel = 'balanced'
): Promise<CompressionResult> {
  const settings = COMPRESSION_PRESETS[level];
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const imgData = e.target?.result as string;
      if (!imgData) {
        reject(new Error('Failed to read image'));
        return;
      }

      const img = new Image();

      img.onload = async () => {
        try {
          const originalWidth = img.width;
          const originalHeight = img.height;

          const scanCanvas = document.createElement('canvas');
          scanCanvas.width = originalWidth;
          scanCanvas.height = originalHeight;

          const scanCtx = scanCanvas.getContext('2d', {
            alpha: false,
            willReadFrequently: true,
          });

          if (!scanCtx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          scanCtx.fillStyle = '#ffffff';
          scanCtx.fillRect(0, 0, originalWidth, originalHeight);
          scanCtx.imageSmoothingEnabled = true;
          scanCtx.imageSmoothingQuality = 'high';
          scanCtx.drawImage(img, 0, 0);

          const originalImageData = scanCtx.getImageData(0, 0, originalWidth, originalHeight);
          let cropBox = getAutoCropBox(originalImageData);

          // Crop only if border is really white. This prevents damaging normal images.
          const borderIsWhite = canvasHasMostlyWhiteBorder(scanCtx, originalWidth, originalHeight);
          if (!borderIsWhite) {
            cropBox = { x: 0, y: 0, width: originalWidth, height: originalHeight };
          }

          let newWidth = cropBox.width;
          let newHeight = cropBox.height;

          if (settings.enableResize) {
            const resized = resizeImage(
              cropBox.width,
              cropBox.height,
              settings.maxWidth,
              settings.maxHeight
            );
            newWidth = resized.width;
            newHeight = resized.height;
          }

          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext('2d', {
            alpha: false,
            willReadFrequently: true,
          });

          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, newWidth, newHeight);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            cropBox.x,
            cropBox.y,
            cropBox.width,
            cropBox.height,
            0,
            0,
            newWidth,
            newHeight
          );

          const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
          const analysis = await analyzeImage(imageData);
          const adaptiveQuality = calculateAdaptiveQuality(analysis, settings.quality);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const compressedSize = blob.size;
              const compressionRatio = originalSize / compressedSize;

              resolve({
                blob,
                originalWidth,
                originalHeight,
                newWidth,
                newHeight,
                originalSize,
                compressedSize,
                compressionRatio,
                quality: adaptiveQuality,
              });
            },
            'image/jpeg',
            adaptiveQuality / 100
          );
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imgData;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Estimate PDF size based on image properties
 */
export function estimatePdfSize(
  originalSize: number,
  compressionRatio: number,
  imageCount: number
): number {
  const baseCompressedSize = originalSize / compressionRatio;
  const pdfOverhead = 1.15;
  const totalEstimate = baseCompressedSize * pdfOverhead * imageCount;
  return Math.max(totalEstimate, 10 * 1024);
}

/**
 * Format bytes for display
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Calculate compression percentage
 */
export function calculateCompressionPercentage(
  original: number,
  compressed: number
): number {
  return Math.round(((original - compressed) / original) * 100);
}
