'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileCheck, Download, X, AlertCircle,
  RotateCcw, CheckCircle2, File, Link, Loader2
} from 'lucide-react';
import type { Tool } from './ToolsGrid';

type ConversionState = 'idle' | 'selected' | 'uploading' | 'converting' | 'done' | 'error';
type InputMode = 'file' | 'url';

interface UploadSectionProps {
  selectedTool: Tool | null;
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const STATUS_MESSAGES: Record<string, string> = {
  uploading: 'Uploading your file...',
  converting: 'Converting file...',
  done: 'Conversion complete!',
  error: 'Conversion failed. Please try again.',
};

export default function UploadSection({ selectedTool }: UploadSectionProps) {
  const [state, setState] = useState<ConversionState>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('file');
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [outputSize, setOutputSize] = useState<number | null>(null);
  const [conversionResult, setConversionResult] = useState<{ blob: Blob; filename: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeTool = selectedTool;

  const handleFile = (f: File) => {
    if (!f) return;
    const maxSize = 50 * 1024 * 1024;
    if (f.size > maxSize) {
      setErrorMsg('File size exceeds 50MB limit.');
      setState('error');
      return;
    }
    setFile(f);
    setState('selected');
    setErrorMsg('');
    setProgress(0);
    setOutputSize(null);
    setConversionResult(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const fetchFileFromUrl = async (fileUrl: string): Promise<File> => {
    const response = await fetch(fileUrl);
    if (!response.ok) throw new Error('Failed to fetch file from URL');

    const blob = await response.blob();
    const contentLength = response.headers.get('content-length');
    const size = contentLength ? parseInt(contentLength, 10) : blob.size;

    if (size > 50 * 1024 * 1024) {
      throw new Error('File size exceeds 50MB limit.');
    }

    const urlPath = new URL(fileUrl).pathname;
    const filename = urlPath.split('/').pop() || 'downloaded-file';

    const file = new window.File([blob], filename, { type: blob.type || 'image/jpeg' });
    return file;
  };

  const animateProgress = (from: number, to: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const steps = 30;
      const increment = (to - from) / steps;
      const interval = duration / steps;
      let current = from;
      const timer = setInterval(() => {
        current += increment;
        if (current >= to) {
          setProgress(to);
          clearInterval(timer);
          resolve();
        } else {
          setProgress(Math.round(current));
        }
      }, interval);
    });
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

  const runConversion = async () => {
    if (!activeTool) return;

    setState('uploading');
    setProgress(0);
    setErrorMsg('');
    setOutputSize(null);
    setConversionResult(null);

    try {
      let fileToConvert: File;

      if (inputMode === 'url') {
        if (!url.trim()) {
          throw new Error('Please enter a valid URL.');
        }
        await animateProgress(0, 30, 600);
        fileToConvert = await fetchFileFromUrl(url.trim());
        await animateProgress(30, 50, 400);
      } else {
        if (!file) {
          throw new Error('Please select a file.');
        }
        await animateProgress(0, 50, 800);
        fileToConvert = file;
      }

      setState('converting');
      await animateProgress(50, 70, 600);

      let result: { blob: Blob; filename: string };

      if (activeTool.to.toLowerCase() === 'pdf' && fileToConvert.type.startsWith('image/')) {
        result = await convertImageToPdf(fileToConvert);
      } else {
        throw new Error(`Conversion from ${fileToConvert.type} to ${activeTool.to} is not supported.`);
      }

      await animateProgress(70, 100, 400);
      setConversionResult(result);
      setOutputSize(result.blob.size);
      setState('done');
    } catch (err: any) {
      console.error('Conversion error:', err);
      setErrorMsg(err?.message || 'An error occurred during conversion.');
      setState('error');
    }
  };

  const handleDownload = () => {
    if (!conversionResult) return;

    const downloadUrl = URL.createObjectURL(conversionResult.blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = conversionResult.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const reset = () => {
    setState('idle');
    setFile(null);
    setUrl('');
    setProgress(0);
    setErrorMsg('');
    setOutputSize(null);
    setConversionResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isProcessing = state === 'uploading' || state === 'converting';
  const accept = activeTool?.accept ?? '*/*';

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
              ? `Convert your ${activeTool.from} file to ${activeTool.to} instantly.`
              : 'Choose a conversion tool above, then upload your file.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card rounded-3xl p-6 sm:p-8"
        >
          <AnimatePresence mode="wait">
            {(state === 'idle' || state === 'selected') && (
              <motion.div
                key="drop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Input Mode Tabs */}
                <div className="flex gap-2 mb-6">
                  <button
                    onClick={() => { setInputMode('file'); reset(); }}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      inputMode === 'file'
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-white border border-transparent'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    Upload File
                  </button>
                  <button
                    onClick={() => { setInputMode('url'); reset(); }}
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

                {/* File Upload Mode */}
                {inputMode === 'file' && (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => state === 'idle' && fileInputRef.current?.click()}
                    className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                      ${isDragging
                        ? 'border-blue-400 bg-blue-600/10 scale-[1.01]'
                        : state === 'selected'
                          ? 'border-blue-500/50 bg-blue-900/10'
                          : 'border-white/15 hover:border-blue-500/50 hover:bg-blue-900/5'
                      }`}
                  >
                    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                      {state === 'selected' && file ? (
                        <>
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
                            <File className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-white font-semibold text-lg mb-1">{file.name}</p>
                          <p className="text-slate-400 text-sm">{formatBytes(file.size)}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); reset(); }}
                            className="mt-4 text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1.5 text-sm"
                          >
                            <X className="w-4 h-4" />
                            Remove file
                          </button>
                        </>
                      ) : (
                        <>
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/20 flex items-center justify-center mb-5 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                            <Upload className={`w-9 h-9 transition-colors ${isDragging ? 'text-blue-400' : 'text-blue-500/70'}`} />
                          </div>
                          <p className="text-white text-lg font-semibold mb-2">
                            {isDragging ? 'Drop your file here' : 'Drag & drop your file here'}
                          </p>
                          <p className="text-slate-500 text-sm mb-5">or click to browse</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-lg shadow-blue-900/30"
                          >
                            Choose File
                          </button>
                          {activeTool && (
                            <p className="text-slate-600 text-xs mt-4">
                              Supported: {activeTool.accept.split(',').join(', ')} &bull; Max 50MB
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={accept}
                      className="hidden"
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {/* URL Input Mode */}
                {inputMode === 'url' && (
                  <div className="space-y-4">
                    <div className="relative">
                      <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => {
                          setUrl(e.target.value);
                          if (e.target.value.trim()) {
                            setState('selected');
                          } else {
                            setState('idle');
                          }
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-800/50 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                    {activeTool && (
                      <p className="text-slate-500 text-sm text-center">
                        Enter a direct link to an image file (JPG, PNG, etc.). Max 50MB.
                      </p>
                    )}
                    {url && (
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-blue-900/10 border border-blue-500/20">
                        <File className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-slate-300 truncate flex-1">
                          {url.split('/').pop() || 'Remote file'}
                        </span>
                        <button
                          onClick={() => { setUrl(''); setState('idle'); }}
                          className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Convert button */}
                {state === 'selected' && (inputMode === 'file' ? file : url) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6"
                  >
                    <button
                      onClick={runConversion}
                      disabled={!activeTool}
                      className="w-full btn-primary py-4 rounded-2xl text-base font-bold text-white shadow-xl shadow-blue-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                      <FileCheck className="w-5 h-5" />
                      {activeTool ? `Convert to ${activeTool.to}` : 'Select a tool above first'}
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {isProcessing && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 flex flex-col items-center"
              >
                <div className="relative w-20 h-20 mb-8">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-900/30" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                  <div className="absolute inset-2 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <span className="text-blue-400 font-bold text-sm">{progress}%</span>
                  </div>
                </div>

                <p className="text-white font-semibold text-xl mb-2">
                  {STATUS_MESSAGES[state]}
                </p>
                <p className="text-slate-500 text-sm mb-8">
                  {state === 'uploading'
                    ? (inputMode === 'url' ? 'Fetching file from URL...' : 'Preparing your file...')
                    : 'Applying conversion...'}
                </p>

                <div className="w-full max-w-sm bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className="h-full progress-bar rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
                <p className="text-slate-600 text-xs mt-3">
                  {inputMode === 'url' ? url : (file?.name)} &bull; {file ? formatBytes(file.size) : 'Fetching...'}
                </p>
              </motion.div>
            )}

            {state === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 flex flex-col items-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-700/20 border border-green-500/30 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </motion.div>

                <h3 className="text-white font-bold text-2xl mb-2">Conversion Complete!</h3>
                <p className="text-slate-400 text-sm mb-2">{conversionResult?.filename}</p>
                <p className="text-slate-500 text-xs mb-8">
                  Original: {file ? formatBytes(file.size) : 'URL'} {'->'} Converted: {outputSize ? formatBytes(outputSize) : ''}
                </p>

                <div className="w-full max-w-sm bg-slate-800 rounded-full h-2 mb-8">
                  <div className="h-full w-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                  <button
                    onClick={handleDownload}
                    className="flex-1 btn-primary py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download {activeTool?.to}
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white glass border-glow flex items-center justify-center gap-2 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Convert Another
                  </button>
                </div>
              </motion.div>
            )}

            {state === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-10 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                </div>
                <h3 className="text-white font-bold text-xl mb-2">Something went wrong</h3>
                <p className="text-red-400 text-sm mb-8">{errorMsg || 'An error occurred during conversion.'}</p>
                <button
                  onClick={reset}
                  className="btn-primary px-8 py-3.5 rounded-2xl text-sm font-bold text-white flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
