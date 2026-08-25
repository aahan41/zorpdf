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
 * Detect only the OUTER white margins of a rendered PDF page.
 * Internal white spaces inside the document are never removed.
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

  const { width, height } = canvas;

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

  // Pixels brighter than this are treated as page background.
  // This also handles anti-aliased white edges.
  const WHITE_THRESHOLD = 247;

  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  // Avoid tiny isolated rendering noise.
  const MIN_DARK_PIXELS_PER_ROW = Math.max(
    2,
    Math.floor(width * 0.0005)
  );

  const MIN_DARK_PIXELS_PER_COLUMN = Math.max(
    2,
    Math.floor(height * 0.0005)
  );

  // Detect top/bottom content rows.
  for (let y = 0; y < height; y++) {
    let darkPixels = 0;

    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

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
        darkPixels++;
      }
    }

    if (darkPixels >= MIN_DARK_PIXELS_PER_ROW) {
      top = y;
      break;
    }
  }

  for (let y = height - 1; y >= 0; y--) {
    let darkPixels = 0;

    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

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
        darkPixels++;
      }
    }

    if (darkPixels >= MIN_DARK_PIXELS_PER_ROW) {
      bottom = y;
      break;
    }
  }

  // Detect left/right content columns.
  for (let x = 0; x < width; x++) {
    let darkPixels = 0;

    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;

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
        darkPixels++;
      }
    }

    if (darkPixels >= MIN_DARK_PIXELS_PER_COLUMN) {
      left = x;
      break;
    }
  }

  for (let x = width - 1; x >= 0; x--) {
    let darkPixels = 0;

    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;

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
        darkPixels++;
      }
    }

    if (darkPixels >= MIN_DARK_PIXELS_PER_COLUMN) {
      right = x;
      break;
    }
  }

  if (
    right < 0 ||
    bottom < 0 ||
    left >= width ||
    top >= height
  ) {
    return null;
  }

  // Safety padding so borders/text never touch the crop edge.
  const padding = Math.max(
    8,
    Math.round(Math.min(width, height) * 0.006)
  );

  left = Math.max(0, left - padding);
  top = Math.max(0, top - padding);
  right = Math.min(width - 1, right + padding);
  bottom = Math.min(height - 1, bottom + padding);

  const cropWidth = right - left + 1;
  const cropHeight = bottom - top + 1;

  // Never crop a suspiciously tiny result.
  if (
    cropWidth < width * 0.15 ||
    cropHeight < height * 0.15
  ) {
    return null;
  }

  return {
    left,
    top,
    right,
    bottom,
  };
}

/**
 * Crop only the outer blank area.
 */
async function cropOuterWhiteMargins(
  canvas: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const bounds = getContentBounds(canvas);

  if (!bounds) {
    return canvas;
  }

  const cropWidth =
    bounds.right - bounds.left + 1;

  const cropHeight =
    bounds.bottom - bounds.top + 1;

  // If almost the entire page is content,
  // don't crop unnecessarily.
  if (
    cropWidth >= canvas.width * 0.98 &&
    cropHeight >= canvas.height * 0.98
  ) {
    return canvas;
  }

  const croppedCanvas =
    document.createElement('canvas');

  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;

  const ctx =
    croppedCanvas.getContext('2d');

  if (!ctx) {
    return canvas;
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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

  return croppedCanvas;
}

async function getImageFromPdfPage(
  pdfDoc: any,
  pageNumber: number,
  scale: number = 3
): Promise<Blob> {
  const page =
    await pdfDoc.getPage(pageNumber);

  const viewport =
    page.getViewport({ scale });

  const canvas =
    document.createElement('canvas');

  canvas.width =
    Math.ceil(viewport.width);

  canvas.height =
    Math.ceil(viewport.height);

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

  // White page background.
  context.save();
  context.fillStyle = '#ffffff';
  context.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );
  context.restore();

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  await page.render({
    canvasContext: context,
    viewport,
    background: '#ffffff',
  }).promise;

  // Remove only outer blank margins.
  const outputCanvas =
    await cropOuterWhiteMargins(canvas);

  return new Promise(
    (resolve, reject) => {
      outputCanvas.toBlob(
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

export async function convertPdfToImages(
  pdfFile: File,
  onProgress?: (
    current: number,
    total: number
  ) => void
): Promise<PdfToImagesResult> {
  try {
    const pdfjsLib =
      await import('pdfjs-dist');

    if (
      !pdfjsLib.GlobalWorkerOptions.workerSrc
    ) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
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

    const images: PdfPageImage[] = [];

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
            ? getZorPdfFileName('jpg')
            : `page-${i}.jpg`;

        images.push({
          pageNumber: i,
          blob,
          filename,
        });
      } catch (err) {
        throw new Error(
          `Failed to convert page ${i}: ${
            err instanceof Error
              ? err.message
              : 'Unknown error'
          }`
        );
      }
    }

    if (images.length === 0) {
      throw new Error(
        'No pages were converted'
      );
    }

    return {
      images,
      totalPages,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }

    throw new Error(
      'Failed to convert PDF to images'
    );
  }
}

export async function createZipFromImages(
  images: PdfPageImage[]
): Promise<Blob> {
  const { default: JSZip } =
    await import('jszip');

  const zip = new JSZip();

  for (const image of images) {
    zip.file(
      image.filename,
      image.blob
    );
  }

  return zip.generateAsync({
    type: 'blob',
  });
}
