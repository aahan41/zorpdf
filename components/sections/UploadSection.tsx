'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileCheck, Download, X, AlertCircle,
  RotateCcw, CheckCircle2, File, Link, Loader2,
  Package, FileArchive, Trash2
} from 'lucide-react';
import type { Tool } from './ToolsGrid';

type ConversionState = 'idle' | 'selected' | 'uploading' | 'converting' | 'done' | 'error';
type InputMode = 'file' | 'url';

interface UploadSectionProps {
  selectedTool: Tool | null;
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

const STATUS_MESSAGES: Record<string, string> = {
  uploading: 'Uploading your files...',
  converting: 'Converting files...',
  done: 'All conversions complete!',
  error: 'Some conversions failed.',
};

export default function UploadSection({ selectedTool }: UploadSectionProps) {
  const [state, setState] = useState<ConversionState>('idle');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTool = selectedTool;

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
    setUrl('');
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
    if (!activeTool) return;

    updateFileStatus(fileItem.id, 'converting');

    try {
      await animateProgress(fileItem.id, 0, 50, 300);

      let result: { blob: Blob; filename: string };

      if (activeTool.to.toLowerCase() === 'pdf' && fileItem.file.type.startsWith('image/')) {
        result = await convertImageToPdf(fileItem.file);
      } else {
        throw new Error(`Conversion from ${fileItem.file.type} to ${activeTool.to} is not supported.`);
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
    if (!activeTool || files.length === 0) return;

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

    // Dynamically import JSZip
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
    <section id="upload" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-glow mb-5">
            <span className="text-blue-400 text-sm font-medium">
              {activeTool ? `Converting: ${activeTool.title}` : 'Upload & Convert'}
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            {activeTool ? activeTool.title : 'Select a Tool & Upload'}
          </h2>
          <p className="text-slate-400 text-lg">
            {activeTool
              ? `Convert your ${activeTool.from} files to ${activeTool.to} instantly. Upload multiple files at once.`
              : 'Choose a conversion tool above, then upload your files.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-3xl p-6 sm:p-8"
        >
          {/* Input Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => { setInputMode('file'); clearAllFiles(); }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'file'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <button
              onClick={() => { setInputMode('url'); clearAllFiles(); }}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                inputMode === 'url'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Link className="w-4 h-4" />
              From URL
            </button>
          </div>

          {/* File Upload Area */}
          {inputMode === 'file' && (
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
                      {activeTool && (
                        <p className="text-slate-600 text-xs mt-4">
                          Supported: {activeTool.accept.split(',').join(', ')} | Max 50MB per file
                        </p>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={activeTool?.accept ?? '*/*'}
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
                        disabled={!activeTool || files.length === 0}
                        className="w-full btn-primary py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-6"
                      >
                        <FileCheck className="w-5 h-5" />
                        {activeTool ? `Convert All to ${activeTool.to}` : 'Select a tool above first'}
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
                        <FileArchive className="w-4 h-4" />
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
          )}

          {/* URL Input Mode */}
          {inputMode === 'url' && (
            <div className="space-y-4">
              <div className="relative">
                <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
              {activeTool && (
                <p className="text-slate-500 text-sm text-center">
                  Enter a direct link to an image file (JPG, PNG, etc.). Max 50MB.
                </p>
              )}
              <button
                disabled={!activeTool || !url.trim()}
                className="w-full btn-primary py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <FileCheck className="w-5 h-5" />
                {activeTool ? `Convert to ${activeTool.to}` : 'Select a tool above first'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
