import { getZorPdfFileName } from './fileNaming';

export interface PdfPageImage {
  pageNumber: number;
  blob: Blob;
  filename: string;
}

export interface PdfToImagesResult {
  images: PdfPageImage[];
  totalPages: number;
}

async function getImageFromPdfPage(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 2
): Promise<Blob> {
  const page = await pdfDoc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  await page.render({
    canvasContext: context,
    viewport,
  } as any).promise;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/jpeg',
      0.95
    );
  });
}

export async function convertPdfToImages(
  pdfFile: File,
  onProgress?: (current: number, total: number) => void
): Promise<PdfToImagesResult> {
  try {
    // Import PDF.js AFTER worker is configured
    const pdfjsLib = await import('pdfjs-dist');

    // Ensure worker is set up BEFORE loading PDF
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdfDoc.numPages;
    const images: PdfPageImage[] = [];

    for (let i = 1; i <= totalPages; i++) {
      if (onProgress) {
        onProgress(i, totalPages);
      }

      try {
        const blob = await getImageFromPdfPage(pdfDoc, i);
        const filename = totalPages === 1 ? getZorPdfFileName('jpg') : `page-${i}.jpg`;
        images.push({
          pageNumber: i,
          blob,
          filename,
        });
      } catch (err) {
        throw new Error(`Failed to convert page ${i}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (images.length === 0) {
      throw new Error('No pages were converted');
    }

    return {
      images,
      totalPages,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Failed to convert PDF to images');
  }
}

export async function createZipFromImages(images: PdfPageImage[]): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  for (const image of images) {
    zip.file(image.filename, image.blob);
  }

  return zip.generateAsync({ type: 'blob' });
}
