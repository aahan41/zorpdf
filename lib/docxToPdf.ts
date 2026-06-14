import { getZorPdfFileName } from './fileNaming';

export interface DocxToPdfResult {
  blob: Blob;
  filename: string;
}

export async function convertDocxToPdf(docxFile: File): Promise<DocxToPdfResult> {
  try {
    const mammoth = await import('mammoth');
    const arrayBuffer = await docxFile.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    if (!html || html.trim().length === 0) {
      throw new Error('No content found in DOCX file');
    }

    // Create styled container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0px';
    container.style.width = '794px';
    container.style.padding = '60px';
    container.style.background = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '13px';
    container.style.lineHeight = '1.6';
    container.style.color = '#000';
    container.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        td, th { border: 1px solid #000; padding: 4px 8px; font-size: 12px; }
        p { margin: 4px 0; }
        h1, h2, h3 { margin: 8px 0 4px 0; }
        b, strong { font-weight: bold; }
      </style>
      ${html}
    `;
    document.body.appendChild(container);

    // Wait for render
    await new Promise(resolve => setTimeout(resolve, 300));

    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const totalHeight = container.scrollHeight;
    let yOffset = 0;
    let isFirstPage = true;

    while (yOffset < totalHeight) {
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        y: yOffset,
        height: Math.min(1122, totalHeight - yOffset),
        windowWidth: 794,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      if (!isFirstPage) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, imgHeight);

      yOffset += 1122;
      isFirstPage = false;
    }

    document.body.removeChild(container);

    const pdfBlob = pdf.output('blob');
    const filename = getZorPdfFileName('pdf');
    return { blob: pdfBlob, filename };

  } catch (err) {
    throw new Error(`Failed to convert DOCX to PDF: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
