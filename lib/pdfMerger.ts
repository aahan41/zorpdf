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
const WHITE_LIMIT = 245;
const EDGE_PADDING = 2;

function fitContain(srcWidth: number, srcHeight: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / srcWidth, boxHeight / srcHeight);
  const width = srcWidth * scale;
  const height = srcHeight * scale;
  return {
    width,
    height,
    x: (boxWidth - width) / 2,
    y: (boxHeight - height) / 2,
  };
}

function isAlmostWhite(r: number, g: number, b: number, a: number) {
  if (a < 20) return true;
  return r >= WHITE_LIMIT && g >= WHITE_LIMIT && b >= WHITE_LIMIT;
}

function findContentBox(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (!isAlmostWhite(r, g, b, a)) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    return { x: 0, y: 0, width, height };
  }

  minX = Math.max(0, minX - EDGE_PADDING);
  minY = Math.max(0, minY - EDGE_PADDING);
  maxX = Math.min(width - 1, maxX + EDGE_PADDING);
  maxY = Math.min(height - 1, maxY + EDGE_PADDING);

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
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

export async function prepareImageForA4Pdf(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const img = await loadImageElement(file);

  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = img.naturalWidth || img.width;
  sourceCanvas.height = img.naturalHeight || img.height;

  const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceCtx) throw new Error('Failed to create canvas context');

  sourceCtx.fillStyle = '#ffffff';
  sourceCtx.fillRect(0, 0, sourceCanvas.width, sourceCanvas.height);
  sourceCtx.imageSmoothingEnabled = true;
  sourceCtx.imageSmoothingQuality = 'high';
  sourceCtx.drawImage(img, 0, 0);

  const box = findContentBox(sourceCtx, sourceCanvas.width, sourceCanvas.height);

  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = Math.round(A4_WIDTH * 2);
  pageCanvas.height = Math.round(A4_HEIGHT * 2);

  const pageCtx = pageCanvas.getContext('2d');
  if (!pageCtx) throw new Error('Failed to create A4 canvas');

  pageCtx.fillStyle = '#ffffff';
  pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
  pageCtx.imageSmoothingEnabled = true;
  pageCtx.imageSmoothingQuality = 'high';

  const fitted = fitContain(box.width, box.height, pageCanvas.width, pageCanvas.height);

  pageCtx.drawImage(
    sourceCanvas,
    box.x,
    box.y,
    box.width,
    box.height,
    fitted.x,
    fitted.y,
    fitted.width,
    fitted.height
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    pageCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create A4 image'))),
      'image/jpeg',
      0.94
    );
  });

  return { blob, width: A4_WIDTH, height: A4_HEIGHT };
}

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
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        const thumbnail = await generateThumbnail(file);
        resolve({ width: img.width, height: img.height, thumbnail });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ blob, width: img.width, height: img.height });
            else reject(new Error('Failed to create blob'));
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

    const { blob } = await prepareImageForA4Pdf(file);
    const arrayBuffer = await blob.arrayBuffer();

    let pdfImage: PDFImage;
    try {
      pdfImage = await pdfDoc.embedJpg(arrayBuffer);
    } catch {
      try {
        pdfImage = await pdfDoc.embedPng(arrayBuffer);
      } catch {
        throw new Error(`Failed to embed image: ${file.name}`);
      }
    }

    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.drawImage(pdfImage, { x: 0, y: 0, width: A4_WIDTH, height: A4_HEIGHT });

    pdfImage = undefined as any;
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = getZorPdfFileName('pdf');

  return {
    blob,
    filename,
    pageCount: images.length,
    originalSize: totalOriginalSize,
    pdfSize: blob.size,
    compressionRatio: totalOriginalSize > 0 ? Math.round(((totalOriginalSize - blob.size) / totalOriginalSize) * 100) : 0,
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
