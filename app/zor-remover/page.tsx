'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Crown, Sparkles, CheckCircle2,
  Loader2, Download, Wand2, Image as ImageIcon, Zap, Lock
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';

interface UploadedImage {
  file: File;
  originalUrl: string;
  resultUrl?: string;
  resultBlob?: Blob;
}

const HERO_IMAGE = 'https://images.pexels.com/photos/36965736/pexels-photo-36965736.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const FREE_LIMIT = 5;

function useUsageCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zor-usage');
      if (stored) setCount(parseInt(stored, 10) || 0);
    } catch {}
  }, []);
  const increment = useCallback(() => {
    setCount(prev => {
      const next = prev + 1;
      try { localStorage.setItem('zor-usage', String(next)); } catch {}
      return next;
    });
  }, []);
  return { count, increment };
}

export default function ZorRemoverPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [state, setState] = useState<ProcessState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [image, setImage] = useState<UploadedImage | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { count: usageCount, increment: incrementUsage } = useUsageCount();

  const limitReached = usageCount >= FREE_LIMIT;

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
    if (!image || limitReached) return;
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
      incrementUsage();
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

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Two-column hero layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-16">
            {/* LEFT SIDE: Image + Heading + Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col"
            >
              {/* Hero image */}
              <div className="relative rounded-3xl overflow-hidden shadow-lg mb-8 aspect-[4/3]">
                <img
                  src={HERO_IMAGE}
                  alt="Background removal example"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
              </div>

              {/* Premium crown badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-4 self-start">
                <Crown className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 text-xs font-semibold">Premium Tool</span>
              </div>

              {/* Heading */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                Remove Image Background
              </h1>

              {/* Badge row */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-600 text-base">100% Automatically and</span>
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold">
                  Free
                </span>
              </div>
            </motion.div>

            {/* RIGHT SIDE: Upload card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 sm:p-10">
                <AnimatePresence mode="wait">
                  {/* Upload state */}
                  {state === 'idle' && !image && (
                    <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <div
                        onDrop={handleDrop}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onClick={() => !limitReached && fileInputRef.current?.click()}
                        className={`relative rounded-2xl border-2 border-dashed transition-all duration-300 ${
                          limitReached ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isDragging ? 'border-blue-500 bg-blue-50 scale-[1.01]' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
                          {limitReached ? (
                            <>
                              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-5">
                                <Lock className="w-6 h-6 text-amber-600" />
                              </div>
                              <p className="text-slate-900 text-lg font-semibold mb-2">Free limit reached</p>
                              <p className="text-slate-500 text-sm mb-5">You've used all {FREE_LIMIT} free removals. Upgrade to Premium for unlimited use.</p>
                              <Link
                                href="/signup"
                                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-all flex items-center gap-2"
                              >
                                <Crown className="w-4 h-4" />
                                Upgrade to Premium
                              </Link>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold shadow-md shadow-blue-200 transition-all mb-4"
                              >
                                Upload Image
                              </button>
                              <p className="text-slate-500 text-sm mb-1">or drop a file,</p>
                              <p className="text-slate-400 text-sm">
                                paste image or{' '}
                                <span className="text-blue-600 underline cursor-pointer">URL</span>
                              </p>
                              <p className="text-slate-400 text-xs mt-4">
                                {FREE_LIMIT - usageCount} of {FREE_LIMIT} free removals remaining
                              </p>
                            </>
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
                        <div className="relative w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 mb-6 bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23f8fafc%22/><rect width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/><rect x=%2220%22 y=%2220%22 width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/></svg>')]">
                          <img src={image.originalUrl} alt="Original" className="w-full h-auto" />
                        </div>
                        <button
                          onClick={removeBackground}
                          disabled={limitReached}
                          className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-base font-bold text-white shadow-md shadow-blue-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
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
                          className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-all"
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
                        <button onClick={reset} className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white transition-all">
                          Try Again
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, title: 'Instant Results', desc: 'AI removes backgrounds in seconds' },
              { icon: Sparkles, title: 'Clean Cutouts', desc: 'Smooth edges, no manual editing' },
              { icon: ImageIcon, title: 'Transparent PNG', desc: 'Download as ready-to-use PNG' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl p-5 text-center bg-white border border-slate-100 shadow-sm">
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
