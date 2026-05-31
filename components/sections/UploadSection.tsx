'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileCheck, Download, X, AlertCircle,
  RotateCcw, CheckCircle2, File, Link, Loader2,
  Package, FileArchive, Trash2
} from 'lucide-react';
import type { Tool, ToolId } from './ToolsGrid';

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
  error?: string;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

export default function UploadSection({ toolId, tool }: UploadSectionProps) {
  const [state, setState] = useState<ConversionState>('idle');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  type ConversionState = 'idle' | 'selected' | 'uploading' | 'converting' | 'done' | 'error';

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
  };

  const removeFile = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (updated.length === 0) {
        setState('idle');
      }
      return updated;
    });
  };

  const clearAllFiles = () => {
    setFiles([]);
    setState('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [files]);

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

  const convertImageToPdf = async (imageFile: File): Promise<{ blob: Blob; filename: string }> => {
    const { jsPDF } = await import('jspdf');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgData = e.target?.result as string;
        if (!imgData) {
          reject(new Error('Failed to read image data'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const pdf = new jsPDF({
              orientation: img.width > img.height ? 'landscape' : 'portrait',
              unit: 'px',
              format: [img.width, img.height]
            });

            pdf.addImage(imgData, imageFile.type.includes('png') ? 'PNG' : 'JPEG', 0, 0, img.width, img.height);

            const baseName = imageFile.name.replace(/\.[^.]+$/, '');
            const pdfBlob = pdf.output('blob');
            resolve({ blob: pdfBlob, filename: `${baseName}.pdf` });
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imgData;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  };

  const convertImage = async (imageFile: File, targetFormat: string): Promise<{ blob: Blob; filename: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgData = e.target?.result as string;
        if (!imgData) {
          reject(new Error('Failed to read image data'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to create canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0);

            const mimeType = targetFormat === 'jpg' || targetFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
            const quality = targetFormat === 'jpg' || targetFormat === 'jpeg' ? 0.92 : 1.0;

            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to convert image'));
                return;
              }
              const baseName = imageFile.name.replace(/\.[^.]+$/, '');
              const ext = targetFormat === 'jpg' || targetFormat === 'jpeg' ? 'jpg' : 'png';
              resolve({ blob, filename: `${baseName}.${ext}` });
            }, mimeType, quality);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imgData;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  };

  const compressImage = async (imageFile: File): Promise<{ blob: Blob; filename: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgData = e.target?.result as string;
        if (!imgData) {
          reject(new Error('Failed to read image data'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Failed to create canvas context'));
              return;
            }

            ctx.drawImage(img, 0, 0);

            const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
            const quality = 0.7;

            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const baseName = imageFile.name.replace(/\.[^.]+$/, '');
              const ext = imageFile.name.split('.').pop() || 'jpg';
              resolve({ blob, filename: `${baseName}-compressed.${ext}` });
            }, mimeType, quality);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imgData;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageFile);
    });
  };

  const updateFileProgress = (id: string, progress: number) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, progress } : f));
  };

  const updateFileStatus = (id: string, status: FileItem['status'], result?: { blob: Blob; filename: string }, error?: string) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status, result, error } : f));
  };

  const animateProgress = async (id: string, from: number, to: number, duration: number): Promise<void> => {
    const steps = 20;
    const increment = (to - from) / steps;
    const interval = duration / steps;
    let current = from;

    for (let i = 0; i < steps; i++) {
      current += increment;
      updateFileProgress(id, Math.round(current));
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    updateFileProgress(id, to);
  };

  const processFile = async (fileItem: FileItem) => {
    updateFileStatus(fileItem.id, 'converting');

    try {
      await animateProgress(fileItem.id, 0, 50, 300);

      let result: { blob: Blob; filename: string };

      if (toolId === 'jpg-to-pdf' && fileItem.file.type.startsWith('image/')) {
        result = await convertImageToPdf(fileItem.file);
      } else if (toolId === 'pdf-to-jpg' && fileItem.file.type === 'application/pdf') {
        throw new Error('PDF to JPG conversion is not yet implemented. Use JPG to PDF instead.');
      } else if (toolId === 'png-to-jpg' && fileItem.file.type.startsWith('image/')) {
        result = await convertImage(fileItem.file, 'jpg');
      } else if (toolId === 'word-to-pdf' && (fileItem.file.type === 'application/msword' || fileItem.file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
        throw new Error('Word to PDF conversion is not yet implemented. Use JPG to PDF instead.');
      } else if (toolId === 'pdf-compressor' && fileItem.file.type === 'application/pdf') {
        throw new Error('PDF compression is not yet implemented. Use JPG to PDF instead.');
      } else if (toolId === 'image-compressor' && fileItem.file.type.startsWith('image/')) {
        result = await compressImage(fileItem.file);
      } else {
        throw new Error(`Conversion from ${fileItem.file.type} is not supported for this tool.`);
      }

      await animateProgress(fileItem.id, 50, 100, 300);
      updateFileStatus(fileItem.id, 'done', result);
      return result;
    } catch (err: any) {
      updateFileStatus(fileItem.id, 'error', undefined, err?.message || 'Conversion failed');
      throw err;
    }
  };

  const convertAllFiles = async () => {
    if (files.length === 0) return;

    setState('converting');

    for (const fileItem of files) {
      if (fileItem.status === 'pending') {
        await processFile(fileItem);
      }
    }

    setState('done');
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
                  onClick={convertAllFiles}
                  disabled={files.length === 0}
                  className="w-full btn-primary py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                >
                  <FileCheck className="w-5 h-5" />
                  Convert All to {tool.to}
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
              <p className="text-white font-semibold text-xl mb-2">
                Converting files...
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
                      {fileItem.status === 'converting' && (
                        <span className="text-blue-400 text-xs font-medium">{fileItem.progress}%</span>
                      )}
                      {fileItem.status === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      )}
                      {fileItem.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                      )}
                    </div>
                    {fileItem.status === 'converting' && (
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${fileItem.progress}%` }}
                          transition={{ ease: 'easeOut', duration: 0.2 }}
                        />
                      </div>
                    )}
                    {fileItem.status === 'pending' && (
                      <p className="text-slate-600 text-xs">Waiting...</p>
                    )}
                    {fileItem.status === 'done' && fileItem.result && (
                      <p className="text-slate-500 text-xs">{fileItem.result.filename}</p>
                    )}
                    {fileItem.status === 'error' && fileItem.error && (
                      <p className="text-red-400 text-xs">{fileItem.error}</p>
                    )}
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
              <p className="text-slate-500 text-sm mb-2">
                {completedCount} of {files.length} files converted successfully
              </p>
              {hasErrors && (
                <p className="text-red-400 text-sm">
                  {files.filter(f => f.status === 'error').length} file(s) failed
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
                  <FileArchive className="w-4 w-4" />
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
