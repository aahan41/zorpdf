'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  Upload, X, FileText, Layers, ArrowRight,
  Zap, GripVertical, Image as ImageIcon, Trash2, CheckCircle2,
  RotateCcw, File, AlertCircle
} from 'lucide-react';
import type { CompressionLevel } from '@/lib/imageCompression';
import type { ImageProcessingResult } from '@/lib/pdfMerger';
import { loadImageInfo, mergeImagesToPdf, type MergeResult } from '@/lib/pdfMerger';
import { formatBytes, calculateCompressionPercentage, compressImage } from '@/lib/imageCompression';
import { estimatePdfSize } from '@/lib/pdfEstimator';
import { getZorPdfFileName } from '@/lib/fileNaming';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { tools, type ToolId, type Tool } from './ToolsGrid';

const converterTabs: { id: ToolId; label: string; from: string; to: string }[] = [
  { id: 'jpg-to-pdf', label: 'JPG to PDF', from: 'JPG', to: 'PDF' },
  { id: 'pdf-to-jpg', label: 'PDF to JPG', from: 'PDF', to: 'JPG' },
  { id: 'png-to-jpg', label: 'PNG to JPG', from: 'PNG', to: 'JPG' },
  { id: 'png-to-pdf', label: 'PNG to PDF', from: 'PNG', to: 'PDF' },
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

  useEffect(() => {
    if (activeTab === 'jpg-to-pdf' && state === 'loading' && files.some(f => f.status === 'pending')) {
      loadPendingThumbnails();
    }
  }, [files, state, activeTab]);

  const loadPendingThumbnails = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending' && f.fileType === 'image');
    if (pendingFiles.length === 0) {
      setState('selected');
      return;
    }
    for (let i = 0; i < pendingFiles.length; i++) {
      const fileItem = pendingFiles[i];
      try {
        const info = await loadImageInfo(fileItem.file);
        setFiles(prev => prev.map(f =>
          f.id === fileItem.id
            ? { ...f, status: 'ready', thumbnail: info.thumbnail, width: info.width, height: info.height }
            : f
        ));
        setLoadingProgress({ loaded: i + 1, total: pendingFiles.length });
      } catch (err) {
        console.error('Failed to load thumbnail:', err);
      }
    }
    // PDF files ko bhi ready mark karo
    setFiles(prev => prev.map(f =>
      f.fileType === 'pdf' && f.status === 'pending' ? { ...f, status: 'ready' } : f
    ));
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

    const newFileItems: FileItem[] = fileArray.map(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      return {
        id: generateId(),
        file,
        fileType: isPdf ? 'pdf' : 'image',
        status: 'pending' as const,
        progress: 0,
      };
    });

    setFiles(prev => [...prev, ...newFileItems]);

    if (activeTab === 'jpg-to-pdf') {
      setState('loading');
      setLoadingProgress({ loaded: 0, total: newFileItems.filter(f => f.fileType === 'image').length });
      const allFiles = [...files.map(f => f.file), ...fileArray].filter(f => !f.type.includes('pdf'));
      if (allFiles.length > 0) {
        const size = estimatePdfSize(allFiles, compressionLevel);
        setEstimatedSize({ min: size.minSize, max: size.maxSize });
      }
    } else {
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
        const remainingImageFiles = updated.filter(f => f.status === 'ready' && f.fileType === 'image').map(f => f.file);
        if (remainingImageFiles.length > 0) {
          const size = estimatePdfSize(remainingImageFiles, compressionLevel);
          setEstimatedSize({ min: size.minSize, max: size.maxSize });
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
  }, [files, compressionLevel, activeTab]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
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
    setState('converting');
    try {
      if (activeTab === 'jpg-to-pdf') {
        const imageFiles = files.filter(f => f.fileType === 'image' && f.status === 'ready' && f.thumbnail);
        const pdfFiles = files.filter(f => f.fileType === 'pdf' && f.status === 'ready');

        if (imageFiles.length === 0 && pdfFiles.length === 0) throw new Error('No valid files ready');

        // Sab files ko converting mark karo
        files.forEach(f => updateFileStatus(f.id, 'converting'));

        // PDFs ko pages mein convert karo images ki tarah
        let allImageData: ImageProcessingResult[] = imageFiles.map(f => ({
          id: f.id, file: f.file, thumbnail: f.thumbnail!, width: f.width!, height: f.height!,
        }));

        // PDF files ko images mein convert karo pehle
        if (pdfFiles.length > 0) {
          const pdfToImageModule = await import('@/lib/pdfToImage');
          const convertPdfToImages = pdfToImageModule.convertPdfToImages as (file: File, cb: () => void) => Promise<{ images: Array<{ blob: Blob; data: Uint8Array; pageNumber: number; filename: string }>; totalPages: number }>;
          for (const pdfFile of pdfFiles) {
            const result = await convertPdfToImages(pdfFile.file, () => {});
            for (const img of result.images) {
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              const imgFile = new File([img.data], `pdf-page-${img.pageNumber}.jpg`, { type: 'image/jpeg' });
              const info = await loadImageInfo(imgFile);
              allImageData.push({
                id: generateId(),
                file: imgFile,
                thumbnail: info.thumbnail,
                width: info.width,
                height: info.height,
              });
            }
          }
        }

        const result = await mergeImagesToPdf(allImageData, compressionLevel, (current, total, imageId) => {
          updateFileProgress(imageId, Math.round((current / total) * 100));
        });

        updateFileStatus(files[0].id, 'done', { blob: result.blob, filename: result.filename }, result);
        files.slice(1).forEach(f => updateFileStatus(f.id, 'done'));

      } else if (activeTab === 'pdf-to-jpg') {
        const pdfFile = files[0];
        if (!pdfFile) throw new Error('No PDF file selected');
        updateFileStatus(pdfFile.id, 'converting');
        try {
          const { convertPdfToImages, createZipFromImages } = await import('@/lib/pdfToImage');
          const result = await convertPdfToImages(pdfFile.file, (current, total) => {
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
        const pdfFile = files[0];
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
        const pdfFile = files[0];
        if (!pdfFile) throw new Error('No PDF file selected');
        updateFileStatus(pdfFile.id, 'converting');
        try {
          const { compressPdf } = await import('@/lib/pdfCompressor');
          const result = await compressPdf(pdfFile.file, 'medium');
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
        const docxFile = files[0];
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
        for (const fileItem of files) {
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
        for (const fileItem of files) {
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
  const hasErrors = files.some(f => f.status === 'error');
  const mergedPdf = files.find(f => f.pdfResult)?.pdfResult;
  const totalSavings = mergedPdf ? calculateCompressionPercentage(mergedPdf.originalSize, mergedPdf.pdfSize) : 0;

  const readyImages: ImageProcessingResult[] = files
    .filter(f => f.status === 'ready' && f.fileType === 'image' && f.thumbnail)
    .map(f => ({ id: f.id, file: f.file, thumbnail: f.thumbnail!, width: f.width!, height: f.height! }));

  const readyPdfs = files.filter(f => f.status === 'ready' && f.fileType === 'pdf');

  const handleTabChange = (tabId: ToolId) => {
    if (tabId !== activeTab) {
      setActiveTab(tabId);
      clearAllFiles();
    }
  };

  // JPG to PDF tab ke liye accept
  const jpgToPdfAccept = '.jpg,.jpeg,.png,.pdf,application/pdf';

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
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tool.iconBg} flex items-center justify-center`}>
                <tool.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-sm">{tool.title}</h2>
                <p className="text-slate-500 text-xs">{tool.description}</p>
              </div>
            </div>
            {files.length > 0 && state !== 'converting' && state !== 'done' && (
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
          <div className="p-6">
            <AnimatePresence mode="wait">
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
                      ${files.length > 0 ? 'py-6' : 'py-14'}
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
                          ? `Up to ${MAX_FILES} images or PDFs merged into one PDF`
                          : 'or click to browse'
                        }
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                        className="btn-primary px-5 py-2 rounded-lg text-xs font-semibold text-white"
                      >
                        Upload Files
                      </button>
                      <p className="text-slate-600 text-[11px] mt-2">
                        {activeTab === 'jpg-to-pdf' ? '.jpg,.jpeg,.png,.pdf' : tool.accept} | Max 50MB per file
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={activeTab === 'jpg-to-pdf' ? jpgToPdfAccept : tool.accept}
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>

                  {/* Loading */}
                  {state === 'loading' && activeTab === 'jpg-to-pdf' && (
                    <div className="mt-4 flex items-center gap-2 text-slate-400 text-xs">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
                      Loading thumbnails... {loadingProgress.loaded}/{loadingProgress.total}
                    </div>
                  )}

                  {/* Image + PDF file list for JPG to PDF */}
                  {activeTab === 'jpg-to-pdf' && (readyImages.length > 0 || readyPdfs.length > 0) && (
                    <div className="mt-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm font-medium">
                            {readyImages.length} image{readyImages.length !== 1 ? 's' : ''}
                            {readyPdfs.length > 0 && ` + ${readyPdfs.length} PDF${readyPdfs.length !== 1 ? 's' : ''}`}
                          </span>
                          <span className="text-slate-500 text-xs">({formatBytes(totalSize)})</span>
                        </div>
                        <span className="text-slate-600 text-xs">Drag to reorder</span>
                      </div>

                      <Reorder.Group
                        axis="y"
                        values={readyImages}
                        onReorder={(reordered) => {
                          const reorderedMap = new Map(reordered.map((img, idx) => [img.id, idx]));
                          setFiles(prev => {
                            const reordered = [...prev].sort((a, b) => {
                              const aIdx = reorderedMap.get(a.id) ?? prev.indexOf(a);
                              const bIdx = reorderedMap.get(b.id) ?? prev.indexOf(b);
                              return aIdx - bIdx;
                            });
                            return reordered;
                          });
                        }}
                        className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1"
                      >
                        {files.filter(f => f.status === 'ready').map((f, index) => (
                          f.fileType === 'image' ? (
                            <Reorder.Item key={f.id} value={readyImages.find(img => img.id === f.id) || readyImages[0]} className="cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800/40 border border-white/5 hover:border-white/10 transition-colors">
                                <div className="w-7 h-7 rounded bg-blue-600/15 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-400 text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="w-16 h-16 rounded bg-slate-700 flex-shrink-0 overflow-hidden">
                                  <img src={f.thumbnail} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-xs font-medium truncate">{f.file.name}</p>
                                  <p className="text-slate-500 text-[11px]">{f.width}x{f.height} | {formatBytes(f.file.size)}</p>
                                </div>
                                <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                                <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-1 text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </Reorder.Item>
                          ) : (
                            <Reorder.Item key={f.id} value={{ id: f.id, file: f.file, thumbnail: '', width: 0, height: 0 }} className="cursor-grab active:cursor-grabbing">
                              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-red-900/10 border border-red-500/20 hover:border-red-500/30 transition-colors">
                                <div className="w-7 h-7 rounded bg-red-600/15 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                                  <span className="text-red-400 text-xs font-bold">{index + 1}</span>
                                </div>
                                <div className="w-16 h-16 rounded bg-slate-700 flex items-center justify-center flex-shrink-0">
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

                  {/* Simple file list for other tools */}
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
                  {activeTab === 'jpg-to-pdf' && estimatedSize && readyImages.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-500/15 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-400">Original: <span className="text-white font-medium">{formatBytes(totalSize)}</span></span>
                        <ArrowRight className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400">Est. PDF: <span className="text-green-400 font-medium">{formatBytes(estimatedSize.min)} - {formatBytes(estimatedSize.max)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-md">
                        <Zap className="w-3 h-3 text-green-400" />
                        <span className="text-green-400 text-xs font-medium">~{Math.round(70 - (estimatedSize.min / totalSize) * 100)}% smaller</span>
                      </div>
                    </div>
                  )}

                  {/* Convert Button */}
                  {files.length > 0 && (
                    <button
                      onClick={processFiles}
                      disabled={files.length === 0 || (activeTab === 'jpg-to-pdf' && readyImages.length === 0 && readyPdfs.length === 0)}
                      className="w-full mt-5 btn-primary py-3.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-blue-900/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {activeTab === 'jpg-to-pdf' ? (
                        <>
                          <Layers className="w-4 h-4" />
                          Merge {readyImages.length + readyPdfs.length} File{(readyImages.length + readyPdfs.length) !== 1 ? 's' : ''} to PDF
                        </>
                      ) : (
                        <>Convert to {tool.to}</>
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
                    {activeTab === 'jpg-to-pdf' && mergedPdf && (
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

                  {activeTab === 'jpg-to-pdf' && mergedPdf ? (
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
                            {fileItem.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{fileItem.result?.filename || fileItem.file.name}</p>
                            <p className="text-slate-500 text-[11px]">{fileItem.result ? formatBytes(fileItem.result.blob.size) : fileItem.error || 'Failed'}</p>
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
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
