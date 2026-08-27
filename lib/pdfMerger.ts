import { PDFDocument, PDFImage } from 'pdf-lib';
import type { CompressionLevel } from './imageCompression';
import { compressImage } from './imageCompression';
import { getZorPdfFileName } from './fileNaming';

export interface ImageProcessingResult {
  id: string;
  file: File;
  thumbnail?: string;
  width?: number;
  height?: number;
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

const PDF_BASE_WIDTH = 595.28;
const PAGE_MARGIN = 8.5;

function isPdfFile(file: File): boolean {
  return (
    file.type === 'application/pdf' ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Generate thumbnail for JPG/PNG image.
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
            canvas.toDataURL('image/jpeg', 0.9)
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
 * Load image information.
 *
 * IMPORTANT:
 * This function is only for actual image files.
 * PDFs must NEVER come here.
 */
export async function loadImageInfo(
  file: File
): Promise<{
  width: number;
  height: number;
  thumbnail: string;
}> {
  if (isPdfFile(file)) {
    throw new Error(
      'PDF files must not be processed as images.'
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      const src = event.target?.result;

      if (!src || typeof src !== 'string') {
        reject(new Error('Failed to read file'));
        return;
      }

      const img = new Image();

      img.onload = async () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

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
          new Error('Failed to load image')
        );
      };

      img.src = src;
    };

    reader.onerror = () => {
      reject(
        new Error('Failed to read file')
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
 * Process image before adding it to PDF.
 */
export async function processImageForPdf(
  file: File,
  compressionLevel: CompressionLevel
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  if (isPdfFile(file)) {
    throw new Error(
      'PDF file cannot be processed as an image.'
    );
  }

  if (compressionLevel === 'low') {
    return new Promise(
      (resolve, reject) => {
        const reader =
          new FileReader();

        reader.onload = (event) => {
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

          const img = new Image();

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

              /*
               * White background for
               * PNG transparency.
               */
              ctx.fillStyle = '#ffffff';

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

  const result =
    await compressImage(
      file,
      compressionLevel
    );

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
 * Same existing behaviour:
 * - no crop
 * - no stretch
 * - no distortion
 * - uniform 8.5pt margin
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

  const contentWidth =
    PDF_BASE_WIDTH;

  const contentHeight =
    contentWidth *
    (imageHeight / imageWidth);

  const pageWidth =
    contentWidth +
    PAGE_MARGIN * 2;

  const pageHeight =
    contentHeight +
    PAGE_MARGIN * 2;

  const page =
    pdfDoc.addPage([
      pageWidth,
      pageHeight,
    ]);

  page.drawImage(
    pdfImage,
    {
      x: PAGE_MARGIN,
      y: PAGE_MARGIN,
      width: contentWidth,
      height: contentHeight,
    }
  );

  return page;
}

/**
 * MIXED JPG + PNG + PDF -> ONE PDF
 *
 * IMPORTANT:
 * Existing PDF pages are copied directly.
 * They are NOT converted to images.
 *
 * Therefore:
 * JPG + PDF + JPG + PDF
 *
 * keeps the exact upload order.
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
      'No files to merge'
    );
  }

  const pdfDoc =
    await PDFDocument.create();

  let totalOriginalSize = 0;
  let totalPageCount = 0;

  for (
    let i = 0;
    i < images.length;
    i++
  ) {
    const fileInfo =
      images[i];

    if (
      !fileInfo ||
      !fileInfo.file
    ) {
      throw new Error(
        `Invalid file at position ${
          i + 1
        }`
      );
    }

    const file =
      fileInfo.file;

    totalOriginalSize +=
      file.size;

    onProgress?.(
      i + 1,
      images.length,
      fileInfo.id
    );

    /*
     * =====================================
     * EXISTING PDF
     * =====================================
     */
    if (isPdfFile(file)) {
      try {
        const sourceBytes =
          await file.arrayBuffer();

        const sourcePdf =
          await PDFDocument.load(
            sourceBytes
          );

        const pageCount =
          sourcePdf.getPageCount();

        if (pageCount === 0) {
          throw new Error(
            `PDF has no pages: ${file.name}`
          );
        }

        const copiedPages =
          await pdfDoc.copyPages(
            sourcePdf,
            sourcePdf.getPageIndices()
          );

        for (
          const page of copiedPages
        ) {
          pdfDoc.addPage(page);
        }

        totalPageCount +=
          copiedPages.length;
      } catch (error) {
        console.error(
          'Failed to copy PDF:',
          error
        );

        throw new Error(
          `Could not read PDF: ${file.name}`
        );
      }

      continue;
    }

    /*
     * =====================================
     * IMAGE
     * =====================================
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

    const arrayBuffer =
      await blob.arrayBuffer();

    let pdfImage: PDFImage;

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

    addImagePage(
      pdfDoc,
      pdfImage,
      width,
      height
    );

    totalPageCount++;
  }

  if (
    totalPageCount === 0
  ) {
    throw new Error(
      'No PDF pages were created.'
    );
  }

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
    getZorPdfFileName('pdf');

  return {
    blob,
    filename,
    pageCount:
      totalPageCount,
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

      reader.onload = (event) => {
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
