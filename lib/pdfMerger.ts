import { PDFDocument, PDFImage, rgb } from 'pdf-lib';
import type { CompressionLevel } from './imageCompression';
import { compressImage, COMPRESSION_PRESETS } from './imageCompression';

export interface ImageProcessingResult {
  id: string;
  file: File;
  thumbnail: string;
  width: number;
  height: number;
  compressedBlob?: Blob;
}

export interface MergeResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  originalSize: number;
  pdfSize: number;
  compressionRatio: number;
}

/**
 * Generate thumbnail for preview
 */
export async function generateThumbnail(file: File, maxSize: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate dimensions maintaining aspect ratio
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Load image and get dimensions
 */
export async function loadImageInfo(file: File): Promise<{ width: number; height: number; thumbnail: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const thumbnail = await generateThumbnail(file);
        resolve({
          width: img.width,
          height: img.height,
          thumbnail,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process image for PDF (compress if needed)
 */
export async function processImageForPdf(
  file: File,
  compressionLevel: CompressionLevel
): Promise<{ blob: Blob; width: number; height: number }> {
  const settings = COMPRESSION_PRESETS[compressionLevel];

  // For balanced, high, and ultra - compress the image
  if (compressionLevel !== 'low') {
    const result = await compressImage(file, compressionLevel);
    return {
      blob: result.blob,
      width: result.newWidth,
      height: result.newHeight,
    };
  }

  // For low compression, just return original
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas'));
          return;
        }

        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width: img.width, height: img.height });
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Merge all images into a single PDF document
 * Optimized for 100+ images with sequential processing
 */
export async function mergeImagesToPdf(
  images: ImageProcessingResult[],
  compressionLevel: CompressionLevel,
  onProgress?: (current: number, total: number, imageId: string) => void
): Promise<MergeResult> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let totalOriginalSize = 0;

  // Process images sequentially to prevent memory issues
  for (let i = 0; i < images.length; i++) {
    const imageInfo = images[i];
    const file = imageInfo.file;
    totalOriginalSize += file.size;

    // Report progress
    if (onProgress) {
      onProgress(i + 1, images.length, imageInfo.id);
    }

    // Process image
    const { blob, width, height } = await processImageForPdf(file, compressionLevel);

    // Convert blob to array buffer
    const arrayBuffer = await blob.arrayBuffer();

    // Embed image in PDF
    let pdfImage: PDFImage;
    try {
      pdfImage = await pdfDoc.embedJpg(arrayBuffer);
    } catch {
      // If JPG fails, try as PNG
      try {
        pdfImage = await pdfDoc.embedPng(arrayBuffer);
      } catch {
        throw new Error(`Failed to embed image: ${file.name}`);
      }
    }

    // Add a new page with the image dimensions
    const page = pdfDoc.addPage([width, height]);

    // Draw the image on the page
    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    });

    // Add footer branding
    page.drawText('Generated by zorPDF.com', {
      x: 20,
      y: 15,
      size: 10,
      color: rgb(0.7, 0.7, 0.7),
    });

    // Release memory
    pdfImage = undefined as any;
  }

  // Save the PDF
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  // Generate branded filename
  const baseName = images[0].file.name.replace(/\.[^.]+$/, '');
  const filename = `zorPDF.com-${baseName}.pdf`;

  return {
    blob,
    filename,
    pageCount: images.length,
    originalSize: totalOriginalSize,
    pdfSize: blob.size,
    compressionRatio: totalOriginalSize / blob.size,
  };
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
