export function getZorPdfFileName(ext: string): string {
  const cleanExt = ext.replace('.', '').toLowerCase();

  return `ZorPdf.${cleanExt}`;
}

/**
 * Multiple converted files ke liye unique filename.
 *
 * ZorPdf.jpg
 * ZorPdf (1).jpg
 * ZorPdf (2).jpg
 */
export function getUniqueFilename(
  filename: string,
  usedNames: Set<string>
): string {
  if (!usedNames.has(filename)) {
    usedNames.add(filename);
    return filename;
  }

  const dotIndex = filename.lastIndexOf('.');

  const base =
    dotIndex > -1
      ? filename.slice(0, dotIndex)
      : filename;

  const ext =
    dotIndex > -1
      ? filename.slice(dotIndex)
      : '';

  let counter = 1;

  let candidate = `${base} (${counter})${ext}`;

  while (usedNames.has(candidate)) {
    counter++;

    candidate = `${base} (${counter})${ext}`;
  }

  usedNames.add(candidate);

  return candidate;
}

/**
 * ZIP ka fixed naam
 */
export function getZorPdfZipFileName(): string {
  return 'ZorPdf.zip';
}
