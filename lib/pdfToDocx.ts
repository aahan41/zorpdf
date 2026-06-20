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

function paragraphXml(text: string, bold = false): string {
  const safeText = escapeXml(text);

  return `
  <w:p>
    <w:pPr>
      <w:spacing w:after="90"/>
    </w:pPr>
    <w:r>
      <w:rPr>
        ${bold ? '<w:b/>' : ''}
        <w:sz w:val="${bold ? '24' : '20'}"/>
      </w:rPr>
      <w:t xml:space="preserve">${safeText}</w:t>
    </w:r>
  </w:p>`;
}

function pageBreakXml(): string {
  return `
  <w:p>
    <w:r>
      <w:br w:type="page"/>
    </w:r>
  </w:p>`;
}

function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

function splitLongLine(text: string): string[] {
  let line = cleanLine(text);

  const breakers = [
    'CARRICULAM-VITAE',
    'Post Applied for',
    'Name :',
    'FatherName :',
    'Date of Birth :',
    'MaritalStatus :',
    'Nationality :',
    'LanguagesKnown :',
    'Edu.Qualification :',
    'Email',
    'PRESENT ADDRESS',
    'PERMANET ADDRESS',
    'DOCUMENTS DETAILS:',
    'PASSPORT',
    'INDIAN CDC',
    'INDOS',
    'WATCH KEEPING',
    'YELLOW FEVER',
    'S.I.D',
    'COVID-19',
    'COURSE DETAILS:',
    'PRE- SEA',
    'BASIC STCW',
    'S.T.STI.S.D',
    'SEA SERVICE DETAILS:',
    'AK SHIPPING',
    'Mumbai Ship Management',
    'DATE ..',
    'PLACE ..',
  ];

  breakers.forEach((word) => {
    line = line.replaceAll(word, `\n${word}`);
  });

  return line
    .split('\n')
    .map(cleanLine)
    .filter(Boolean);
}

function isHeading(line: string): boolean {
  const upper = line.toUpperCase();

  return (
    upper.includes('CARRICULAM-VITAE') ||
    upper.includes('DOCUMENTS DETAILS') ||
    upper.includes('COURSE DETAILS') ||
    upper.includes('SEA SERVICE DETAILS') ||
    upper.includes('PRESENT ADDRESS') ||
    upper.includes('PERMANET ADDRESS')
  );
}

function groupPdfTextIntoLines(items: any[]): string[] {
  const rows: { y: number; parts: { x: number; text: string }[] }[] = [];

  for (const item of items) {
    const text = item.str?.trim();
    if (!text) continue;

    const transform = item.transform;
    const x = Math.round(transform[4]);
    const y = Math.round(transform[5]);

    let row = rows.find((r) => Math.abs(r.y - y) <= 6);

    if (!row) {
      row = { y, parts: [] };
      rows.push(row);
    }

    row.parts.push({ x, text });
  }

  let lines = rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      row.parts
        .sort((a, b) => a.x - b.x)
        .map((p) => p.text)
        .join(' ')
    )
    .flatMap(splitLongLine)
    .map(cleanLine)
    .filter(Boolean);

  if (lines.length <= 3) {
    const allText = items.map((item: any) => item.str || '').join(' ');
    lines = splitLongLine(allText);
  }

  return lines;
}

async function createDocxBlob(pages: string[][]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  const bodyXml = pages
    .map((pageLines, pageIndex) => {
      const pageXml = pageLines
        .map((line) => paragraphXml(line, isHeading(line)))
        .join('\n');

      return pageIndex < pages.length - 1 ? pageXml + pageBreakXml() : pageXml;
    })
    .join('\n');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
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
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
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
      useSystemFonts: true,
    }).promise;

    const pages: string[][] = [];

    for (let pageNo = 1; pageNo <= pdfDoc.numPages; pageNo++) {
      const page = await pdfDoc.getPage(pageNo);
      const textContent = await page.getTextContent();

      const lines = groupPdfTextIntoLines(textContent.items as any[]);

      if (lines.length > 0) {
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
