import type { CompressionLevel } from './imageCompression';
import { COMPRESSION_PRESETS } from './imageCompression';
import { getZorPdfFileName } from './fileNaming';
import type { MergeResult } from './pdfMerger';

export async function compressPdf(
  file: File,
  level: CompressionLevel = 'balanced'
): Promise<MergeResult> {
  const pdfjsLib = await import('pdfjs-dist');

  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '/pdf.worker.min.mjs';
  }

  const { PDFDocument } = await import('pdf-lib');

  const inputBytes = await file.arrayBuffer();

  const sourcePdf =
    await pdfjsLib.getDocument({
      data: inputBytes,
    }).promise;

  const totalPages = sourcePdf.numPages;

  if (totalPages === 0) {
    throw new Error('The PDF has no pages.');
  }

  const settings =
    COMPRESSION_PRESETS[level];

  const outputPdf =
    await PDFDocument.create();

  for (
    let pageNumber = 1;
    pageNumber <= totalPages;
    pageNumber++
  ) {
    const sourcePage =
      await sourcePdf.getPage(pageNumber);

    const originalViewport =
      sourcePage.getViewport({
        scale: 1,
      });

    let scale = 1;

    if (settings.enableResize) {
      const widthScale =
        settings.maxWidth /
        originalViewport.width;

      const heightScale =
        settings.maxHeight /
        originalViewport.height;

      scale = Math.min(
        widthScale,
        heightScale,
        1
      );
    }

    const viewport =
      sourcePage.getViewport({
        scale,
      });

    const canvas =
      document.createElement('canvas');

    canvas.width = Math.max(
      1,
      Math.round(viewport.width)
    );

    canvas.height = Math.max(
      1,
      Math.round(viewport.height)
    );

    const context =
      canvas.getContext('2d', {
        alpha: false,
      });

    if (!context) {
      throw new Error(
        'Could not create canvas context.'
      );
    }

    context.fillStyle = '#ffffff';
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    await sourcePage.render({
      canvasContext: context,
      viewport,
    } as any).promise;

    const jpegBlob =
      await new Promise<Blob>(
        (resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(
                  new Error(
                    `Could not compress page ${pageNumber}.`
                  )
                );
              }
            },
            'image/jpeg',
            settings.quality / 100
          );
        }
      );

    const imageBytes =
      await jpegBlob.arrayBuffer();

    const image =
      await outputPdf.embedJpg(
        imageBytes
      );

    const outputPage =
      outputPdf.addPage([
        originalViewport.width,
        originalViewport.height,
      ]);

    outputPage.drawImage(image, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });

    canvas.width = 1;
    canvas.height = 1;
  }

  const outputBytes =
    await outputPdf.save({
      useObjectStreams: true,
    });

  const compressedBlob =
    new Blob(
      [outputBytes],
      {
        type: 'application/pdf',
      }
    );

  // If compression somehow makes the file larger,
  // keep the original PDF instead of making it larger.
  const finalBlob =
    compressedBlob.size < file.size
      ? compressedBlob
      : new Blob(
          [inputBytes],
          {
            type: 'application/pdf',
          }
        );

  return {
    blob: finalBlob,
    filename:
      getZorPdfFileName('pdf'),
    pageCount: totalPages,
    originalSize: file.size,
    pdfSize: finalBlob.size,
    compressionRatio:
      finalBlob.size > 0
        ? file.size / finalBlob.size
        : 1,
  };
}
