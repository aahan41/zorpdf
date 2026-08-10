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
  if (!files || files.length === 0) {
    throw new Error('No image files provided');
  }

  let totalOriginalSize = 0;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const quality =
    compressionLevel === 'high'
      ? 0.6
      : compressionLevel === 'balanced'
        ? 0.75
        : 0.9;

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    totalOriginalSize += file.size;

    const imgUrl = URL.createObjectURL(file);
    const img = new Image();

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () =>
          reject(new Error(`Failed to load image: ${file.name}`));
        img.src = imgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/jpeg', quality);

      if (index > 0) {
        pdf.addPage();
      }

      const maxWidth = pageWidth - 10;
      const maxHeight = pageHeight - 10;

      const imageRatio = canvas.width / canvas.height;

      let imgWidth = maxWidth;
      let imgHeight = imgWidth / imageRatio;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * imageRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(
        imgData,
        'JPEG',
        x,
        y,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  }

  const pdfBlob = pdf.output('blob');
  const filename = getZorPdfFileName('pdf');

  return {
    blob: pdfBlob,
    filename,
    originalSize: totalOriginalSize,
    pdfSize: pdfBlob.size,
    compressionRatio:
      pdfBlob.size > 0 ? totalOriginalSize / pdfBlob.size : 0,
    pageWidth,
    pageHeight,
    imageCount: files.length,
    compressionLevel,
    adaptiveQuality: quality,
  };
}
