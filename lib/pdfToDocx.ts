import { getZorPdfFileName } from './fileNaming';

export interface DocxResult {
  blob: Blob;
  filename: string;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createParagraph(text: string): string {
  return `
    <w:p>
      <w:pPr>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="20"/>
          <w:szCs w:val="20"/>
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
}

function createPageBreak(): string {
  return `
    <w:p>
      <w:r>
        <w:br w:type="page"/>
      </w:r>
    </w:p>`;
}

async function createDocxBlob(pages: string[][]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const bodyContent = pages
    .map((lines, pageIndex) => {
      const pageContent = lines.map(createParagraph).join('\n');
      return pageIndex < pages.length - 1
        ? pageContent + createPageBreak()
        : pageContent;
    })
    .join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyContent}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="720" w:right="720" w:bottom="720" w:left="720"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels"
    ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('word/document.xml', documentXml);
  zip.file('word/_rels/document.xml.rels', wordRelsXml);

  return await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function groupPdfTextIntoLines(items: any[]): string[] {
  const rows: { y: number; parts: { x: number; text: string }[] }[] = [];

  items.forEach((item: any) => {
    const text = item.str?.trim();
    if (!text) return;

    const transform = item.transform;
    const x = transform[4];
    const y = transform[5];

    let row = rows.find((r) => Math.abs(r.y - y) < 4);

    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }

    row.parts.push({ x, text });
  });

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((part) => part.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
}

export async function convertPdfToDocx(pdfFile: File): Promise<DocxResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist');

    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    }

    const arrayBuffer = await pdfFile.arrayBuffer();

    const pdfDoc = await pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    const pages: string[][] = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();

      const lines = groupPdfTextIntoLines(textContent.items as any[]);

      if (lines.length) {
        pages.push(lines);
      }
    }

    if (!pages.length) {
      throw new Error('No selectable text found in PDF');
    }

    const docxBlob = await createDocxBlob(pages);
    const filename = getZorPdfFileName('docx');

    return { blob: docxBlob, filename };
  } catch (err) {
    throw new Error(
      `Failed to convert PDF to DOCX: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}
