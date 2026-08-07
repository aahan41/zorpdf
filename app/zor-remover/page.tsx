'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Crown, Lock, Sparkles, CheckCircle2,
  Loader2, Download, Wand2, Image as ImageIcon, Zap
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';
import { useAuth } from '@/lib/authContext';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';

interface UploadedImage {
  file: File;
  originalUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
}

export default function ZorRemoverPage() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<ProcessState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [image, setImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLocked = !user || !isPremium;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG or JPG)');
      setState('error');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Image must be under 20MB');
      setState('error');
      return;
    }

    const url = URL.createObjectURL(file);
    setImage({ file, originalUrl: url });
    setState('idle');
    setError('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) handleFile(e.target.files[0]);
  };

  const removeBackground = async () => {
    if (!image || isLocked) return;
    setState('processing');
    setProgress(0);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 90));
    }, 200);

    try {
      const formData = new FormData();
      formData.append('image', image.file);

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to remove background');
      }

      const blob = await response.blob();
      const resultUrl = URL.createObjectURL(blob);

      clearInterval(interval);
      setProgress(100);
      setImage(prev => prev ? { ...prev, resultUrl, resultBlob: blob } : null);
      setState('done');
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'Background removal failed');
      setState('error');
    }
  };

  const downloadResult = () => {
    if (!image?.resultBlob) return;
    const url = URL.createObjectURL(image.resultBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = image.file.name.replace(/\.[^.]+$/, '') + '-no-bg.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    if (image?.originalUrl) URL.revokeObjectURL(image.originalUrl);
    if (image?.resultUrl) URL.revokeObjectURL(image.resultUrl);
    setImage(null);
    setState('idle');
    setProgress(0);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-20 pb-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-200 mb-6">
              <Crown className="w-4 h-4 text-amber-600" />
              <span className="text-amber-700 text-sm font-medium">Premium Tool</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              Remove Image Backgrounds
              <br />
              <span className="text-gradient">in Seconds</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Upload an image and our AI removes the background instantly. Get a clean, transparent PNG — no manual editing required.
            </p>
          </div>

          {/* Locked state */}
          {isLocked && (
            <div className="mb-6 p-5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm">Zor Remover is a premium feature</p>
                  <p className="text-slate-500 text-xs">
                    {!user ? 'Sign in and upgrade to remove backgrounds.' : 'Upgrade to Premium to unlock background removal.'}
                  </p>
                </div>
              </div>
              <Link
                href={!user ? "/signup" : "/"}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                {!user ? 'Sign up to unlock' : 'Upgrade now'}
              </Link>
            </div>
          )}

          {/* Main card */}
          <div className="glass-card rounded-3xl overflow-hidden">
            <div className="p-6 sm:p-10">
              <AnimatePresence mode="wait">
                {/* Upload state */}
                {state === 'idle' && !image && (
                  <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onClick={() => !isLocked && fileInputRef.current?.click()}
                      className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                        <div className={`w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5 transition-transform ${isDragging ? 'scale-110' : ''}`}>
                          {isLocked ? <Lock className="w-9 h-9 text-slate-400" /> : <Upload className={`w-9 h-9 ${isDragging ? 'text-blue-600' : 'text-blue-500'}`} />}
                        </div>
                        <p className="text-slate-900 text-lg font-semibold mb-2">
                          {isLocked ? 'Premium feature locked' : isDragging ? 'Drop your image here' : 'Upload an image'}
                        </p>
                        <p className="text-slate-500 text-sm mb-5">
                          {isLocked ? 'Upgrade to upload and remove backgrounds' : 'PNG or JPG, up to 20MB'}
                        </p>
                        {!isLocked && (
                          <button
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm"
                          >
                            Choose Image
                          </button>
                        )}
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleInputChange} />
                    </div>
                  </motion.div>
                )}

                {/* Image preview + remove button */}
                {image && state === 'idle' && (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col items-center">
                      <div className="relative w-full max-w-md rounded-2xl overflow-hidden border border-slate-200 mb-6 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23f8fafc%22/><rect width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/><rect x=%2220%22 y=%2220%22 width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/></svg>')]">
                        <img src={image.originalUrl} alt="Original" className="w-full h-auto" />
                      </div>
                      <button
                        onClick={removeBackground}
                        disabled={isLocked}
                        className="btn-primary px-8 py-4 rounded-2xl text-base font-bold text-white shadow-md shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Wand2 className="w-5 h-5" />
                        Remove Background
                      </button>
                      <button onClick={reset} className="mt-3 text-slate-400 hover:text-slate-600 text-sm transition-colors flex items-center gap-1.5">
                        <X className="w-4 h-4" /> Choose different image
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Processing */}
                {state === 'processing' && (
                  <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 relative">
                        <Wand2 className="w-9 h-9 text-blue-600" />
                        <div className="absolute inset-0 rounded-2xl border-2 border-blue-200 border-t-blue-600 animate-spin" style={{ clipPath: 'inset(0 round 1rem)' }} />
                      </div>
                      <p className="text-slate-900 font-semibold text-lg mb-2">Removing background...</p>
                      <p className="text-slate-500 text-sm mb-6">Our AI is working its magic</p>
                      <div className="w-full max-w-xs bg-slate-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                          animate={{ width: `${progress}%` }}
                          transition={{ ease: 'easeOut', duration: 0.3 }}
                        />
                      </div>
                      <p className="text-blue-600 text-sm font-medium mt-2">{Math.round(progress)}%</p>
                    </div>
                  </motion.div>
                )}

                {/* Done */}
                {state === 'done' && image && (
                  <motion.div key="done" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-14 h-14 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mb-4 mx-auto"
                      >
                        <CheckCircle2 className="w-7 h-7 text-green-600" />
                      </motion.div>
                      <h3 className="text-slate-900 font-bold text-xl mb-1">Background Removed!</h3>
                      <p className="text-slate-500 text-sm">Your image is ready to download</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                      <div>
                        <p className="text-slate-500 text-xs font-medium mb-2 text-center">Original</p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50">
                          <img src={image.originalUrl} alt="Original" className="w-full h-auto" />
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs font-medium mb-2 text-center">Result</p>
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23f8fafc%22/><rect width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/><rect x=%2220%22 y=%2220%22 width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/></svg>')]">
                          <img src={image.resultUrl} alt="Result" className="w-full h-auto" />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={downloadResult}
                        className="btn-primary px-8 py-3.5 rounded-xl text-sm font-bold text-white shadow-md shadow-blue-200 flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PNG
                      </button>
                      <button
                        onClick={reset}
                        className="px-6 py-3.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center gap-2 transition-all"
                      >
                        <Upload className="w-4 h-4" />
                        Remove Another
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Error */}
                {state === 'error' && (
                  <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-12">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-red-100 border border-red-200 flex items-center justify-center mb-4">
                        <X className="w-7 h-7 text-red-500" />
                      </div>
                      <p className="text-slate-900 font-semibold text-lg mb-1">Something went wrong</p>
                      <p className="text-slate-500 text-sm mb-6">{error}</p>
                      <button onClick={reset} className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white">
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            {[
              { icon: Zap, title: 'Instant Results', desc: 'AI removes backgrounds in seconds' },
              { icon: Sparkles, title: 'Clean Cutouts', desc: 'Smooth edges, no manual editing' },
              { icon: ImageIcon, title: 'Transparent PNG', desc: 'Download as ready-to-use PNG' },
            ].map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-5 text-center">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-3 mx-auto">
                  <f.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-slate-900 font-semibold text-sm mb-1">{f.title}</h4>
                <p className="text-slate-500 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
