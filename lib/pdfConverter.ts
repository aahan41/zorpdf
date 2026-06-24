import { jsPDF } from 'jspdf';
import type { CompressionLevel } from './imageCompression';
import { getZorPdfFileName } from './fileNaming';

export interface CompressionResult {
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

export async function convertImagesToPdf(
  files: File[],
  compressionLevel: CompressionLevel = 'balanced'
): Promise<CompressionResult> {
  if (!files.length) throw new Error('No images selected');

  let totalOriginalSize = 0;
  let pdf: jsPDF | null = null;
  let lastPageWidth = 0;
  let lastPageHeight = 0;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    totalOriginalSize += file.size;

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
      img.src = imgUrl;
    });

    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    const pageWidth = imgWidth;
    const pageHeight = imgHeight;

    lastPageWidth = pageWidth;
    lastPageHeight = pageHeight;

    const orientation = pageWidth > pageHeight ? 'landscape' : 'portrait';

    const canvas = document.createElement('canvas');
    canvas.width = imgWidth;
    canvas.height = imgHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      URL.revokeObjectURL(imgUrl);
      throw new Error('Failed to get canvas context');
    }

    const context = ctx as CanvasRenderingContext2D;
    context.imageSmoothingEnabled = false;
    context.drawImage(img, 0, 0, imgWidth, imgHeight);

    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [pageWidth, pageHeight],
        compress: false,
      });
    } else {
      pdf.addPage([pageWidth, pageHeight], orientation);
    }

    pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'NONE');

    URL.revokeObjectURL(imgUrl);
  }

  if (!pdf) throw new Error('PDF creation failed');

  const pdfBlob = pdf.output('blob');

  return {
    blob: pdfBlob,
    filename: getZorPdfFileName('pdf'),
    originalSize: totalOriginalSize,
    pdfSize: pdfBlob.size,
    compressionRatio: pdfBlob.size > 0 ? totalOriginalSize / pdfBlob.size : 0,
    pageWidth: lastPageWidth,
    pageHeight: lastPageHeight,
    imageCount: files.length,
    compressionLevel,
    adaptiveQuality: 1.0,
  };
}
