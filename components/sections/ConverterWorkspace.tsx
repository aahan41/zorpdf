'use client';
import { useState, useCallback, useRef } from 'react';
import { PDFDocument } from 'pdf-lib';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Upload, X, FileText, Layers, ArrowRight,
  Zap, GripVertical, Image as ImageIcon, Trash2, CheckCircle2,
  RotateCcw, File, AlertCircle
} from 'lucide-react';
import type { CompressionLevel } from '@/lib/imageCompression';
import type { ImageProcessingResult } from '@/lib/pdfMerger';
import { loadImageInfo, type MergeResult } from '@/lib/pdfMerger';
import { formatBytes, calculateCompressionPercentage, compressImage } from '@/lib/imageCompression';
import { estimatePdfSize } from '@/lib/pdfEstimator';
import { getZorPdfFileName } from '@/lib/fileNaming';
import { DownloadButton } from '@/components/ui/DownloadButton';
import CompressionLevelSelector from '@/components/ui/CompressionLevelSelector';
import { tools, type ToolId, type Tool } from './ToolsGrid';

const converterTabs: { id: ToolId; label: string; from: string; to: string }[] = [
  { id: 'jpg-to-pdf', label: 'JPG to PDF', from: 'JPG', to: 'PDF' },
  { id: 'pdf-to-jpg', label: 'PDF to JPG', from: 'PDF', to: 'JPG' },
  { id: 'png-to-jpg', label: 'PNG to JPG', from: 'PNG', to: 'JPG' },
  { id: 'word-to-pdf', label: 'Word to PDF', from: 'DOCX', to: 'PDF' },
  { id: 'pdf-to-word', label: 'PDF to Word', from: 'PDF', to: 'DOCX' },
  { id: 'pdf-compressor', label: 'PDF Compressor', from: 'PDF', to: 'PDF' },
];

interface FileItem {
  id: string;
  file: File;
  fileType: 'image' | 'pdf';
  status: 'pending' | 'loading' | 'ready' | 'converting' | 'done' | 'error';
  progress: number;
  thumbnail?: string;
  width?: number;
  height?: number;
  result?: { blob: Blob; filename: string };
  pdfResult?: MergeResult;
  error?: string;
}

const MAX_FILES = 100;
const generateId = () => Math.random().toString(36).substring(2, 15);

const JPG_TO_PDF_ACCEPT = '.jpg,.jpeg,.png,.pdf';

const getFileType = (file: File): 'image' | 'pdf' | null => {
  const name = file.name.toLowerCase().trim();
  const mime = (file.type || '').toLowerCase();

  if (name.endsWith('.pdf') || mime === 'application/pdf') {
    return 'pdf';
  }

  if (
    name.endsWith('.jpg') ||
    name.endsWith('.jpeg') ||
    name.endsWith('.png') ||
    mime === 'image/jpeg' ||
    mime === 'image/jpg' ||
    mime === 'image/png'
  ) {
    return 'image';
  }

  return null;
};
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/**
 * Fit an image/page completely inside the target box.
 * Never crops, stretches or distorts.
 */
const fitContain = (
  srcWidth: number,
  srcHeight: number,
  boxWidth: number,
  boxHeight: number
) => {
  const scale = Math.min(
    boxWidth / srcWidth,
    boxHeight / srcHeight
  );

  const width = srcWidth * scale;
  const height = srcHeight * scale;

  return {
    width,
    height,
    x: (boxWidth - width) / 2,
    y: (boxHeight - height) / 2,
  };
};

/**
 * Load an image file into an HTMLImageElement.
 */
const loadImageElement = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = url;
  });
};

/**
 * Trim only the OUTER blank canvas around a scanned/document image.
 *
 * Important:
 * - Does NOT use cover/crop scaling.
 * - Does NOT remove white areas inside the document.
 * - Ignores the outer black/gray border lines that many scanners add.
 * - Keeps a tiny safety padding around detected content.
 *
 * This fixes the exact issue where a document has a large blank area
 * above the actual document content and that blank area gets preserved
 * in the generated A4 PDF.
 */
const trimOuterWhitespace = async (
  file: File
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> => {
  const img = await loadImageElement(file);

  const sourceWidth = img.naturalWidth || img.width;
  const sourceHeight = img.naturalHeight || img.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error(`Invalid image dimensions: ${file.name}`);
  }

  const canvas = document.createElement('canvas');
  canvas.width = sourceWidth;
  canvas.height = sourceHeight;

  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
  });

  if (!ctx) {
    throw new Error('Failed to create image canvas');
  }

  // Always use white as the document background.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, sourceWidth, sourceHeight);
  ctx.drawImage(img, 0, 0, sourceWidth, sourceHeight);

  const imageData = ctx.getImageData(
    0,
    0,
    sourceWidth,
    sourceHeight
  );
  const pixels = imageData.data;

  // A pixel darker than this is considered document content.
  const DARK_THRESHOLD = 242;

  // Ignore scanner/page-border lines that occupy almost the entire row/column.
  const BORDER_DARK_RATIO = 0.70;

  // Ignore tiny anti-aliasing/noise specks.
  const MIN_CONTENT_PIXELS = Math.max(
    4,
    Math.floor(sourceWidth * 0.002)
  );

  let top = sourceHeight;
  let bottom = -1;
  let left = sourceWidth;
  let right = -1;

  // Detect meaningful content rows.
  for (let y = 0; y < sourceHeight; y++) {
    let darkCount = 0;

    for (let x = 0; x < sourceWidth; x++) {
      const index = (y * sourceWidth + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      const isDark =
        a > 10 &&
        (r < DARK_THRESHOLD ||
          g < DARK_THRESHOLD ||
          b < DARK_THRESHOLD);

      if (isDark) darkCount++;
    }

    const ratio = darkCount / sourceWidth;

    if (
      darkCount >= MIN_CONTENT_PIXELS &&
      ratio < BORDER_DARK_RATIO
    ) {
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }

  // Detect meaningful content columns.
  for (let x = 0; x < sourceWidth; x++) {
    let darkCount = 0;

    for (let y = 0; y < sourceHeight; y++) {
      const index = (y * sourceWidth + x) * 4;
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      const a = pixels[index + 3];

      const isDark =
        a > 10 &&
        (r < DARK_THRESHOLD ||
          g < DARK_THRESHOLD ||
          b < DARK_THRESHOLD);

      if (isDark) darkCount++;
    }

    const ratio = darkCount / sourceHeight;

    if (
      darkCount >= Math.max(
        4,
        Math.floor(sourceHeight * 0.002)
      ) &&
      ratio < BORDER_DARK_RATIO
    ) {
      left = Math.min(left, x);
      right = Math.max(right, x);
    }
  }

  // If detection fails, return the original image unchanged.
  if (
    top >= sourceHeight ||
    bottom < 0 ||
    left >= sourceWidth ||
    right < 0
  ) {
    const originalBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error(`Failed to process image: ${file.name}`));
          return;
        }
        resolve(blob);
      }, 'image/jpeg', 0.98);
    });

    return {
      blob: originalBlob,
      width: sourceWidth,
      height: sourceHeight,
    };
  }

  // Small padding so text/borders never touch the crop edge.
  const paddingX = Math.max(2, Math.round(sourceWidth * 0.003));
  const paddingY = Math.max(2, Math.round(sourceHeight * 0.003));

  const cropLeft = Math.max(0, left - paddingX);
  const cropTop = Math.max(0, top - paddingY);
  const cropRight = Math.min(sourceWidth - 1, right + paddingX);
  const cropBottom = Math.min(sourceHeight - 1, bottom + paddingY);

  const cropWidth = Math.max(1, cropRight - cropLeft + 1);
  const cropHeight = Math.max(1, cropBottom - cropTop + 1);

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = cropWidth;
  outputCanvas.height = cropHeight;

  const outputCtx = outputCanvas.getContext('2d');

  if (!outputCtx) {
    throw new Error('Failed to create cropped image canvas');
  }

  outputCtx.fillStyle = '#ffffff';
  outputCtx.fillRect(0, 0, cropWidth, cropHeight);

  outputCtx.drawImage(
    canvas,
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((result) => {
      if (!result) {
        reject(new Error(`Failed to create processed image: ${file.name}`));
        return;
      }
      resolve(result);
    }, 'image/jpeg', 0.98);
  });

  return {
    blob,
    width: cropWidth,
    height: cropHeight,
  };
};

/**
 * Convert a Blob to ArrayBuffer.
 */
const blobToArrayBuffer = async (blob: Blob): Promise<ArrayBuffer> => {
  return await blob.arrayBuffer();
};

/**
 * Merge images and PDFs into a clean A4 PDF.
 *
 * IMAGE INPUT:
 * 1. Remove only the outer blank canvas.
 * 2. Detect the actual document orientation.
 * 3. Create matching A4 portrait/landscape page.
 * 4. Fit with CONTAIN — never crop.
 *
 * PDF INPUT:
 * 1. Keep the complete source page.
 * 2. Preserve source orientation.
 * 3. Fit complete page inside matching A4.
 */
const mergePdfAndImagesToPdf = async (
  orderedFiles: FileItem[],
  onProgress?: (current: number, total: number, fileId: string) => void
): Promise<MergeResult> => {
  const mergedPdf = await PDFDocument.create();

  let pageCount = 0;

  const originalSize = orderedFiles.reduce(
    (sum, item) => sum + item.file.size,
    0
  );

  for (let i = 0; i < orderedFiles.length; i++) {
    const item = orderedFiles[i];
    const bytes = await item.file.arrayBuffer();

    if (item.fileType === 'pdf') {
      /**
       * PDF INPUT
       *
       * Preserve the original PDF page aspect ratio.
       * Do NOT force A4 and do NOT shrink it into an A4 box.
       * This keeps the original document filling the PDF page naturally.
       */
      const sourcePdf = await PDFDocument.load(bytes, {
        ignoreEncryption: true,
      });

      const sourcePages = sourcePdf.getPages();

      for (const sourcePage of sourcePages) {
        const embeddedPage = await mergedPdf.embedPage(sourcePage);

        const pageWidth = embeddedPage.width;
        const pageHeight = embeddedPage.height;

        const page = mergedPdf.addPage([
          pageWidth,
          pageHeight,
        ]);

        page.drawPage(embeddedPage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });

        pageCount += 1;
      }
    } else {
      /**
       * IMAGE INPUT
       *
       * JPG2PDF-style behavior:
       * - Do NOT force A4.
       * - Do NOT trim/crop the source image.
       * - Preserve the exact original image aspect ratio.
       * - Make the PDF page the same aspect ratio as the image.
       * - Draw the image edge-to-edge so there is no artificial
       *   top/bottom blank space created by A4 fitting.
       */
      const fileName = item.file.name.toLowerCase();
      const mimeType = (item.file.type || '').toLowerCase();

      const isPng =
        mimeType === 'image/png' ||
        fileName.endsWith('.png');

      const isJpg =
        mimeType === 'image/jpeg' ||
        mimeType === 'image/jpg' ||
        fileName.endsWith('.jpg') ||
        fileName.endsWith('.jpeg');

      if (!isPng && !isJpg) {
        throw new Error(
          `${item.file.name} supported image nahi hai. Sirf JPG, JPEG, PNG allowed hai.`
        );
      }

      /**
       * Embed the ORIGINAL image.
       * No trimOuterWhitespace() here.
       * No canvas crop.
       */
      const embeddedImage = isPng
        ? await mergedPdf.embedPng(bytes)
        : await mergedPdf.embedJpg(bytes);

      const imageWidth = embeddedImage.width;
      const imageHeight = embeddedImage.height;

      if (!imageWidth || !imageHeight) {
        throw new Error(
          `Invalid image dimensions: ${item.file.name}`
        );
      }

      /**
       * Keep the original image ratio.
       *
       * Use a standard PDF width for a practical PDF size,
       * then calculate height from the exact image ratio.
       *
       * This is NOT A4. The page follows the source image.
       */
      const PDF_WIDTH = 595.28;
      const PDF_HEIGHT =
        PDF_WIDTH * (imageHeight / imageWidth);

      const page = mergedPdf.addPage([
        PDF_WIDTH,
        PDF_HEIGHT,
      ]);

      /**
       * Image and page have the exact same ratio,
       * therefore the image fills the whole page.
       */
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: PDF_WIDTH,
        height: PDF_HEIGHT,
      });

      pageCount += 1;
    }

    onProgress?.(
      i + 1,
      orderedFiles.length,
      item.id
    );
  }

  const pdfBytes = await mergedPdf.save({
    useObjectStreams: true,
  });

  const blob = new Blob([pdfBytes], {
    type: 'application/pdf',
  });

  return {
    blob,
    filename: getZorPdfFileName('pdf'),
    pageCount,
    originalSize,
    pdfSize: blob.size,
    compressionRatio:
      originalSize > 0
        ? Math.round(
            ((originalSize - blob.size) / originalSize) * 100
          )
        : 0,
  };
};

export default function ConverterWorkspace() {
  const [activeTab, setActiveTab] = useState<ToolId>('jpg-to-pdf');
  const [state, setState] = useState<'idle' | 'loading' | 'selected' | 'converting' | 'done' | 'error'>('idle');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('balanced');
  const [estimatedSize, setEstimatedSize] = useState<{ min: number; max: number } | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tool = tools.find(t => t.id === activeTab) as Tool;

  // Thumbnails load karo — directly file array pass karo (no stale closure)
  const loadThumbnails = async (newItems: FileItem[], existingFiles: FileItem[]) => {
    const pendingImages = newItems.filter(f => f.fileType === 'image');
    const pendingPdfs = newItems.filter(f => f.fileType === 'pdf');

    setLoadingProgress({ loaded: 0, total: pendingImages.length });

    // Image thumbnails load karo
    const updatedItems = [...newItems];
    for (let i = 0; i < pendingImages.length; i++) {
      const fileItem = pendingImages[i];
      try {
        const info = await loadImageInfo(fileItem.file);
        const idx = updatedItems.findIndex(f => f.id === fileItem.id);
        if (idx !== -1) {
          updatedItems[idx] = { ...updatedItems[idx], status: 'ready', thumbnail: info.thumbnail, width: info.width, height: info.height };
        }
        setLoadingProgress({ loaded: i + 1, total: pendingImages.length });
      } catch (err) {
        console.error('Failed to load thumbnail:', err);
        const idx = updatedItems.findIndex(f => f.id === fileItem.id);
        if (idx !== -1) updatedItems[idx] = { ...updatedItems[idx], status: 'error', error: 'Failed to load image' };
      }
    }

    // PDF files ready mark karo
    for (let i = 0; i < pendingPdfs.length; i++) {
      const idx = updatedItems.findIndex(f => f.id === pendingPdfs[i].id);
      if (idx !== -1) updatedItems[idx] = { ...updatedItems[idx], status: 'ready' };
    }

    // Final state update — existing + new updated items
    const finalFiles = [...existingFiles, ...updatedItems];
    setFiles(finalFiles);

    // Size estimate
    const allImageFiles = finalFiles.filter(f => f.fileType === 'image' && f.status === 'ready').map(f => f.file);
    if (allImageFiles.length > 0) {
      const size = estimatePdfSize(allImageFiles, compressionLevel);
      setEstimatedSize({ min: size.minSize, max: size.maxSize });
    }

    setState('selected');
  };

  const addFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const maxSize = 50 * 1024 * 1024;

    if (files.length + fileArray.length > MAX_FILES) {
      alert(`Maximum ${MAX_FILES} files allowed.`);
      return;
    }
    const oversizedFiles = fileArray.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const newFileItems: FileItem[] = [];
    const unsupportedFiles: string[] = [];

    for (const file of fileArray) {
      const fileType = getFileType(file);

      if (!fileType) {
        unsupportedFiles.push(file.name);
        continue;
      }

      newFileItems.push({
        id: generateId(),
        file,
        fileType,
        status: 'pending',
        progress: 0,
      });
    }

    if (unsupportedFiles.length > 0) {
      alert(
        `Unsupported file${unsupportedFiles.length > 1 ? 's' : ''}: ${unsupportedFiles.join(', ')}\n\nSupported: JPG, JPEG, PNG and PDF.`
      );
    }

    if (newFileItems.length === 0) {
      return;
    }

    if (activeTab === 'jpg-to-pdf') {
      setState('loading');

      // Preserve all existing files so JPG + PDF + PNG can be combined.
      const existingFiles = [...files];

      await loadThumbnails(newFileItems, existingFiles);
    } else {
      setFiles(prev => [...prev, ...newFileItems]);
      setState('selected');
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setState('idle');
        setEstimatedSize(null);
      } else if (activeTab === 'jpg-to-pdf') {
        const imageFiles = updated.filter(f => f.status === 'ready' && f.fileType === 'image').map(f => f.file);
        if (imageFiles.length > 0) {
          const size = estimatePdfSize(imageFiles, compressionLevel);
          setEstimatedSize({ min: size.minSize, max: size.maxSize });
        } else {
          setEstimatedSize(null);
        }
      }
      return updated;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    setState('idle');
    setEstimatedSize(null);
    setLoadingProgress({ loaded: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, compressionLevel, files]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const updateFileProgress = (id: string, progress: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
  };

  const updateFileStatus = (
    id: string,
    status: FileItem['status'],
    result?: { blob: Blob; filename: string },
    pdfResult?: MergeResult,
    error?: string
  ) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status, result, pdfResult, error } : f
    ));
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    const currentFiles = [...files]; // snapshot lelo
    setState('converting');

    try {
      if (activeTab === 'jpg-to-pdf') {
        const readyFiles = currentFiles.filter(
          f => f.status === 'ready' && (f.fileType === 'image' || f.fileType === 'pdf')
        );

        if (readyFiles.length === 0) throw new Error('No valid files ready');

        currentFiles.forEach(f => updateFileStatus(f.id, 'converting'));

        const result = await mergePdfAndImagesToPdf(
          readyFiles,
          (current, total, fileId) => {
            updateFileProgress(fileId, Math.round((current / total) * 100));
          }
        );

        updateFileStatus(
          readyFiles[0].id,
          'done',
          { blob: result.blob, filename: result.filename },
          result
        );

        readyFiles.slice(1).forEach(f => updateFileStatus(f.id, 'done'));

      } else if (activeTab === 'pdf-to-jpg') {
        const pdfFile = currentFiles[0];
        if (!pdfFile) throw new Error('No PDF file selected');
        updateFileStatus(pdfFile.id, 'converting');
        try {
          const { convertPdfToImages, createZipFromImages } = await import('@/lib/pdfToImage');
          const result = await convertPdfToImages(pdfFile.file, (current: number, total: number) => {
            updateFileProgress(pdfFile.id, Math.round((current / total) * 100));
          });
          if (result.images.length === 1) {
            updateFileStatus(pdfFile.id, 'done', { blob: result.images[0].blob, filename: getZorPdfFileName('jpg') });
          } else {
            const zipBlob = await createZipFromImages(result.images);
            updateFileStatus(pdfFile.id, 'done', { blob: zipBlob, filename: getZorPdfFileName('zip') });
          }
        } catch (err: any) {
          updateFileStatus(pdfFile.id, 'error', undefined, undefined, err?.message || 'PDF to JPG conversion failed');
        }

      } else if (activeTab === 'pdf-to-word') {
        const pdfFile = currentFiles[0];
        if (!pdfFile) throw new Error('No PDF file selected');
        updateFileStatus(pdfFile.id, 'converting');
        try {
          const { convertPdfToDocx } = await import('@/lib/pdfToDocx');
          const result = await convertPdfToDocx(pdfFile.file);
          updateFileStatus(pdfFile.id, 'done', { blob: result.blob, filename: result.filename });
        } catch (err: any) {
          updateFileStatus(pdfFile.id, 'error', undefined, undefined, err?.message || 'PDF to DOCX conversion failed');
        }

      } else if (activeTab === 'pdf-compressor') {
        const pdfFile = currentFiles[0];
        if (!pdfFile) throw new Error('No PDF file selected');
        updateFileStatus(pdfFile.id, 'converting');
        try {
          const { compressPdf } = await import('@/lib/pdfCompressor');
          const result = await compressPdf(pdfFile.file, compressionLevel);
          updateFileProgress(pdfFile.id, 100);
          setFiles(prev => prev.map(f =>
            f.id === pdfFile.id ? {
              ...f,
              pdfResult: {
                blob: result.blob,
                filename: result.filename,
                pageCount: 0,
                originalSize: result.originalSize,
                pdfSize: result.compressedSize,
                compressionRatio: result.compressionRatio,
              }
            } : f
          ));
          updateFileStatus(pdfFile.id, 'done', { blob: result.blob, filename: result.filename });
        } catch (err: any) {
          updateFileStatus(pdfFile.id, 'error', undefined, undefined, err?.message || 'PDF compression failed');
        }

      } else if (activeTab === 'word-to-pdf') {
        const docxFile = currentFiles[0];
        if (!docxFile) throw new Error('No DOCX file selected');
        updateFileStatus(docxFile.id, 'converting');
        try {
          const { convertDocxToPdf } = await import('@/lib/docxToPdf');
          const result = await convertDocxToPdf(docxFile.file);
          updateFileProgress(docxFile.id, 100);
          updateFileStatus(docxFile.id, 'done', { blob: result.blob, filename: result.filename });
        } catch (err: any) {
          updateFileStatus(docxFile.id, 'error', undefined, undefined, err?.message || 'DOCX to PDF conversion failed');
        }

      } else if (activeTab === 'png-to-jpg') {
        for (const fileItem of currentFiles) {
          updateFileStatus(fileItem.id, 'converting');
          try {
            const compressed = await compressImage(fileItem.file, compressionLevel);
            const filename = getZorPdfFileName('jpg');
            updateFileProgress(fileItem.id, 100);
            updateFileStatus(fileItem.id, 'done', { blob: compressed.blob, filename });
          } catch (err: any) {
            updateFileStatus(fileItem.id, 'error', undefined, undefined, err?.message || 'Conversion failed');
          }
        }

      } else {
        for (const fileItem of currentFiles) {
          updateFileStatus(fileItem.id, 'error', undefined, undefined, 'This conversion is not yet implemented.');
        }
      }

      setState('done');
    } catch (err: any) {
      setState('error');
      files.forEach(f => updateFileStatus(f.id, 'error', undefined, undefined, err?.message || 'Conversion failed'));
    }
  };

  const downloadFile = (fileItem: FileItem) => {
    if (!fileItem.result) return;
    const url = URL.createObjectURL(fileItem.result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileItem.result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    const completedFiles = files.filter(f => f.status === 'done' && f.result);
    if (completedFiles.length === 0) return;
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    completedFiles.forEach(f => { if (f.result) zip.file(f.result.filename, f.result.blob); });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-files-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const completedCount = files.filter(f => f.status === 'done').length;
  const mergedPdf = files.find(f => f.pdfResult)?.pdfResult;
  const totalSavings = mergedPdf ? calculateCompressionPercentage(mergedPdf.originalSize, mergedPdf.pdfSize) : 0;

  const readyImages: ImageProcessingResult[] = files
    .filter(f => f.status === 'ready' && f.fileType === 'image' && f.thumbnail)
    .map(f => ({ id: f.id, file: f.file, thumbnail: f.thumbnail!, width: f.width!, height: f.height! }));

  const readyPdfs = files.filter(f => f.status === 'ready' && f.fileType === 'pdf');
  const readyFilesCount = readyImages.length + readyPdfs.length;

  const handleTabChange = (tabId: ToolId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      clearAllFiles();
    }
  };

  const getAcceptString = () => {
    if (activeTab === 'jpg-to-pdf') return JPG_TO_PDF_ACCEPT;
    return tool?.accept ?? '*';
  };

  const isMultiFile = ['jpg-to-pdf', 'png-to-jpg'].includes(activeTab);

  return (
    <section id="tools" className="pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Converter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-3 mb-6 scrollbar-hide -mx-1 px-1">
          {converterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs font-bold opacity-70">{tab.from}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="text-xs font-bold opacity-70">{tab.to}</span>
            </button>
          ))}
        </div>

        {/* Converter Card */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tool?.iconBg} flex items-center justify-center`}>
                {tool?.icon && <tool.icon className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">{tool?.title}</h2>
                <p className="text-slate-500 text-xs">{tool?.description}</p>
              </div>
            </div>
            {/* Clear all — sirf tab dikhao jab files hon AND state idle/loading/selected ho */}
            {files.length > 0 && (state === 'idle' || state === 'loading' || state === 'selected') && (
              <button
                onClick={clearAllFiles}
                className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear all
              </button>
            )}
          </div>

          {/* Card Body */}
          <div className="p-6 min-h-[320px]">
            <AnimatePresence mode="wait" initial={false}>
              {(state === 'idle' || state === 'loading' || state === 'selected') && (
                <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  {/* Drop Zone */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                      ${isDragging ? 'border-blue-400 bg-blue-600/10' : 'border-white/10 hover:border-blue-500/40 hover:bg-blue-900/5'}
                      ${files.length > 0 ? 'py-6' : 'py-16'}
                    `}
                  >
                    <div className="flex flex-col items-center justify-center text-center px-4">
                      <div className={`w-14 h-14 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-3 transition-transform ${isDragging ? 'scale-110' : ''}`}>
                        <Upload className={`w-6 h-6 ${isDragging ? 'text-blue-400' : 'text-blue-500/60'}`} />
                      </div>
                      <p className="text-white text-sm font-medium mb-1">
                        {isDragging ? 'Drop files here' : 'Drag & drop your files here'}
                      </p>
                      <p className="text-slate-500 text-xs mb-3">
                        {activeTab === 'jpg-to-pdf'
                          ? `Up to ${MAX_FILES} JPG, PNG or PDF files`
                          : 'or click to browse'}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="btn-primary px-5 py-2 rounded-lg text-xs font-semibold text-white"
                      >
                        Upload Files
                      </button>
                      <p className="text-slate-600 text-[11px] mt-2">
                        {activeTab === 'jpg-to-pdf' ? '.jpg, .jpeg, .png, .pdf'
                          : tool?.accept} | Max 50MB per file
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple={isMultiFile}
                      accept={getAcceptString()}
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Loading indicator */}
                  {state === 'loading' && (
                    <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                      Loading thumbnails... {loadingProgress.loaded}/{loadingProgress.total}
                    </div>
                  )}

                  {/* File list — jpg-to-pdf */}
                  {(activeTab === 'jpg-to-pdf') && readyFilesCount > 0 && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm font-medium">
                            {readyImages.length > 0 && `${readyImages.length} image${readyImages.length !== 1 ? 's' : ''}`}
                            {readyImages.length > 0 && readyPdfs.length > 0 && ' + '}
                            {readyPdfs.length > 0 && `${readyPdfs.length} PDF${readyPdfs.length !== 1 ? 's' : ''}`}
                          </span>
                          <span className="text-slate-500 text-xs">({formatBytes(totalSize)})</span>
                        </div>
                        <span className="text-slate-600 text-xs">Drag to reorder</span>
                      </div>

                      <Reorder.Group
                        axis="y"
                        values={files.filter(f => f.status === 'ready')}
                        onReorder={(reordered) => {
                          setFiles(prev => {
                            const nonReady = prev.filter(f => f.status !== 'ready');
                            return [...reordered, ...nonReady];
                          });
                        }}
                        className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1"
                      >
                        {files.filter(f => f.status === 'ready').map((f, index) => (
                          f.fileType === 'image' ? (
                            <Reorder.Item key={f.id} value={f} className="cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-7 h-7 rounded bg-blue-600/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="w-24 h-24 rounded bg-slate-700 flex-shrink-0 overflow-hidden">
                                  <img src={f.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">{f.file.name}</p>
                                  <p className="text-slate-500 text-[11px]">{f.width}×{f.height} | {formatBytes(f.file.size)}</p>
                                </div>
                                <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Reorder.Item>
                          ) : (
                            <Reorder.Item key={f.id} value={f} className="cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-red-900/10 border border-red-500/20 hover:border-red-500/30 transition-colors">
                                <div className="w-7 h-7 rounded bg-red-600/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-red-400 text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="w-24 h-24 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-6 h-6 text-red-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">{f.file.name}</p>
                                  <p className="text-red-400 text-[11px]">PDF • {formatBytes(f.file.size)}</p>
                                </div>
                                <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Reorder.Item>
                          )
                        ))}
                      </Reorder.Group>
                    </div>
                  )}

                  {/* Simple file list — other tools */}
                  {activeTab !== 'jpg-to-pdf' && files.length > 0 && (
                    <div className="mt-4 space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                      {files.map((f) => (
                        <div key={f.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-white/5">
                          <div className="w-10 h-10 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
                            <File className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{f.file.name}</p>
                            <p className="text-slate-500 text-[11px]">{formatBytes(f.file.size)}</p>
                          </div>
                          <button onClick={() => removeFile(f.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Size estimation */}
                  {(activeTab === 'jpg-to-pdf') && estimatedSize && readyImages.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-500/15 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">Original: <span className="text-white font-medium">{formatBytes(totalSize)}</span></span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400">Est. PDF: <span className="text-green-400 font-medium">{formatBytes(estimatedSize.min)} – {formatBytes(estimatedSize.max)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-md">
                        <Zap className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">~{Math.round(70 - (estimatedSize.min / totalSize) * 100)}% smaller</span>
                      </div>
                    </div>
                  )}

                  {/* Compression level — user ab khud quality choose kar sakta hai */}
                  {['jpg-to-pdf', 'png-to-jpg', 'pdf-compressor', 'pdf-to-jpg'].includes(activeTab) && files.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-slate-800/30 border border-white/5">
                      <CompressionLevelSelector
                        value={compressionLevel}
                        onChange={setCompressionLevel}
                      />
                    </div>
                  )}

                  {/* Convert Button */}
                  {files.length > 0 && (
                    <button
                      onClick={processFiles}
                      disabled={
                        state === 'loading' ||
                        ((activeTab === 'jpg-to-pdf') && readyFilesCount === 0)
                      }
                      className="w-full mt-5 btn-primary py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {activeTab === 'jpg-to-pdf' ? (
                        <><Layers className="w-4 h-4" />Merge {readyFilesCount} File{readyFilesCount !== 1 ? 's' : ''} to PDF</>
                      ) : (
                        <>Convert to {tool?.to}</>
                      )}
                    </button>
                  )}

                </motion.div>
              )}

              {/* Converting State */}
              {state === 'converting' && (
                <motion.div key="converting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-8">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full border-3 border-blue-500/30 border-t-blue-500 animate-spin" />
                    <p className="text-white font-semibold text-base mb-1">
                      {activeTab === 'jpg-to-pdf' ? 'Merging files into PDF...' : 'Converting files...'}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Done State */}
              {state === 'done' && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="py-6">
                  <div className="text-center mb-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="w-14 h-14 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mb-4 mx-auto"
                    >
                      <CheckCircle2 className="w-7 h-7 text-green-400" />
                    </motion.div>
                    <h3 className="text-white font-bold text-lg mb-1">
                      {activeTab === 'jpg-to-pdf' ? 'PDF Created!' : 'Conversion Complete!'}
                    </h3>
                    {(activeTab === 'jpg-to-pdf') && mergedPdf && (
                      <div className="mt-3 p-3 rounded-lg bg-green-900/10 border border-green-500/15 inline-block">
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-center">
                            <p className="text-slate-500 text-[11px]">Original</p>
                            <p className="text-white font-semibold">{formatBytes(mergedPdf.originalSize)}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-green-400" />
                          <div className="text-center">
                            <p className="text-slate-500 text-[11px]">PDF</p>
                            <p className="text-green-400 font-bold">{formatBytes(mergedPdf.pdfSize)}</p>
                          </div>
                          <div className="px-2 py-1 bg-green-500/15 rounded">
                            <p className="text-green-400 font-bold text-xs">{totalSavings}% saved</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(activeTab === 'jpg-to-pdf') && mergedPdf ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/40 border border-white/5 mb-5">
                      <div className="w-10 h-10 rounded-lg bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{mergedPdf.filename}</p>
                        <p className="text-slate-500 text-xs">{mergedPdf.pageCount} pages | {formatBytes(mergedPdf.pdfSize)}</p>
                      </div>
                      <DownloadButton
                        onClick={() => { const f = files.find(f => f.pdfResult); if (f) downloadFile(f); }}
                        size="sm"
                        text="Download"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 mb-5">
                      {files.map((fileItem) => (
                        <div key={fileItem.id} className={`flex items-center gap-2.5 p-2 rounded-lg border ${
                          fileItem.status === 'done' ? 'bg-slate-800/40 border-white/5' : 'bg-red-900/10 border-red-500/15'
                        }`}>
                          <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                            fileItem.status === 'done' ? 'bg-green-500/15' : 'bg-red-500/15'
                          }`}>
                            {fileItem.status === 'done'
                              ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                              : <AlertCircle className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{fileItem.result?.filename || fileItem.file.name}</p>
                            <p className="text-slate-500 text-[11px]">
                              {fileItem.result ? formatBytes(fileItem.result.blob.size) : fileItem.error || 'Failed'}
                            </p>
                          </div>
                          {fileItem.status === 'done' && fileItem.result && (
                            <DownloadButton onClick={() => downloadFile(fileItem)} size="sm" text="Download" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    {completedCount > 1 && activeTab !== 'jpg-to-pdf' && (
                      <DownloadButton onClick={downloadAllAsZip} text="Download All as ZIP" size="md" fullWidth />
                    )}
                    <button
                      onClick={clearAllFiles}
                      className="w-full py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Convert More
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Error State */}
              {state === 'error' && (
                <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center">
                  <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 mx-auto">
                    <AlertCircle className="w-7 h-7 text-red-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">Conversion failed</h3>
                  <p className="text-slate-500 text-xs mb-5">
                    {files.find(f => f.error)?.error || 'Kuch gadbad ho gayi files convert karte waqt.'}
                  </p>
                  <button
                    onClick={clearAllFiles}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white glass border border-white/10 inline-flex items-center gap-1.5 mx-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Try Again
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
