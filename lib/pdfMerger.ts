import { PDFDocument, PDFImage, rgb } from 'pdf-lib';
import type { CompressionLevel } from './imageCompression';
import { compressImage, COMPRESSION_PRESETS } from './imageCompression';
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

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

function fitTopContain(srcWidth: number, srcHeight: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / srcWidth, boxHeight / srcHeight);
  const width = srcWidth * scale;
  const height = srcHeight * scale;

  return {
    width,
    height,
    x: (boxWidth - width) / 2,
    y: boxHeight - height,
  };
}

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// Preview thumbnail only. PDF conversion original bytes se hota hai.
export async function generateThumbnail(file: File, maxSize: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
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
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
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

export async function loadImageInfo(file: File): Promise<{ width: number; height: number; thumbnail: string }> {
  const img = await loadImageElement(file);
  const thumbnail = await generateThumbnail(file);

  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    thumbnail,
  };
}

// Backward compatible helper. Isko sirf old code use kare to output dega.
// Main ConverterWorkspace ab original bytes embed karta hai, quality loss nahi hoti.
export async function prepareImageForA4Pdf(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImageElement(file);

  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = Math.round(A4_WIDTH * 3);
  pageCanvas.height = Math.round(A4_HEIGHT * 3);

  const ctx = pageCanvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to create A4 canvas');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const fitted = fitTopContain(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    pageCanvas.width,
    pageCanvas.height
  );

  ctx.drawImage(img, fitted.x, fitted.y, fitted.width, fitted.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    pageCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create A4 image'))),
      'image/jpeg',
      0.98
    );
  });

  return { blob, width: A4_WIDTH, height: A4_HEIGHT };
}

export async function processImageForPdf(
  file: File,
  compressionLevel: CompressionLevel
): Promise<{ blob: Blob; width: number; height: number }> {
  COMPRESSION_PRESETS[compressionLevel];

  if (compressionLevel !== 'low') {
    const result = await compressImage(file, compressionLevel);
    return { blob: result.blob, width: result.newWidth, height: result.newHeight };
  }

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

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, width: img.width, height: img.height });
            else reject(new Error('Failed to create blob'));
          },
          'image/jpeg',
          0.98
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function mergeImagesToPdf(
  images: ImageProcessingResult[],
  compressionLevel: CompressionLevel,
  onProgress?: (current: number, total: number, imageId: string) => void
): Promise<MergeResult> {
  if (images.length === 0) throw new Error('No images to merge');

  const pdfDoc = await PDFDocument.create();
  let totalOriginalSize = 0;

  for (let i = 0; i < images.length; i++) {
    const imageInfo = images[i];
    const file = imageInfo.file;
    totalOriginalSize += file.size;

    onProgress?.(i + 1, images.length, imageInfo.id);

    const bytes = await file.arrayBuffer();
    const fileName = file.name.toLowerCase();
    const pngFile = file.type === 'image/png' || fileName.endsWith('.png');
    const jpgFile =
      file.type === 'image/jpeg' ||
      fileName.endsWith('.jpg') ||
      fileName.endsWith('.jpeg');

    if (!pngFile && !jpgFile) {
      throw new Error(`${file.name} supported image nahi hai. Sirf JPG, JPEG, PNG allowed hai.`);
    }

    let pdfImage: PDFImage;
    try {
      pdfImage = pngFile
        ? await pdfDoc.embedPng(bytes)
        : await pdfDoc.embedJpg(bytes);
    } catch {
      throw new Error(`Failed to embed image: ${file.name}`);
    }

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    const fitted = fitTopContain(
      pdfImage.width,
      pdfImage.height,
      A4_WIDTH,
      A4_HEIGHT
    );

    page.drawImage(pdfImage, {
      x: fitted.x,
      y: fitted.y,
      width: fitted.width,
      height: fitted.height,
    });

    pdfImage = undefined as any;
  }

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = getZorPdfFileName('pdf');

  return {
    blob,
    filename,
    pageCount: images.length,
    originalSize: totalOriginalSize,
    pdfSize: blob.size,
    compressionRatio:
      totalOriginalSize > 0
        ? Math.round(((totalOriginalSize - blob.size) / totalOriginalSize) * 100)
        : 0,
  };
}

export async function mergePdfsWithoutQualityLoss(files: File[]): Promise<MergeResult> {
  if (files.length === 0) throw new Error('No PDFs to merge');

  const pdfDoc = await PDFDocument.create();
  let pageCount = 0;
  const originalSize = files.reduce((sum, file) => sum + file.size, 0);

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copiedPages = await pdfDoc.copyPages(sourcePdf, sourcePdf.getPageIndices());

    copiedPages.forEach((page) => {
      pdfDoc.addPage(page);
      pageCount += 1;
    });
  }

  const pdfBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });

  return {
    blob,
    filename: getZorPdfFileName('pdf'),
    pageCount,
    originalSize,
    pdfSize: blob.size,
    compressionRatio:
      originalSize > 0
        ? Math.round(((originalSize - blob.size) / originalSize) * 100)
        : 0,
  };
}

export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
