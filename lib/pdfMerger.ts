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
 * A4 page size in PDF points
 *
 * 210mm × 297mm
 * 595.28 × 841.89 points
 */
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Small safety margin.
 *
 * This prevents images from touching/crossing
 * the absolute edge of the PDF page.
 *
 * Set to 0 if completely edge-to-edge output is required.
 */
const PAGE_MARGIN = 0;

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
      const src = event.target?.result;

      if (!src || typeof src !== 'string') {
        reject(new Error('Failed to read image'));
        return;
      }

      const img = new Image();

      img.onload = () => {
        try {
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;

          if (!width || !height) {
            reject(new Error('Invalid image dimensions'));
            return;
          }

          /**
           * Keep original aspect ratio
           */
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

          const canvas = document.createElement('canvas');

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Failed to create canvas context'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(
            canvas.toDataURL('image/jpeg', 0.8)
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = src;
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

    reader.onload = async (event) => {
      const src = event.target?.result;

      if (!src || typeof src !== 'string') {
        reject(new Error('Failed to read image'));
        return;
      }

      const img = new Image();

      img.onload = async () => {
        try {
          const width =
            img.naturalWidth || img.width;

          const height =
            img.naturalHeight || img.height;

          if (!width || !height) {
            throw new Error(
              'Invalid image dimensions'
            );
          }

          const thumbnail =
            await generateThumbnail(file);

          resolve({
            width,
            height,
            thumbnail,
          });
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = src;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert a File/Blob into a browser image.
 *
 * This is used to get the REAL dimensions of the
 * processed/compressed image.
 */
async function loadBlobImage(
  blob: Blob
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);

    const img = new Image();

    img.onload = () => {
      const width =
        img.naturalWidth || img.width;

      const height =
        img.naturalHeight || img.height;

      URL.revokeObjectURL(objectUrl);

      if (!width || !height) {
        reject(
          new Error(
            'Unable to determine image dimensions'
          )
        );
        return;
      }

      resolve({
        width,
        height,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);

      reject(
        new Error(
          'Failed to load processed image'
        )
      );
    };

    img.src = objectUrl;
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
  /**
   * LOW COMPRESSION
   *
   * Keep maximum visual quality.
   */
  if (compressionLevel === 'low') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const src = event.target?.result;

        if (!src || typeof src !== 'string') {
          reject(
            new Error('Failed to read image')
          );
          return;
        }

        const img = new Image();

        img.onload = () => {
          try {
            const width =
              img.naturalWidth || img.width;

            const height =
              img.naturalHeight || img.height;

            if (!width || !height) {
              reject(
                new Error(
                  'Invalid image dimensions'
                )
              );
              return;
            }

            const canvas =
              document.createElement('canvas');

            canvas.width = width;
            canvas.height = height;

            const ctx =
              canvas.getContext('2d');

            if (!ctx) {
              reject(
                new Error(
                  'Failed to create canvas'
                )
              );
              return;
            }

            /**
             * White background.
             *
             * This prevents transparent PNGs from
             * producing unexpected black areas.
             */
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(
              0,
              0,
              width,
              height
            );

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            /**
             * Draw without changing aspect ratio.
             */
            ctx.drawImage(
              img,
              0,
              0,
              width,
              height
            );

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(
                    new Error(
                      'Failed to create image blob'
                    )
                  );
                  return;
                }

                resolve({
                  blob,
                  width,
                  height,
                });
              },
              'image/jpeg',
              0.95
            );
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(
            new Error(
              'Failed to load image'
            )
          );
        };

        img.src = src;
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Failed to read file'
          )
        );
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Other compression levels
   */
  const result = await compressImage(
    file,
    compressionLevel
  );

  /**
   * IMPORTANT:
   *
   * Do not blindly trust dimensions returned by
   * the compression utility.
   *
   * Read the actual processed image dimensions.
   */
  const actualDimensions =
    await loadBlobImage(result.blob);

  return {
    blob: result.blob,
    width: actualDimensions.width,
    height: actualDimensions.height,
  };
}

/**
 * Calculate proportional "contain" dimensions.
 *
 * The COMPLETE image always stays visible.
 *
 * No:
 * - crop
 * - stretch
 * - distortion
 */
function calculateContainDimensions(
  imageWidth: number,
  imageHeight: number,
  pageWidth: number,
  pageHeight: number,
  margin: number = 0
): {
  width: number;
  height: number;
  x: number;
  y: number;
} {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    throw new Error(
      'Invalid image dimensions'
    );
  }

  const availableWidth =
    Math.max(1, pageWidth - margin * 2);

  const availableHeight =
    Math.max(1, pageHeight - margin * 2);

  /**
   * CONTAIN:
   *
   * Choose the smaller scale so the entire
   * image remains inside the A4 page.
   */
  const scale = Math.min(
    availableWidth / imageWidth,
    availableHeight / imageHeight
  );

  const drawWidth =
    imageWidth * scale;

  const drawHeight =
    imageHeight * scale;

  /**
   * Center horizontally and vertically.
   */
  const x =
    (pageWidth - drawWidth) / 2;

  const y =
    (pageHeight - drawHeight) / 2;

  return {
    width: drawWidth,
    height: drawHeight,
    x,
    y,
  };
}

/**
 * Merge all uploaded images into one PDF.
 *
 * FINAL PDF RULES:
 *
 * - Every page = exact A4 portrait
 * - 595.28 × 841.89 points
 * - Complete image visible
 * - No cropping
 * - No stretching
 * - No distortion
 * - Aspect ratio preserved
 * - Image centered
 * - No footer
 * - No extra text
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
  if (!images || images.length === 0) {
    throw new Error(
      'No images to merge'
    );
  }

  /**
   * Create completely new PDF.
   */
  const pdfDoc =
    await PDFDocument.create();

  let totalOriginalSize = 0;

  for (
    let i = 0;
    i < images.length;
    i++
  ) {
    const imageInfo = images[i];

    if (!imageInfo || !imageInfo.file) {
      throw new Error(
        `Invalid image at position ${i + 1}`
      );
    }

    const file = imageInfo.file;

    totalOriginalSize += file.size;

    /**
     * Progress
     */
    if (onProgress) {
      onProgress(
        i + 1,
        images.length,
        imageInfo.id
      );
    }

    /**
     * Process image.
     */
    const {
      blob,
      width,
      height,
    } = await processImageForPdf(
      file,
      compressionLevel
    );

    if (
      !blob ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(
        `Invalid processed image: ${file.name}`
      );
    }

    /**
     * Convert image to ArrayBuffer.
     */
    const arrayBuffer =
      await blob.arrayBuffer();

    let pdfImage: PDFImage;

    /**
     * Since processImageForPdf normally creates
     * JPEG, embed JPG first.
     *
     * PNG fallback is kept for compatibility.
     */
    try {
      pdfImage =
        await pdfDoc.embedJpg(
          arrayBuffer
        );
    } catch {
      try {
        pdfImage =
          await pdfDoc.embedPng(
            arrayBuffer
          );
      } catch {
        throw new Error(
          `Failed to embed image: ${file.name}`
        );
      }
    }

    /**
     * ALWAYS CREATE A4 PORTRAIT PAGE.
     *
     * Do not use image orientation to change
     * the page size.
     */
    const page =
      pdfDoc.addPage([
        A4_WIDTH,
        A4_HEIGHT,
      ]);

    /**
     * White A4 background.
     *
     * This guarantees a clean page when an image
     * does not completely cover the page.
     */
    page.drawRectangle({
      x: 0,
      y: 0,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      color: undefined,
      borderWidth: 0,
    });

    /**
     * Calculate exact proportional fit.
     */
    const fitted =
      calculateContainDimensions(
        width,
        height,
        A4_WIDTH,
        A4_HEIGHT,
        PAGE_MARGIN
      );

    /**
     * Draw image.
     *
     * IMPORTANT:
     *
     * We use the calculated dimensions only.
     * Therefore:
     *
     * - no crop
     * - no stretch
     * - no distortion
     * - complete image preserved
     */
    page.drawImage(pdfImage, {
      x: fitted.x,
      y: fitted.y,
      width: fitted.width,
      height: fitted.height,
    });
  }

  /**
   * Save final PDF.
   *
   * Use object streams for a cleaner/smaller PDF.
   */
  const pdfBytes =
    await pdfDoc.save({
      useObjectStreams: true,
    });

  const blob =
    new Blob(
      [pdfBytes],
      {
        type: 'application/pdf',
      }
    );

  /**
   * ZorPDF filename.
   */
  const filename =
    getZorPdfFileName('pdf');

  return {
    blob,
    filename,
    pageCount: images.length,
    originalSize:
      totalOriginalSize,
    pdfSize: blob.size,
    compressionRatio:
      totalOriginalSize > 0 &&
      blob.size > 0
        ? totalOriginalSize / blob.size
        : 1,
  };
}

/**
 * Read file as ArrayBuffer
 */
export function readFileAsArrayBuffer(
  file: File
): Promise<ArrayBuffer> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = (event) => {
        const result =
          event.target?.result;

        if (
          result instanceof ArrayBuffer
        ) {
          resolve(result);
        } else {
          reject(
            new Error(
              'Failed to read file as ArrayBuffer'
            )
          );
        }
      };

      reader.onerror = () => {
        reject(
          new Error(
            'Failed to read file'
          )
        );
      };

      reader.readAsArrayBuffer(file);
    }
  );
}
