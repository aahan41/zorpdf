import { getZorPdfFileName } from './fileNaming';

export interface DocxToPdfResult {
  blob: Blob;
  filename: string;
}

export async function convertDocxToPdf(docxFile: File): Promise<DocxToPdfResult> {
  try {
    const mammoth = await import('mammoth');
    const { jsPDF } = await import('jspdf');

    const arrayBuffer = await docxFile.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    if (!html || html.trim().length === 0) {
      throw new Error('No content found in DOCX file');
    }

    const container = document.createElement('div');
    container.style.width = '720px';
    container.style.padding = '40px';
    container.style.background = '#ffffff';
    container.style.color = '#000000';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '12px';
    container.style.lineHeight = '1.35';

    container.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; margin: 8px 0; }
        td, th { border: 1px solid #000; padding: 5px 7px; vertical-align: top; }
        p { margin: 4px 0; }
        h1, h2, h3 { margin: 8px 0 6px; }
        img { max-width: 100%; height: auto; }
      </style>
      ${html}
    `;

    document.body.appendChild(container);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    await pdf.html(container, {
      x: 30,
      y: 30,
      width: 535,
      windowWidth: 720,
      autoPaging: 'text',
      html2canvas: {
        scale: 0.75,
        useCORS: true,
        backgroundColor: '#ffffff',
      },
    });

    document.body.removeChild(container);

    const pdfBlob = pdf.output('blob');
    const filename = getZorPdfFileName('pdf');

    return { blob: pdfBlob, filename };
  } catch (err) {
    throw new Error(
      `Failed to convert DOCX to PDF: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}
