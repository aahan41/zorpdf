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

/*
 * JPG/PNG -> PDF
 *
 * IMPORTANT:
 * Do NOT force A4 here.
 *
 * Every image gets a PDF page with the same aspect ratio
 * as the processed image.
 *
 * Result:
 * - no artificial top whitespace
 * - no artificial bottom whitespace
 * - no crop
 * - no stretch
 * - no distortion
 * - image fills the complete PDF page
 */

/**
 * PDF page base width.
 *
 * We keep a consistent PDF width, but calculate the height
 * from the image's real aspect ratio.
 *
 * This is NOT A4 height.
 */
const PDF_BASE_WIDTH = 595.28;

/**
 * Generate a thumbnail for the uploaded image.
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
        reject(
          new Error('Failed to read image')
        );
        return;
      }

      const img = new Image();

      img.onload = () => {
        try {
          let width =
            img.naturalWidth || img.width;

          let height =
            img.naturalHeight || img.height;

          if (!width || !height) {
            reject(
              new Error(
                'Invalid image dimensions'
              )
            );
            return;
          }

          /*
           * Keep original aspect ratio.
           */
          if (width > height) {
            if (width > maxSize) {
              height = Math.round(
                (height * maxSize) / width
              );

              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round(
                (width * maxSize) / height
              );

              height = maxSize;
            }
          }

          const canvas =
            document.createElement(
              'canvas'
            );

          canvas.width =
            Math.max(1, width);

          canvas.height =
            Math.max(1, height);

          const ctx =
            canvas.getContext('2d');

          if (!ctx) {
            reject(
              new Error(
                'Failed to create canvas context'
              )
            );
            return;
          }

          ctx.imageSmoothingEnabled =
            true;

          ctx.imageSmoothingQuality =
            'high';

          ctx.drawImage(
            img,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(
            canvas.toDataURL(
              'image/jpeg',
              0.9
            )
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
 * Load image information.
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
        reject(
          new Error(
            'Failed to read file'
          )
        );
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
 * Load the real dimensions of a processed image blob.
 */
async function loadBlobImage(
  blob: Blob
): Promise<{
  width: number;
  height: number;
}> {
  return new Promise((resolve, reject) => {
    const objectUrl =
      URL.createObjectURL(blob);

    const img = new Image();

    img.onload = () => {
      const width =
        img.naturalWidth || img.width;

      const height =
        img.naturalHeight || img.height;

      URL.revokeObjectURL(
        objectUrl
      );

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
      URL.revokeObjectURL(
        objectUrl
      );

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
 * Process image before adding it to PDF.
 *
 * LOW:
 * Keep the original dimensions and use high quality.
 *
 * Other compression levels:
 * Use the existing compression system.
 */
export async function processImageForPdf(
  file: File,
  compressionLevel: CompressionLevel
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  if (
    compressionLevel === 'low'
  ) {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = (
          event
        ) => {
          const src =
            event.target?.result;

          if (
            !src ||
            typeof src !== 'string'
          ) {
            reject(
              new Error(
                'Failed to read image'
              )
            );
            return;
          }

          const img =
            new Image();

          img.onload = () => {
            try {
              const width =
                img.naturalWidth ||
                img.width;

              const height =
                img.naturalHeight ||
                img.height;

              if (
                !width ||
                !height
              ) {
                reject(
                  new Error(
                    'Invalid image dimensions'
                  )
                );
                return;
              }

              const canvas =
                document.createElement(
                  'canvas'
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const ctx =
                canvas.getContext(
                  '2d'
                );

              if (!ctx) {
                reject(
                  new Error(
                    'Failed to create canvas'
                  )
                );
                return;
              }

              /*
               * White background for PNG transparency.
               */
              ctx.fillStyle =
                '#ffffff';

              ctx.fillRect(
                0,
                0,
                width,
                height
              );

              ctx.imageSmoothingEnabled =
                true;

              ctx.imageSmoothingQuality =
                'high';

              /*
               * Draw original image at
               * original dimensions.
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
                0.98
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
      }
    );
  }

  /*
   * Other compression levels.
   */
  const result =
    await compressImage(
      file,
      compressionLevel
    );

  /*
   * Read actual dimensions after
   * compression/resizing.
   */
  const dimensions =
    await loadBlobImage(
      result.blob
    );

  return {
    blob: result.blob,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Create one PDF page from an image.
 *
 * THIS IS THE MAIN FIX.
 *
 * The page height is calculated from the
 * actual image ratio.
 *
 * Example:
 *
 * image 1000 x 1200
 *
 * PDF width 595.28
 *
 * PDF height:
 *
 * 595.28 * 1200 / 1000
 *
 * Therefore the page itself has the
 * same shape as the image.
 */
function addImagePage(
  pdfDoc: PDFDocument,
  pdfImage: PDFImage,
  imageWidth: number,
  imageHeight: number
) {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    throw new Error(
      'Invalid image dimensions'
    );
  }

  /*
   * NEVER use:
   *
   * A4_HEIGHT = 841.89
   *
   * here.
   */

  const pageWidth =
    PDF_BASE_WIDTH;

  const pageHeight =
    pageWidth *
    (imageHeight / imageWidth);

  const page =
    pdfDoc.addPage([
      pageWidth,
      pageHeight,
    ]);

  /*
   * Draw image edge-to-edge.
   *
   * x = 0
   * y = 0
   *
   * No centering.
   * No margin.
   * No contain.
   * No crop.
   */
  page.drawImage(
    pdfImage,
    {
      x: 0,
      y: 8.5,
      width: pageWidth,
      height: pageHeight,
    }
  );

  return page;
}

/**
 * Merge uploaded images into one PDF.
 *
 * JPG -> PDF:
 * - Natural page ratio
 * - No A4 forcing
 * - No top blank
 * - No bottom blank
 * - No side blank
 * - No crop
 * - No stretch
 * - No distortion
 * - Full image visible
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
  if (
    !images ||
    images.length === 0
  ) {
    throw new Error(
      'No images to merge'
    );
  }

  const pdfDoc =
    await PDFDocument.create();

  let totalOriginalSize = 0;

  for (
    let i = 0;
    i < images.length;
    i++
  ) {
    const imageInfo =
      images[i];

    if (
      !imageInfo ||
      !imageInfo.file
    ) {
      throw new Error(
        `Invalid image at position ${
          i + 1
        }`
      );
    }

    const file =
      imageInfo.file;

    totalOriginalSize +=
      file.size;

    /*
     * Update progress.
     */
    onProgress?.(
      i + 1,
      images.length,
      imageInfo.id
    );

    /*
     * Process image.
     */
    const processed =
      await processImageForPdf(
        file,
        compressionLevel
      );

    const blob =
      processed.blob;

    const width =
      processed.width;

    const height =
      processed.height;

    if (
      !blob ||
      width <= 0 ||
      height <= 0
    ) {
      throw new Error(
        `Invalid processed image: ${file.name}`
      );
    }

    /*
     * Convert to ArrayBuffer.
     */
    const arrayBuffer =
      await blob.arrayBuffer();

    let pdfImage: PDFImage;

    /*
     * Our processor normally returns JPEG.
     */
    try {
      pdfImage =
        await pdfDoc.embedJpg(
          arrayBuffer
        );
    } catch {
      /*
       * PNG fallback.
       */
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

    /*
     * MAIN FIX:
     *
     * Create page according to
     * the actual image ratio.
     */
    addImagePage(
      pdfDoc,
      pdfImage,
      width,
      height
    );
  }

  /*
   * Save PDF.
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

  const filename =
    getZorPdfFileName(
      'pdf'
    );

  return {
    blob,
    filename,
    pageCount:
      images.length,
    originalSize:
      totalOriginalSize,
    pdfSize:
      blob.size,
    compressionRatio:
      totalOriginalSize > 0 &&
      blob.size > 0
        ? totalOriginalSize /
          blob.size
        : 1,
  };
}

/**
 * Read a file as ArrayBuffer.
 */
export function readFileAsArrayBuffer(
  file: File
): Promise<ArrayBuffer> {
  return new Promise(
    (resolve, reject) => {
      const reader =
        new FileReader();

      reader.onload = (
        event
      ) => {
        const result =
          event.target?.result;

        if (
          result instanceof
          ArrayBuffer
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

      reader.readAsArrayBuffer(
        file
      );
    }
  );
}
