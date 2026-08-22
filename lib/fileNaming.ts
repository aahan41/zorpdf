export function getZorPdfFileName(ext: string): string {
  const cleanExt = ext.replace('.', '').toLowerCase();
  return `ZorPdf.${cleanExt}`;
}
