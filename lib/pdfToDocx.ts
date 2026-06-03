import * as pdfjsLib from 'pdfjs-dist';

export interface DocxResult {
  blob: Blob;
  filename: string;
}

async function initWorker() {
  if (typeof window === 'undefined') return;
  if (pdfjsLib.GlobalWorkerOptions.workerSrc) return;
  
  try {
    const pdfWorkerBlob = await fetch(
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
    ).then(res => res.blob());
    const workerUrl = URL.createObjectURL(pdfWorkerBlob);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch (e) {
    console.warn('Failed to load PDF worker:', e);
  }
}

function createDocxBlob(content: string): Blob {
  const docxHeader = [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"',
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<w:body>',
  ].join('\n');

  const docxFooter = '</w:body></w:document>';

  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const paragraphs = escapedContent
    .split('\n')
    .filter((p) => p.trim())
    .map(
      (p) =>
        `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:rPr><w:rStyle w:val="Normal"/></w:rPr><w:t>${p}</w:t></w:r></w:p>`
    )
    .join('\n');

  const xmlContent = `${docxHeader}\n${paragraphs}\n${docxFooter}`;

  return new Blob([xmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
}

export async function convertPdfToDocx(pdfFile: File): Promise<DocxResult> {
  await initWorker();
  
  try {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    const totalPages = pdfDoc.numPages;
    let fullText = '';

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      fullText += pageText + '\n\n';
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF');
    }

    const docxBlob = createDocxBlob(fullText);

    const baseName = pdfFile.name.replace(/\.[^.]+$/, '');
    const filename = `zorPDF.com-${baseName}.docx`;

    return {
      blob: docxBlob,
      filename,
    };
  } catch (err) {
    throw new Error(`Failed to convert PDF to DOCX: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
}
