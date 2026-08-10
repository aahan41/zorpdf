'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  Loader2,
  Download,
  Image as ImageIcon,
  Zap,
} from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';

/* Attractive studio portrait */
const DEMO_IMAGE =
  'https://images.pexels.com/photos/33261955/pexels-photo-33261955.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function ZorRemoverPage() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processState, setProcessState] =
    useState<ProcessState>('idle');
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setProcessState('error');
      return;
    }
    const url = URL.createObjectURL(file);
    setSelectedImage(url);
    setResultImage(null);
    setProcessState('idle');
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const removeBackground = async () => {
    if (!selectedImage) return;
    setProcessState('processing');
    /*
      Demo processing.
      Yahan baad mein real background-removal API connect
      ki ja sakti hai.
    */
    setTimeout(() => {
      setResultImage(selectedImage);
      setProcessState('done');
    }, 1200);
  };

  const resetImage = () => {
    setSelectedImage(null);
    setResultImage(null);
    setProcessState('idle');
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      // Fetch the blob so the download works reliably
      // (a plain <a download> can fail to trigger for blob: URLs in some browsers)
      const response = await fetch(resultImage);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'background-removed.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* ================= HERO ================= */}
        <section className="py-10 sm:py-14">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            {/* ================= SINGLE DEMO PHOTO ================= */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                {/* Photo frame */}
                <div className="group relative overflow-hidden rounded-[28px] bg-slate-100 shadow-xl">
                  <img
                    src={DEMO_IMAGE}
                    alt="Zor Remover"
                    className="block aspect-[4/3] w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
                  />
                  {/* Soft image overlay */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                  {/* Premium badge */}
                  <div className="absolute left-5 top-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-lg backdrop-blur-md">
                      <Crown className="h-3.5 w-3.5" />
                      Premium Tool
                    </span>
                  </div>
                  {/* Bottom badge */}
                  <div className="absolute bottom-5 left-5">
                    <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                      <Sparkles className="h-3.5 w-3.5 text-white" />
                      AI Background Remover
                    </span>
                  </div>
                </div>
                {/* Small decorative shadow */}
                <div className="absolute -bottom-3 left-8 right-8 -z-10 h-8 rounded-full bg-slate-200/60 blur-xl" />
              </div>
              {/* Heading */}
              <div className="mt-7">
                <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                  Remove Image
                  <br />
                  Background
                </h1>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-base text-slate-600">
                  100% Automatically and
                  <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                    Free
                  </span>
                </p>
              </div>
            </motion.div>

            {/* ================= UPLOAD BOX ================= */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                className={`rounded-[28px] border bg-white p-6 shadow-xl transition-all sm:p-8 ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200'
                }`}
              >
                {!selectedImage ? (
                  /* ================= EMPTY UPLOAD ================= */
                  <label className="flex min-h-[330px] cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-slate-300 bg-slate-50/60 px-5 text-center transition-all hover:border-blue-400 hover:bg-blue-50/30">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUpload}
                      className="hidden"
                    />
                    <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <Upload className="h-7 w-7" />
                    </div>
                    <span className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700">
                      Upload Image
                    </span>
                    <p className="mt-5 text-sm text-slate-500">
                      or drop a file
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      paste image or{' '}
                      <span className="text-blue-600 underline">
                        URL
                      </span>
                    </p>
                    <p className="mt-6 text-xs text-slate-400">
                      5 of 5 free removals remaining
                    </p>
                  </label>
                ) : (
                  /* ================= SELECTED IMAGE ================= */
                  <div>
                    <div className="relative overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={selectedImage}
                        alt="Selected image"
                        className="block aspect-[4/3] w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={resetImage}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Remove button */}
                    {processState !== 'done' && (
                      <button
                        type="button"
                        onClick={removeBackground}
                        disabled={processState === 'processing'}
                        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {processState === 'processing' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Removing Background...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Remove Background
                          </>
                        )}
                      </button>
                    )}
                    {/* ================= RESULT ================= */}
                    {processState === 'done' && resultImage && (
                      <div className="mt-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Background Removed
                        </div>
                        <div
                          className="relative overflow-hidden rounded-2xl"
                          style={{
                            backgroundColor: '#f8fafc',
                            backgroundImage: `
                              linear-gradient(45deg, #dbe2ea 25%, transparent 25%),
                              linear-gradient(-45deg, #dbe2ea 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #dbe2ea 75%),
                              linear-gradient(-45deg, transparent 75%, #dbe2ea 75%)
                            `,
                            backgroundSize: '28px 28px',
                            backgroundPosition:
                              '0 0, 0 14px, 14px -14px, -14px 0px',
                          }}
                        >
                          <img
                            src={resultImage}
                            alt="Background removed result"
                            className="block aspect-[4/3] w-full object-contain"
                            style={{
                              mixBlendMode: 'multiply',
                            }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Download className="h-4 w-4" />
                          Download HD
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ================= FEATURES ================= */}
        <section className="pb-14">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">
                Automatic
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                AI automatically detects the subject.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <ImageIcon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">
                Clean Result
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Keep your subject clean and sharp.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900">
                Fast & Free
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Get your result quickly with free removals.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
