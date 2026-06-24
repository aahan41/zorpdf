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
  let totalOriginalSize = 0;

  let pdf: jsPDF | null = null;
  let pageWidth = 0;
  let pageHeight = 0;

  const getImageDataUrl = async (file: File): Promise<{
    dataUrl: string;
    width: number;
    height: number;
  }> => {
    const imgUrl = URL.createObjectURL(file);
    const img = new Image();

    try {
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`Failed to load image: ${file.name}`));
        img.src = imgUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      return {
        dataUrl: canvas.toDataURL('image/jpeg', 1.0),
        width: canvas.width,
        height: canvas.height,
      };
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  };

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    totalOriginalSize += file.size;

    const image = await getImageDataUrl(file);

    const orientation = image.width >= image.height ? 'landscape' : 'portrait';

    if (!pdf) {
      pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        compress: false,
      });
    } else {
      pdf.addPage('a4', orientation);
    }

    pageWidth = pdf.internal.pageSize.getWidth();
    pageHeight = pdf.internal.pageSize.getHeight();

    const imageRatio = image.width / image.height;
    const pageRatio = pageWidth / pageHeight;

    let drawWidth = pageWidth;
    let drawHeight = pageHeight;
    let x = 0;
    let y = 0;

    if (imageRatio > pageRatio) {
      drawWidth = pageWidth;
      drawHeight = pageWidth / imageRatio;
      y = (pageHeight - drawHeight) / 2;
    } else {
      drawHeight = pageHeight;
      drawWidth = pageHeight * imageRatio;
      x = (pageWidth - drawWidth) / 2;
    }

    pdf.addImage(
      image.dataUrl,
      'JPEG',
      x,
      y,
      drawWidth,
      drawHeight,
      undefined,
      'NONE'
    );
  }

  if (!pdf) {
    throw new Error('No images selected');
  }

  const pdfBlob = pdf.output('blob');
  const filename = getZorPdfFileName('pdf');

  return {
    blob: pdfBlob,
    filename,
    originalSize: totalOriginalSize,
    pdfSize: pdfBlob.size,
    compressionRatio: pdfBlob.size > 0 ? totalOriginalSize / pdfBlob.size : 0,
    pageWidth,
    pageHeight,
    imageCount: files.length,
    compressionLevel,
    adaptiveQuality: 1.0,
  };
}
