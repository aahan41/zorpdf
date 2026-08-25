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

/**
 * Detect the real visible content of a rendered PDF page.
 *
 * Only the OUTER blank white margins are detected.
 * White spaces inside the actual document are preserved.
 */
function getContentBounds(
  canvas: HTMLCanvasElement
): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} | null {
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!ctx) {
    return null;
  }

  const width = canvas.width;
  const height = canvas.height;

  if (width <= 0 || height <= 0) {
    return null;
  }

  const imageData = ctx.getImageData(
    0,
    0,
    width,
    height
  );

  const data = imageData.data;

  /**
   * Anything almost white is considered page background.
   *
   * 247 is deliberately not 255 because PDF rendering can
   * create very small anti-aliasing differences.
   */
  const WHITE_THRESHOLD = 247;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  /**
   * Ignore isolated single-pixel rendering noise.
   */
  const minimumPixelsPerRow = Math.max(
    2,
    Math.floor(width * 0.0005)
  );

  const minimumPixelsPerColumn = Math.max(
    2,
    Math.floor(height * 0.0005)
  );

  /**
   * Find TOP.
   */
  for (let y = 0; y < height; y++) {
    let contentPixels = 0;

    for (let x = 0; x < width; x++) {
      const index =
        (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (
        a > 0 &&
        (
          r < WHITE_THRESHOLD ||
          g < WHITE_THRESHOLD ||
          b < WHITE_THRESHOLD
        )
      ) {
        contentPixels++;
      }
    }

    if (
      contentPixels >=
      minimumPixelsPerRow
    ) {
      minY = y;
      break;
    }
  }

  /**
   * Find BOTTOM.
   */
  for (
    let y = height - 1;
    y >= 0;
    y--
  ) {
    let contentPixels = 0;

    for (let x = 0; x < width; x++) {
      const index =
        (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (
        a > 0 &&
        (
          r < WHITE_THRESHOLD ||
          g < WHITE_THRESHOLD ||
          b < WHITE_THRESHOLD
        )
      ) {
        contentPixels++;
      }
    }

    if (
      contentPixels >=
      minimumPixelsPerRow
    ) {
      maxY = y;
      break;
    }
  }

  /**
   * Find LEFT.
   */
  for (let x = 0; x < width; x++) {
    let contentPixels = 0;

    for (let y = 0; y < height; y++) {
      const index =
        (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (
        a > 0 &&
        (
          r < WHITE_THRESHOLD ||
          g < WHITE_THRESHOLD ||
          b < WHITE_THRESHOLD
        )
      ) {
        contentPixels++;
      }
    }

    if (
      contentPixels >=
      minimumPixelsPerColumn
    ) {
      minX = x;
      break;
    }
  }

  /**
   * Find RIGHT.
   */
  for (
    let x = width - 1;
    x >= 0;
    x--
  ) {
    let contentPixels = 0;

    for (let y = 0; y < height; y++) {
      const index =
        (y * width + x) * 4;

      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (
        a > 0 &&
        (
          r < WHITE_THRESHOLD ||
          g < WHITE_THRESHOLD ||
          b < WHITE_THRESHOLD
        )
      ) {
        contentPixels++;
      }
    }

    if (
      contentPixels >=
      minimumPixelsPerColumn
    ) {
      maxX = x;
      break;
    }
  }

  if (
    minX >= width ||
    minY >= height ||
    maxX < 0 ||
    maxY < 0
  ) {
    return null;
  }

  /**
   * Safety padding.
   *
   * This prevents text, borders and logos from touching
   * the crop edge.
   */
  const padding = Math.max(
    8,
    Math.round(
      Math.min(width, height) *
        0.006
    )
  );

  minX = Math.max(
    0,
    minX - padding
  );

  minY = Math.max(
    0,
    minY - padding
  );

  maxX = Math.min(
    width - 1,
    maxX + padding
  );

  maxY = Math.min(
    height - 1,
    maxY + padding
  );

  const cropWidth =
    maxX - minX + 1;

  const cropHeight =
    maxY - minY + 1;

  /**
   * Safety check.
   *
   * If detection gives a suspiciously tiny area,
   * return null and keep the original page.
   */
  if (
    cropWidth < width * 0.15 ||
    cropHeight < height * 0.15
  ) {
    return null;
  }

  return {
    left: minX,
    top: minY,
    right: maxX,
    bottom: maxY,
  };
}

/**
 * Crop only OUTER white margins.
 */
async function cropOuterWhiteMargins(
  canvas: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const bounds =
    getContentBounds(canvas);

  if (!bounds) {
    return canvas;
  }

  const cropWidth =
    bounds.right -
    bounds.left +
    1;

  const cropHeight =
    bounds.bottom -
    bounds.top +
    1;

  /**
   * If almost the whole page is already content,
   * don't crop it.
   */
  if (
    cropWidth >=
      canvas.width * 0.98 &&
    cropHeight >=
      canvas.height * 0.98
  ) {
    return canvas;
  }

  const outputCanvas =
    document.createElement(
      'canvas'
    );

  outputCanvas.width =
    cropWidth;

  outputCanvas.height =
    cropHeight;

  const ctx =
    outputCanvas.getContext('2d');

  if (!ctx) {
    return canvas;
  }

  ctx.imageSmoothingEnabled =
    true;

  ctx.imageSmoothingQuality =
    'high';

  /**
   * Keep the complete detected content.
   */
  ctx.drawImage(
    canvas,
    bounds.left,
    bounds.top,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  return outputCanvas;
}

/**
 * Render one PDF page at high resolution.
 */
async function getImageFromPdfPage(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 3
): Promise<Blob> {
  const page =
    await pdfDoc.getPage(
      pageNumber
    );

  const viewport =
    page.getViewport({
      scale,
    });

  const canvas =
    document.createElement(
      'canvas'
    );

  canvas.width = Math.ceil(
    viewport.width
  );

  canvas.height = Math.ceil(
    viewport.height
  );

  const context =
    canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });

  if (!context) {
    throw new Error(
      'Failed to get canvas context'
    );
  }

  /**
   * White background.
   */
  context.save();

  context.fillStyle =
    '#ffffff';

  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  context.restore();

  context.imageSmoothingEnabled =
    true;

  context.imageSmoothingQuality =
    'high';

  /**
   * Render COMPLETE PDF page first.
   */
  await page.render({
    canvasContext: context,
    viewport,
    background: '#ffffff',
  }).promise;

  /**
   * Then remove ONLY the outer blank margins.
   */
  const finalCanvas =
    await cropOuterWhiteMargins(
      canvas
    );

  return new Promise(
    (resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(
              new Error(
                'Failed to convert canvas to JPEG'
              )
            );
          }
        },
        'image/jpeg',
        0.98
      );
    }
  );
}

/**
 * Convert all PDF pages to JPG.
 */
export async function convertPdfToImages(
  pdfFile: File,
  onProgress?: (
    current: number,
    total: number
  ) => void
): Promise<PdfToImagesResult> {
  try {
    const pdfjsLib =
      await import(
        'pdfjs-dist'
      );

    /**
     * Configure worker before loading PDF.
     */
    if (
      !pdfjsLib
        .GlobalWorkerOptions
        .workerSrc
    ) {
      pdfjsLib
        .GlobalWorkerOptions
        .workerSrc =
        '/pdf.worker.min.mjs';
    }

    const arrayBuffer =
      await pdfFile.arrayBuffer();

    const pdfDoc =
      await pdfjsLib
        .getDocument({
          data: arrayBuffer,
        })
        .promise;

    const totalPages =
      pdfDoc.numPages;

    const images: PdfPageImage[] =
      [];

    for (
      let i = 1;
      i <= totalPages;
      i++
    ) {
      onProgress?.(
        i,
        totalPages
      );

      try {
        const blob =
          await getImageFromPdfPage(
            pdfDoc,
            i,
            3
          );

        const filename =
          totalPages === 1
            ? getZorPdfFileName(
                'jpg'
              )
            : `page-${i}.jpg`;

        images.push({
          pageNumber: i,
          blob,
          filename,
        });
      } catch (error) {
        throw new Error(
          `Failed to convert page ${i}: ${
            error instanceof Error
              ? error.message
              : 'Unknown error'
          }`
        );
      }
    }

    if (
      images.length === 0
    ) {
      throw new Error(
        'No pages were converted'
      );
    }

    return {
      images,
      totalPages,
    };
  } catch (error) {
    if (
      error instanceof Error
    ) {
      throw error;
    }

    throw new Error(
      'Failed to convert PDF to images'
    );
  }
}

/**
 * Create ZIP for multi-page PDF.
 */
export async function createZipFromImages(
  images: PdfPageImage[]
): Promise<Blob> {
  const {
    default: JSZip,
  } = await import(
    'jszip'
  );

  const zip =
    new JSZip();

  for (
    const image of images
  ) {
    zip.file(
      image.filename,
      image.blob
    );
  }

  return zip.generateAsync({
    type: 'blob',
  });
}
