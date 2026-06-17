import { getZorPdfFileName } from './fileNaming';

export interface DocxToPdfResult {
  blob: Blob;
  filename: string;
}

export async function convertDocxToPdf(docxFile: File): Promise<DocxToPdfResult> {
  try {
    const mammoth = await import('mammoth');
    const htmlToPdfmake = (await import('html-to-pdfmake')).default;
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');

    const pdfMake: any = pdfMakeModule.default || pdfMakeModule;
    pdfMake.vfs = (pdfFonts as any).default?.pdfMake?.vfs || (pdfFonts as any).pdfMake?.vfs;

    const arrayBuffer = await docxFile.arrayBuffer();

    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "b => strong",
          "i => em",
        ],
      }
    );

    const html = result.value;

    if (!html || html.trim().length === 0) {
      throw new Error('No content found in DOCX file');
    }

    const styledHtml = `
      <div style="font-family: Arial; font-size: 11px; color: #000;">
        ${html}
      </div>
    `;

    const pdfContent = htmlToPdfmake(styledHtml, {
      tableAutoSize: true,
      defaultStyles: {
        p: {
          margin: [0, 2, 0, 2],
        },
        h1: {
          fontSize: 16,
          bold: true,
          margin: [0, 6, 0, 6],
        },
        h2: {
          fontSize: 14,
          bold: true,
          margin: [0, 5, 0, 5],
        },
        table: {
          margin: [0, 6, 0, 8],
        },
        th: {
          bold: true,
          fillColor: '#f2f2f2',
        },
        td: {
          margin: [3, 3, 3, 3],
        },
      },
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [40, 40, 40, 40],

      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        lineHeight: 1.25,
        color: '#000000',
      },

      content: pdfContent,

      styles: {
        strong: {
          bold: true,
        },
      },
    };

    const pdfBlob: Blob = await new Promise((resolve, reject) => {
      try {
        pdfMake.createPdf(docDefinition).getBlob((blob: Blob) => {
          resolve(blob);
        });
      } catch (error) {
        reject(error);
      }
    });

    const filename = getZorPdfFileName('pdf');

    return {
      blob: pdfBlob,
      filename,
    };
  } catch (err) {
    throw new Error(
      `Failed to convert DOCX to PDF: ${
        err instanceof Error ? err.message : 'Unknown error'
      }`
    );
  }
}
