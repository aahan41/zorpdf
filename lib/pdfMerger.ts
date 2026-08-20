import { PDFDocument, PDFImage } from 'pdf-lib';
import type { CompressionLevel } from './imageCompression';
import { compressImage } from './imageCompression';
import { getZorPdfFileName } from './fileNaming';

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
export async function generateThumbnail(
  file: File,
  maxSize: number = 150
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');

        let width = img.width;
        let height = img.height;

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

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Load image information
 */
export async function loadImageInfo(
  file: File
): Promise<{
  width: number;
  height: number;
  thumbnail: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = async () => {
        try {
          const thumbnail = await generateThumbnail(file);

          resolve({
            width: img.width,
            height: img.height,
            thumbnail,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Process image before adding to PDF
 */
export async function processImageForPdf(
  file: File,
  compressionLevel: CompressionLevel
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  // Use original image for low compression
  if (compressionLevel === 'low') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
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
              if (!blob) {
                reject(new Error('Failed to create image blob'));
                return;
              }

              resolve({
                blob,
                width: img.width,
                height: img.height,
              });
            },
            'image/jpeg',
            0.92
          );
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = event.target?.result as string;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  // Compress image for other compression levels
  const result = await compressImage(file, compressionLevel);

  return {
    blob: result.blob,
    width: result.newWidth,
    height: result.newHeight,
  };
}

/**
 * Merge all uploaded images into one PDF.
 *
 * IMPORTANT:
 * - No zorPDF footer
 * - Standard A4 pages
 * - No stretching
 * - No cropping
 * - Original image aspect ratio preserved
 */
export async function mergeImagesToPdf(
  images: ImageProcessingResult[],
  compressionLevel: CompressionLevel,
  onProgress?: (
    current: number,
    total: number,
    imageId: string
  ) => void
): Promise<MergeResult> {
  if (images.length === 0) {
    throw new Error('No images to merge');
  }

  const pdfDoc = await PDFDocument.create();

  let totalOriginalSize = 0;

  // A4 size in PDF points
  const A4_WIDTH = 595.28;
  const A4_HEIGHT = 841.89;

  for (let i = 0; i < images.length; i++) {
    const imageInfo = images[i];
    const file = imageInfo.file;

    totalOriginalSize += file.size;

    // Update progress
    if (onProgress) {
      onProgress(i + 1, images.length, imageInfo.id);
    }

    // Process image
    const {
      blob,
      width,
      height,
    } = await processImageForPdf(
      file,
      compressionLevel
    );

    const arrayBuffer = await blob.arrayBuffer();

    let pdfImage: PDFImage;

    // Try JPG first
    try {
      pdfImage = await pdfDoc.embedJpg(arrayBuffer);
    } catch {
      // If not JPG, try PNG
      try {
        pdfImage = await pdfDoc.embedPng(arrayBuffer);
      } catch {
        throw new Error(
          `Failed to embed image: ${file.name}`
        );
      }
    }

    // Select page orientation based on image
    const isLandscape = width > height;

    const pageWidth = isLandscape
      ? A4_HEIGHT
      : A4_WIDTH;

    const pageHeight = isLandscape
      ? A4_WIDTH
      : A4_HEIGHT;

    // Create A4 page
    const page = pdfDoc.addPage([
      pageWidth,
      pageHeight,
    ]);

    // Calculate proportional scaling.
    // Math.min ensures the complete image fits
    // without cropping or stretching.
    const scale = Math.min(
      pageWidth / width,
      pageHeight / height
    );

    const drawWidth = width * scale;
    const drawHeight = height * scale;

    // Center the image
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    // Draw image on page
    page.drawImage(pdfImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight,
    });

    // NOTE:
    // No "Generated by zorPDF.com" text is added here.
  }

  // Generate PDF
  const pdfBytes = await pdfDoc.save();

  const blob = new Blob(
    [pdfBytes],
    {
      type: 'application/pdf',
    }
  );

  const filename = getZorPdfFileName('pdf');

  return {
    blob,
    filename,
    pageCount: images.length,
    originalSize: totalOriginalSize,
    pdfSize: blob.size,
    compressionRatio:
      totalOriginalSize > 0
        ? totalOriginalSize / blob.size
        : 1,
  };
}

/**
 * Read a file as ArrayBuffer
 */
export function readFileAsArrayBuffer(
  file: File
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target?.result as ArrayBuffer);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsArrayBuffer(file);
  });
}
