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
    quality: 85,
    maxWidth: 2400,
    maxHeight: 2400,
    enableResize: false,
    removeMetadata: true,
    preserveDPI: 300,
  },
  balanced: {
    quality: 80,
    maxWidth: 1800,
    maxHeight: 2200,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 200,
  },
  high: {
    quality: 65,
    maxWidth: 1400,
    maxHeight: 1800,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 150,
  },
  ultra: {
    quality: 50,
    maxWidth: 1000,
    maxHeight: 1300,
    enableResize: true,
    removeMetadata: true,
    preserveDPI: 100,
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

/**
 * Analyze image to detect document characteristics
 */
export async function analyzeImage(imageData: ImageData): Promise<ImageAnalysis> {
  const data = imageData.data;
  let totalBrightness = 0;
  let edgeCount = 0;
  let uniqueColors = new Set<string>();
  let textIndicator = 0;

  // Sample pixels for analysis
  const step = 4;
  let sampledPixels = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate brightness
    const brightness = (r + g + b) / 3;
    totalBrightness += brightness;

    // Count unique colors (quantized)
    const colorKey = `${Math.floor(r / 32)}-${Math.floor(g / 32)}-${Math.floor(b / 32)}`;
    uniqueColors.add(colorKey);

    // Detect sharp edges (potential text)
    if (i + step * 4 < data.length) {
      const nextR = data[i + step * 4];
      const nextG = data[i + step * 4 + 1];
      const nextB = data[i + step * 4 + 2];
      const diff = Math.abs(r - nextR) + Math.abs(g - nextG) + Math.abs(b - nextB);
      if (diff > 100) {
        edgeCount++;
      }
    }

    // Detect high contrast areas (typical in documents)
    if (brightness < 30 || brightness > 225) {
      textIndicator++;
    }

    sampledPixels++;
  }

  const avgBrightness = totalBrightness / sampledPixels;
  const edgeDensity = edgeCount / sampledPixels;
  const colorComplexity = uniqueColors.size;
  const textDensity = textIndicator / sampledPixels;

  // Determine if this is a document
  // Documents typically have: high contrast, fewer colors, many edges (text)
  const isDocument = textDensity > 0.3 && colorComplexity < 50;
  const hasText = edgeDensity > 0.15;

  // Determine complexity
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

  // For documents, preserve more detail
  if (analysis.isDocument || analysis.hasText) {
    quality = Math.max(quality, 70);
    // Documents with text need higher quality
    if (analysis.complexity === 'high') {
      quality = Math.min(quality + 15, 90);
    }
  }

  // For low complexity images, we can use slightly lower quality
  if (analysis.complexity === 'low' && !analysis.isDocument) {
    quality = Math.max(quality - 10, 60);
  }

  // For very bright or dark images, adjust slightly
  if (analysis.brightness < 50 || analysis.brightness > 200) {
    quality = Math.min(quality + 5, 90);
  }

  return Math.max(60, Math.min(90, quality));
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
 * Compress an image with intelligent settings
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

          // Calculate new dimensions
          let newWidth = originalWidth;
          let newHeight = originalHeight;

          if (settings.enableResize) {
            const resized = resizeImage(
              originalWidth,
              originalHeight,
              settings.maxWidth,
              settings.maxHeight
            );
            newWidth = resized.width;
            newHeight = resized.height;
          }

          // Create canvas for processing
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

          // Enable image smoothing for better quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Analyze image for adaptive quality
          const imageData = ctx.getImageData(0, 0, newWidth, newHeight);
          const analysis = await analyzeImage(imageData);
          const adaptiveQuality = calculateAdaptiveQuality(analysis, settings.quality);

          // Convert to optimized JPEG
          const mimeType = 'image/jpeg';
          const quality = adaptiveQuality / 100;

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
            mimeType,
            quality
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
  // PDF adds approximately 10-20% overhead
  const baseCompressedSize = originalSize / compressionRatio;
  const pdfOverhead = 1.15; // 15% overhead for PDF structure
  const totalEstimate = baseCompressedSize * pdfOverhead * imageCount;

  // Minimum PDF size is around 10KB
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
