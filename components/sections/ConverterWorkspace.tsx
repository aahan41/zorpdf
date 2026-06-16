import { PDFDocument, rgb } from 'pdf-lib';
import { getZorPdfFileName } from '@/lib/fileNaming';

export interface MixedFileItem {
  id: string;
  file: File;
  fileType: 'image' | 'pdf';
  thumbnail?: string;
  width?: number;
  height?: number;
}

export interface MixedMergeResult {
  blob: Blob;
  filename: string;
  pageCount: number;
  originalSize: number;
  pdfSize: number;
  compressionRatio: number;
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const PAGE_MARGIN = 24;

function fitInsideBox(srcWidth: number, srcHeight: number, boxWidth: number, boxHeight: number) {
  const scale = Math.min(boxWidth / srcWidth, boxHeight / srcHeight);
  return {
    width: srcWidth * scale,
    height: srcHeight * scale,
    scale,
  };
}

function isPng(file: File) {
  return file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
}

function isJpg(file: File) {
  const name = file.name.toLowerCase();
  return file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg');
}

export async function mergePdfAndImagesToPdf(
  files: MixedFileItem[],
  onProgress?: (current: number, total: number, id: string) => void
): Promise<MixedMergeResult> {
  const mergedPdf = await PDFDocument.create();
  const originalSize = files.reduce((sum, item) => sum + item.file.size, 0);
  let pageCount = 0;
  let completed = 0;

  for (const item of files) {
    const bytes = await item.file.arrayBuffer();

    if (item.fileType === 'pdf') {
      const srcPdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const srcPages = srcPdf.getPages();

      for (let pageIndex = 0; pageIndex < srcPages.length; pageIndex++) {
        const srcPage = srcPages[pageIndex];
        const embeddedPage = await mergedPdf.embedPage(srcPage);

        const a4Page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
        a4Page.drawRectangle({
          x: 0,
          y: 0,
          width: A4_WIDTH,
          height: A4_HEIGHT,
          color: rgb(1, 1, 1),
        });

        const srcWidth = embeddedPage.width;
        const srcHeight = embeddedPage.height;
        const boxWidth = A4_WIDTH - PAGE_MARGIN * 2;
        const boxHeight = A4_HEIGHT - PAGE_MARGIN * 2;
        const fitted = fitInsideBox(srcWidth, srcHeight, boxWidth, boxHeight);

        a4Page.drawPage(embeddedPage, {
          x: (A4_WIDTH - fitted.width) / 2,
          y: (A4_HEIGHT - fitted.height) / 2,
          width: fitted.width,
          height: fitted.height,
        });

        pageCount++;
      }
    } else if (item.fileType === 'image') {
      if (!isPng(item.file) && !isJpg(item.file)) {
        throw new Error(`${item.file.name} supported image nahi hai. Sirf JPG, JPEG, PNG allowed hai.`);
      }

      const image = isPng(item.file)
        ? await mergedPdf.embedPng(bytes)
        : await mergedPdf.embedJpg(bytes);

      const a4Page = mergedPdf.addPage([A4_WIDTH, A4_HEIGHT]);
      a4Page.drawRectangle({
        x: 0,
        y: 0,
        width: A4_WIDTH,
        height: A4_HEIGHT,
        color: rgb(1, 1, 1),
      });

      const boxWidth = A4_WIDTH - PAGE_MARGIN * 2;
      const boxHeight = A4_HEIGHT - PAGE_MARGIN * 2;
      const fitted = fitInsideBox(image.width, image.height, boxWidth, boxHeight);

      a4Page.drawImage(image, {
        x: (A4_WIDTH - fitted.width) / 2,
        y: (A4_HEIGHT - fitted.height) / 2,
        width: fitted.width,
        height: fitted.height,
      });

      pageCount++;
    }

    completed++;
    onProgress?.(completed, files.length, item.id);
  }

  if (pageCount === 0) {
    throw new Error('Koi valid PDF page create nahi ho paya. Files check karke phir try karein.');
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const compressionRatio = originalSize > 0
    ? Math.round(((originalSize - blob.size) / originalSize) * 100)
    : 0;

  return {
    blob,
    filename: getZorPdfFileName('pdf'),
    pageCount,
    originalSize,
    pdfSize: blob.size,
    compressionRatio,
  };
}
