'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileCheck, Download, X, AlertCircle,
  RotateCcw, CheckCircle2, File, Package, Trash2,
  ArrowRight, Zap
} from 'lucide-react';
import type { Tool, ToolId } from './ToolsGrid';
import type { CompressionLevel } from '@/lib/imageCompression';
import { estimatePdfSize, convertImageToPdf, type PdfConversionResult } from '@/lib/pdfConverter';
import { compressImage, formatBytes, calculateCompressionPercentage } from '@/lib/imageCompression';
import CompressionLevelSelector from '@/components/ui/CompressionLevelSelector';

interface UploadSectionProps {
  toolId: ToolId;
  tool: Tool;
}

interface FileItem {
  id: string;
  file: File;
  status: 'pending' | 'converting' | 'done' | 'error';
  progress: number;
  result?: { blob: Blob; filename: string };
  pdfResult?: PdfConversionResult;
  error?: string;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

export default function UploadSection({ toolId, tool }: UploadSectionProps) {
  const [state, setState] = useState<'idle' | 'selected' | 'converting' | 'done' | 'error'>('idle');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('balanced');
  const [estimatedSize, setEstimatedSize] = useState<{ min: number; max: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const maxFiles = 50;
    const maxSize = 50 * 1024 * 1024;

    if (files.length + fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed.`);
      return;
    }

    const oversizedFiles = fileArray.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`Some files exceed 50MB limit: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const newFileItems: FileItem[] = fileArray.map(file => ({
      id: generateId(),
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setFiles(prev => [...prev, ...newFileItems]);
    setState('selected');

    // Estimate PDF size for JPG to PDF
    if (toolId === 'jpg-to-pdf') {
      const allFiles = [...files.map(f => f.file), ...fileArray];
      const size = estimatePdfSize(allFiles, compressionLevel);
      setEstimatedSize({ min: size.minSize, max: size.maxSize });
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setState('idle');
        setEstimatedSize(null);
      } else if (toolId === 'jpg-to-pdf') {
        const remainingFiles = updated.map(f => f.file);
        const size = estimatePdfSize(remainingFiles, compressionLevel);
        setEstimatedSize({ min: size.minSize, max: size.maxSize });
      }
      return updated;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    setState('idle');
    setEstimatedSize(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [files, compressionLevel]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const updateFileProgress = (id: string, progress: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
  };

  const updateFileStatus = (
    id: string,
    status: FileItem['status'],
    result?: { blob: Blob; filename: string },
    pdfResult?: PdfConversionResult,
    error?: string
  ) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, status, result, pdfResult, error } : f
    ));
  };

  const processFilesWithCompression = async () => {
    if (files.length === 0) return;

    setState('converting');

    try {
      if (toolId === 'jpg-to-pdf') {
        // JPG to PDF with advanced compression
        const imageFiles = files.map(f => f.file).filter(f =>
          f.type.startsWith('image/') && (f.type.includes('jpeg') || f.type.includes('jpg') || f.type.includes('png'))
        );

        if (imageFiles.length === 0) {
          throw new Error('No valid image files found');
        }

        // Update all to converting
        files.forEach(f => updateFileStatus(f.id, 'converting'));
        files.forEach(f => updateFileProgress(f.id, 10));

        // Convert to PDF
        const result = await convertImageToPdf(
          imageFiles,
          compressionLevel,
          (fileIndex, progress) => {
            const fileId = files[fileIndex]?.id;
            if (fileId) {
              updateFileProgress(fileId, 10 + progress * 0.8);
            }
          }
        );

        // Mark all as done
        files.forEach(f => {
          updateFileProgress(f.id, 100);
          updateFileStatus(f.id, 'done', { blob: result.blob, filename: result.filename }, result);
        });

      } else if (toolId === 'png-to-jpg') {
        // PNG to JPG conversion
        for (const fileItem of files) {
          updateFileStatus(fileItem.id, 'converting');
          updateFileProgress(fileItem.id, 20);

          try {
            const compressed = await compressImage(fileItem.file, compressionLevel);
            const baseName = fileItem.file.name.replace(/\.[^.]+$/, '');
            const filename = `${baseName}.jpg`;

            updateFileProgress(fileItem.id, 100);
            updateFileStatus(fileItem.id, 'done', {
              blob: compressed.blob,
              filename,
            });
          } catch (err: any) {
            updateFileStatus(fileItem.id, 'error', undefined, undefined, err?.message || 'Conversion failed');
          }
        }

      } else if (toolId === 'image-compressor') {
        // Image compression
        for (const fileItem of files) {
          updateFileStatus(fileItem.id, 'converting');
          updateFileProgress(fileItem.id, 20);

          try {
            const compressed = await compressImage(fileItem.file, compressionLevel);
            const baseName = fileItem.file.name.replace(/\.[^.]+$/, '');
            const ext = fileItem.file.name.split('.').pop() || 'jpg';
            const filename = `${baseName}-compressed.${ext}`;

            updateFileProgress(fileItem.id, 100);
            updateFileStatus(fileItem.id, 'done', {
              blob: compressed.blob,
              filename,
            });
          } catch (err: any) {
            updateFileStatus(fileItem.id, 'error', undefined, undefined, err?.message || 'Compression failed');
          }
        }

      } else {
        // Not yet implemented
        for (const fileItem of files) {
          updateFileStatus(
            fileItem.id,
            'error',
            undefined,
            undefined,
            'This conversion is not yet implemented. Try JPG to PDF, PNG to JPG, or Image Compressor.'
          );
        }
      }

      setState('done');

    } catch (err: any) {
      setState('error');
      files.forEach(f =>
        updateFileStatus(f.id, 'error', undefined, undefined, err?.message || 'Conversion failed')
      );
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

    completedFiles.forEach(f => {
      if (f.result) {
        zip.file(f.result.filename, f.result.blob);
      }
    });

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

  // Calculate total PDF savings for JPG to PDF
  const totalOriginalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const totalPdfSize = files.find(f => f.pdfResult)?.pdfResult?.pdfSize || 0;
  const totalSavings = totalOriginalSize > 0 && totalPdfSize > 0
    ? calculateCompressionPercentage(totalOriginalSize, totalPdfSize)
    : 0;

  return (
    <div>
      <AnimatePresence mode="wait">
        {(state === 'idle' || state === 'selected') && (
          <motion.div
            key="drop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Compression Level Selector - only for JPG to PDF */}
            {toolId === 'jpg-to-pdf' && files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <CompressionLevelSelector
                  value={compressionLevel}
                  onChange={(level) => {
                    setCompressionLevel(level);
                    if (files.length > 0) {
                      const size = estimatePdfSize(files.map(f => f.file), level);
                      setEstimatedSize({ min: size.minSize, max: size.maxSize });
                    }
                  }}
                />
              </motion.div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragging
                  ? 'border-blue-400 bg-blue-600/10 scale-[1.01]'
                  : 'border-white/15 hover:border-blue-500/50 hover:bg-blue-900/5'
                }`}
            >
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 flex items-center justify-center mb-5 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                  <Upload className={`w-9 h-9 transition-colors ${isDragging ? 'text-blue-400' : 'text-blue-500/70'}`} />
                </div>
                <p className="text-white text-lg font-semibold mb-2">
                  {isDragging ? 'Drop your files here' : 'Drag & drop your files here'}
                </p>
                <p className="text-slate-500 text-sm mb-5">or click to browse (max 50 files)</p>
                <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-900/30"
                >
                  Choose Files
                </button>
                <p className="text-slate-600 text-xs mt-4">
                  Supported: {tool.accept} | Max 50MB per file
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={tool.accept}
                className="hidden"
                onChange={handleInputChange}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </span>
                    <span className="text-slate-500 text-sm">
                      ({formatBytes(totalSize)})
                    </span>
                  </div>
                  <button
                    onClick={clearAllFiles}
                    className="text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear all
                  </button>
                </div>

                {/* Size estimation for JPG to PDF */}
                {toolId === 'jpg-to-pdf' && estimatedSize && files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-4 rounded-xl bg-gradient-to-r from-blue-900/20 to-blue-800/10 border border-blue-500/20"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">Original:</span>
                          <span className="text-white font-semibold">{formatBytes(totalSize)}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-blue-400" />
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 text-sm">Estimated PDF:</span>
                          <span className="text-green-400 font-semibold">
                            {formatBytes(estimatedSize.min)} - {formatBytes(estimatedSize.max)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-green-500/10 px-3 py-1.5 rounded-lg">
                        <Zap className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">
                          ~{Math.round(70 - (estimatedSize.min / totalSize) * 100)}% smaller
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {files.map((fileItem) => (
                    <motion.div
                      key={fileItem.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center flex-shrink-0">
                        <File className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{fileItem.file.name}</p>
                        <p className="text-slate-500 text-xs">{formatBytes(fileItem.file.size)}</p>
                      </div>
                      <button
                        onClick={() => removeFile(fileItem.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>

                <button
                  onClick={processFilesWithCompression}
                  disabled={files.length === 0}
                  className="w-full btn-primary py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                >
                  <FileCheck className="w-5 h-5" />
                  Convert to {tool.to}
                  {toolId === 'jpg-to-pdf' && ' with Compression'}
                </button>
              </motion.div>
            )}
          </motion.div>
        )}

        {state === 'converting' && (
          <motion.div
            key="converting"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <div className="text-center mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-500/30 border-t-blue-500"
              />
              <p className="text-white font-semibold text-xl mb-2">
                {toolId === 'jpg-to-pdf' ? 'Compressing & Converting...' : 'Converting files...'}
              </p>
              <p className="text-slate-500 text-sm">
                {completedCount} of {files.length} completed
              </p>
            </div>

            <div className="w-full max-w-xs mx-auto bg-slate-800 rounded-full h-2 mb-8 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completedCount / files.length) * 100}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              />
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-white/5"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-white text-sm font-medium truncate">{fileItem.file.name}</p>
                      <span className="text-blue-400 text-xs font-medium">{fileItem.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${fileItem.progress}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {state === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center mb-6 mx-auto"
              >
                <CheckCircle2 className="w-10 h-10 text-green-400" />
              </motion.div>
              <h3 className="text-white font-bold text-2xl mb-2">
                Conversion Complete!
              </h3>

              {/* Compression stats for JPG to PDF */}
              {toolId === 'jpg-to-pdf' && totalPdfSize > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-gradient-to-r from-green-900/20 to-green-800/10 border border-green-500/20"
                >
                  <div className="flex items-center justify-center gap-3 text-sm">
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">Original</p>
                      <p className="text-white font-semibold">{formatBytes(totalOriginalSize)}</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-green-400" />
                    <div className="text-center">
                      <p className="text-slate-400 text-xs mb-1">PDF Size</p>
                      <p className="text-green-400 font-bold">{formatBytes(totalPdfSize)}</p>
                    </div>
                    <div className="ml-3 px-3 py-1.5 bg-green-500/20 rounded-lg">
                      <p className="text-green-400 font-bold">{totalSavings}% saved</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!hasErrors && (
                <p className="text-slate-500 text-sm mt-4">
                  {completedCount} file{completedCount !== 1 ? 's' : ''} converted successfully
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2 mb-8">
              {files.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    fileItem.status === 'done'
                      ? 'bg-slate-800/50 border-white/5 hover:border-blue-500/30'
                      : 'bg-red-900/10 border-red-500/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    fileItem.status === 'done'
                      ? 'bg-gradient-to-br from-green-500/20 to-green-700/20'
                      : 'bg-gradient-to-br from-red-500/20 to-red-700/20'
                  }`}>
                    {fileItem.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {fileItem.result?.filename || fileItem.file.name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {fileItem.result ? `${formatBytes(fileItem.result.blob.size)}` : fileItem.error || 'Failed'}
                    </p>
                  </div>
                  {fileItem.status === 'done' && fileItem.result && (
                    <button
                      onClick={() => downloadFile(fileItem)}
                      className="p-2 text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {completedCount > 1 && (
                <button
                  onClick={downloadAllAsZip}
                  className="flex-1 btn-primary py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download All as ZIP
                </button>
              )}
              {completedCount === 1 && files.find(f => f.status === 'done') && (
                <button
                  onClick={() => downloadFile(files.find(f => f.status === 'done')!)}
                  className="flex-1 btn-primary py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              )}
              <button
                onClick={clearAllFiles}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white glass border-glow flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Convert More
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
