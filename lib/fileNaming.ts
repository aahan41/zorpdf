export function getZorPdfFileName(ext: string): string {
  const cleanExt = ext.replace('.', '').toLowerCase();
  return `ZorPdf.${cleanExt}`;
}

/**
 * Ensures a filename is unique within a given batch (e.g. before adding
 * it to a ZIP archive). getZorPdfFileName() always returns the same
 * static name (e.g. "ZorPdf.jpg"), so when multiple files are converted
 * in one session they can collide. JSZip silently overwrites earlier
 * entries that share a name, which causes converted files to
 * "disappear" from the final ZIP.
 *
 * Pass a Set that persists across the whole batch; this function will
 * mutate it, adding the returned name so subsequent calls stay unique.
 *
 * "ZorPdf.jpg" -> "ZorPdf.jpg" (first time)
 * "ZorPdf.jpg" -> "ZorPdf (1).jpg" (second time)
 * "ZorPdf.jpg" -> "ZorPdf (2).jpg" (third time)
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
    dotIndex > -1 ? filename.slice(0, dotIndex) : filename;
  const ext = dotIndex > -1 ? filename.slice(dotIndex) : '';

  let counter = 1;
  let candidate = `${base} (${counter})${ext}`;

  while (usedNames.has(candidate)) {
    counter += 1;
    candidate = `${base} (${counter})${ext}`;
  }

  usedNames.add(candidate);
  return candidate;
}
