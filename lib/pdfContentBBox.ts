export interface PageContentBBox {
  left: number;
  bottom: number;
  right: number;
  top: number;
}

export async function getPageContentBBox(
  pdfBytes: ArrayBuffer,
  pageIndex: number,
  fullWidth: number,
  fullHeight: number
): Promise<PageContentBBox> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        '/pdf.worker.min.mjs';
    }

    const loadingTask = pdfjsLib.getDocument({
      data: pdfBytes.slice(0),
    });

    const pdf = await loadingTask.promise;

    const page = await pdf.getPage(pageIndex + 1);

    const scale = 2;

    const viewport = page.getViewport({
      scale,
    });

    const canvas = document.createElement('canvas');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const context = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: true,
    });

    if (!context) {
      return {
        left: 0,
        bottom: 0,
        right: fullWidth,
        top: fullHeight,
      };
    }

    context.save();

    context.fillStyle = '#ffffff';

    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    context.restore();

    await page.render({
      canvasContext: context,
      viewport,
      background: '#ffffff',
    }).promise;

    const imageData = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const data = imageData.data;

    const WHITE_THRESHOLD = 247;

    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index =
          (y * canvas.width + x) * 4;

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
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (
      maxX < 0 ||
      maxY < 0 ||
      minX >= canvas.width ||
      minY >= canvas.height
    ) {
      return {
        left: 0,
        bottom: 0,
        right: fullWidth,
        top: fullHeight,
      };
    }

    const padding = Math.max(
      8,
      Math.round(
        Math.min(
          canvas.width,
          canvas.height
        ) * 0.006
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
      canvas.width - 1,
      maxX + padding
    );

    maxY = Math.min(
      canvas.height - 1,
      maxY + padding
    );

    const scaleX =
      fullWidth / canvas.width;

    const scaleY =
      fullHeight / canvas.height;

    const left =
      minX * scaleX;

    const right =
      (maxX + 1) * scaleX;

    const top =
      fullHeight -
      minY * scaleY;

    const bottom =
      fullHeight -
      (maxY + 1) * scaleY;

    return {
      left: Math.max(
        0,
        Math.min(left, fullWidth)
      ),

      bottom: Math.max(
        0,
        Math.min(bottom, fullHeight)
      ),

      right: Math.max(
        0,
        Math.min(right, fullWidth)
      ),

      top: Math.max(
        0,
        Math.min(top, fullHeight)
      ),
    };
  } catch (error) {
    console.error(
      'Failed to detect PDF content bounds:',
      error
    );

    return {
      left: 0,
      bottom: 0,
      right: fullWidth,
      top: fullHeight,
    };
  }
}
