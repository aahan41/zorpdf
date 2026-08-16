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
  Palette,
  Wand2,
  SlidersHorizontal,
  Check,
} from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';
type EditorTab = 'background' | 'effects' | 'adjust';

/* Attractive studio portrait */
const DEMO_IMAGE = '/hero-image.png';

const BG_COLORS = [
  { label: 'Transparent', value: 'transparent' },
  { label: 'White', value: '#FFFFFF' },
  { label: 'Black', value: '#0F172A' },
  { label: 'Blue', value: '#2563EB' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Light gray', value: '#F1F5F9' },
  { label: 'Stone', value: '#78716C' },
];

// Loads @imgly/background-removal from a CDN at runtime instead of
// bundling it — its prebuilt WASM/worker files aren't compatible with
// Next 13's production minifier. Cached by the module scope so it's
// only fetched once per page session.
let imglyModulePromise: Promise<any> | null = null;
function loadImgly() {
  if (!imglyModulePromise) {
    // @ts-ignore -- CDN URL has no local type declarations
    imglyModulePromise = import(/* webpackIgnore: true */ 'https://esm.sh/@imgly/background-removal@1.7.0');
  }
  return imglyModulePromise;
}

export default function ZorRemoverPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [processState, setProcessState] =
    useState<ProcessState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // ============ Editor state (Background / Effects / Adjust) ============
  const [activeTab, setActiveTab] = useState<EditorTab>('background');
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [shadowOn, setShadowOn] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setProcessState('error');
      setErrorMessage('Please select a valid image file.');
      return;
    }
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setSelectedImage(url);
    setResultImage(null);
    setErrorMessage(null);
    setProcessState('idle');
    setBgColor('transparent');
    setShadowOn(false);
    setBrightness(100);
    setContrast(100);
    // Start fetching the AI model in the background right away so it's
    // hopefully already cached by the time the user hits "Remove Background".
    loadImgly()
      .then((mod) => mod.preload?.({ model: 'isnet_quint8', device: 'cpu' }))
      .catch(() => {});
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
    if (!selectedFile) return;
    setProcessState('processing');
    setErrorMessage(null);
    setProgressPct(0);
    setProgressLabel('Starting…');

    try {
      // Runs fully in the browser (no server, no API key, no cost).
      const imglyModule = await loadImgly();
      const imglyRemoveBackground = imglyModule.removeBackground;

      const resultBlob = await imglyRemoveBackground(selectedFile, {
        device: 'cpu',
        // Smaller/quantized model = faster first-time download + faster processing.
        model: 'isnet_quint8',
        progress: (key: string, current: number, total: number) => {
          if (total > 0) {
            setProgressPct(Math.round((current / total) * 100));
          }
          setProgressLabel(
            key.startsWith('fetch')
              ? 'Downloading AI model (first time only)…'
              : 'Removing background…'
          );
        },
      });

      const url = URL.createObjectURL(resultBlob);
      setResultImage(url);
      setProcessState('done');
    } catch (err) {
      console.error('Background removal failed:', err);
      setErrorMessage(
        'Background removal failed. Please try a different image or try again.'
      );
      setProcessState('error');
    } finally {
      setProgressPct(null);
      setProgressLabel('');
    }
  };

  const resetImage = () => {
    setSelectedFile(null);
    setSelectedImage(null);
    setResultImage(null);
    setErrorMessage(null);
    setProcessState('idle');
    setBgColor('transparent');
    setShadowOn(false);
    setBrightness(100);
    setContrast(100);
  };

  const handleDownload = async () => {
    if (!resultImage) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = resultImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Bake the chosen background color, brightness/contrast, and drop
      // shadow into the exported file so downloads match the preview.
      const padding = shadowOn ? Math.round(img.naturalWidth * 0.08) : 0;
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth + padding * 2;
      canvas.height = img.naturalHeight + padding * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      if (shadowOn) {
        ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
        ctx.shadowBlur = padding * 0.6;
        ctx.shadowOffsetY = padding * 0.35;
      }
      ctx.drawImage(img, padding, padding, img.naturalWidth, img.naturalHeight);

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Failed to export image');

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
                    <div className="relative flex max-h-[420px] min-h-[280px] items-center justify-center overflow-hidden rounded-2xl bg-slate-100">
                      <img
                        src={selectedImage}
                        alt="Selected image"
                        className="block max-h-[420px] w-full object-contain"
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
                            {progressLabel || 'Removing Background...'}
                            {progressPct !== null ? ` ${progressPct}%` : ''}
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Remove Background
                          </>
                        )}
                      </button>
                    )}
                    {processState === 'processing' && (
                      <p className="mt-2 text-center text-xs text-slate-400">
                        First removal on this device downloads a small AI
                        model — it's cached after that and future images are
                        much faster.
                      </p>
                    )}

                    {/* ================= ERROR ================= */}
                    {processState === 'error' && errorMessage && (
                      <p className="mt-3 text-center text-sm font-medium text-red-600">
                        {errorMessage}
                      </p>
                    )}

                    {/* ================= RESULT + EDITOR ================= */}
                    {processState === 'done' && resultImage && (
                      <div className="mt-5">
                        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          Background Removed
                        </div>

                        {/* Preview */}
                        <div
                          className="relative flex max-h-[420px] min-h-[280px] items-center justify-center overflow-hidden rounded-2xl"
                          style={
                            bgColor === 'transparent'
                              ? {
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
                                }
                              : { backgroundColor: bgColor }
                          }
                        >
                          <img
                            src={resultImage}
                            alt="Background removed result"
                            className="block max-h-[420px] w-full object-contain p-4"
                            style={{
                              filter: `brightness(${brightness}%) contrast(${contrast}%)${
                                shadowOn
                                  ? ' drop-shadow(0 18px 20px rgba(15,23,42,0.35))'
                                  : ''
                              }`,
                            }}
                          />
                        </div>

                        {/* Editor tabs */}
                        <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1">
                          {(
                            [
                              { id: 'background', label: 'Background', icon: Palette },
                              { id: 'effects', label: 'Effects', icon: Wand2 },
                              { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
                            ] as const
                          ).map((tab) => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setActiveTab(tab.id)}
                              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                                activeTab === tab.id
                                  ? 'bg-white text-blue-600 shadow-sm'
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              <tab.icon className="h-3.5 w-3.5" />
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Tab panels */}
                        <div className="mt-4 rounded-xl border border-slate-200 p-4">
                          {activeTab === 'background' && (
                            <div>
                              <p className="mb-3 text-xs font-medium text-slate-500">
                                Choose a background color, or keep it
                                transparent.
                              </p>
                              <div className="grid grid-cols-6 gap-2">
                                {BG_COLORS.map((c) => (
                                  <button
                                    key={c.value}
                                    type="button"
                                    title={c.label}
                                    onClick={() => setBgColor(c.value)}
                                    className={`relative aspect-square rounded-lg border-2 transition ${
                                      bgColor === c.value
                                        ? 'border-blue-600'
                                        : 'border-slate-200 hover:border-slate-300'
                                    }`}
                                    style={
                                      c.value === 'transparent'
                                        ? {
                                            backgroundImage: `
                                              linear-gradient(45deg, #cbd5e1 25%, transparent 25%),
                                              linear-gradient(-45deg, #cbd5e1 25%, transparent 25%),
                                              linear-gradient(45deg, transparent 75%, #cbd5e1 75%),
                                              linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)
                                            `,
                                            backgroundSize: '10px 10px',
                                            backgroundPosition:
                                              '0 0, 0 5px, 5px -5px, -5px 0px',
                                            backgroundColor: '#fff',
                                          }
                                        : { backgroundColor: c.value }
                                    }
                                  >
                                    {bgColor === c.value && (
                                      <Check
                                        className={`absolute inset-0 m-auto h-4 w-4 ${
                                          ['#FFFFFF', '#F1F5F9', 'transparent'].includes(
                                            c.value
                                          )
                                            ? 'text-slate-700'
                                            : 'text-white'
                                        }`}
                                      />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {activeTab === 'effects' && (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  Drop shadow
                                </p>
                                <p className="text-xs text-slate-500">
                                  Adds a soft shadow beneath the subject.
                                </p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={shadowOn}
                                onClick={() => setShadowOn((v) => !v)}
                                className={`relative h-6 w-11 flex-none rounded-full transition ${
                                  shadowOn ? 'bg-blue-600' : 'bg-slate-200'
                                }`}
                              >
                                <span
                                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                                    shadowOn ? 'left-5' : 'left-0.5'
                                  }`}
                                />
                              </button>
                            </div>
                          )}

                          {activeTab === 'adjust' && (
                            <div className="space-y-4">
                              <div>
                                <div className="mb-1.5 flex justify-between text-xs font-medium">
                                  <span className="text-slate-700">Brightness</span>
                                  <span className="text-slate-400">{brightness}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={50}
                                  max={150}
                                  value={brightness}
                                  onChange={(e) => setBrightness(Number(e.target.value))}
                                  className="w-full accent-blue-600"
                                />
                              </div>
                              <div>
                                <div className="mb-1.5 flex justify-between text-xs font-medium">
                                  <span className="text-slate-700">Contrast</span>
                                  <span className="text-slate-400">{contrast}%</span>
                                </div>
                                <input
                                  type="range"
                                  min={50}
                                  max={150}
                                  value={contrast}
                                  onChange={(e) => setContrast(Number(e.target.value))}
                                  className="w-full accent-blue-600"
                                />
                              </div>
                            </div>
                          )}
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
