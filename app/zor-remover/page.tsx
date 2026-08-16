'use client';

import { useState, useCallback, useRef } from 'react';
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
  LayoutTemplate,
  Check,
  Undo2,
  Redo2,
  ChevronDown,
  Plus,
  ArrowLeft,
  Scissors,
} from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';
type EditorTab = 'cutout' | 'background' | 'effects' | 'adjust' | 'design';

type EditState = {
  bgColor: string;
  shadowOn: boolean;
  brightness: number;
  contrast: number;
};

type RecentItem = {
  id: string;
  input: string;
  output: string;
};

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

const DEFAULT_EDIT: EditState = {
  bgColor: 'transparent',
  shadowOn: false,
  brightness: 100,
  contrast: 100,
};

const CHECKERBOARD_STYLE = {
  backgroundColor: '#f8fafc',
  backgroundImage: `
    linear-gradient(45deg, #dbe2ea 25%, transparent 25%),
    linear-gradient(-45deg, #dbe2ea 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #dbe2ea 75%),
    linear-gradient(-45deg, transparent 75%, #dbe2ea 75%)
  `,
  backgroundSize: '28px 28px',
  backgroundPosition: '0 0, 0 14px, 14px -14px, -14px 0px',
} as const;

type DesignTemplate = {
  id: string;
  label: string;
  sub: string;
  width: number;
  height: number;
};

// Real standard photo/print sizes, rendered at ~300 DPI.
const DESIGN_TEMPLATES: DesignTemplate[] = [
  { id: 'passport', label: 'Passport', sub: '2 × 2 in', width: 600, height: 600 },
  { id: 'id-card', label: 'ID Card', sub: '35 × 45 mm', width: 413, height: 531 },
  { id: 'poster', label: 'Poster', sub: 'A4', width: 1240, height: 1754 },
  { id: 'social', label: 'Social Post', sub: '1080 × 1080', width: 1080, height: 1080 },
];

// Loads @imgly/background-removal from a CDN at runtime instead of
// bundling it — its prebuilt WASM/worker files aren't compatible with
// Next 13's production minifier. Cached at module scope so it's only
// fetched once per page session.
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
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState<number | null>(null);
  const [progressLabel, setProgressLabel] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);

  // ============ Editor state ============
  const [activeTab, setActiveTab] = useState<EditorTab>('cutout');
  const [bgColor, setBgColor] = useState<string>('transparent');
  const [shadowOn, setShadowOn] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [designTemplate, setDesignTemplate] = useState<DesignTemplate | null>(null);

  // ============ Undo / redo ============
  const [history, setHistory] = useState<EditState[]>([]);
  const [future, setFuture] = useState<EditState[]>([]);

  // ============ Recent images this session ============
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const snapshot = (): EditState => ({ bgColor, shadowOn, brightness, contrast });
  const applyEditState = (s: EditState) => {
    setBgColor(s.bgColor);
    setShadowOn(s.shadowOn);
    setBrightness(s.brightness);
    setContrast(s.contrast);
  };
  const pushHistory = () => {
    setHistory((h) => [...h, snapshot()]);
    setFuture([]);
  };
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setFuture((f) => [snapshot(), ...f]);
    setHistory((h) => h.slice(0, -1));
    applyEditState(prev);
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setHistory((h) => [...h, snapshot()]);
    setFuture((f) => f.slice(1));
    applyEditState(next);
  };

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
    setActiveTab('cutout');
    setBgColor(DEFAULT_EDIT.bgColor);
    setShadowOn(DEFAULT_EDIT.shadowOn);
    setBrightness(DEFAULT_EDIT.brightness);
    setContrast(DEFAULT_EDIT.contrast);
    setDesignTemplate(null);
    setHistory([]);
    setFuture([]);
    // Start fetching the AI model right away so it's hopefully already
    // cached by the time the user hits "Remove Background".
    loadImgly()
      .then((mod) => mod.preload?.({ model: 'isnet_quint8', device: 'cpu' }))
      .catch(() => {});
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const removeBackground = async () => {
    if (!selectedFile) return;
    setProcessState('processing');
    setErrorMessage(null);
    setProgressPct(0);
    setProgressLabel('Starting…');

    try {
      const imglyModule = await loadImgly();
      const imglyRemoveBackground = imglyModule.removeBackground;

      const onProgress = (key: string, current: number, total: number) => {
        if (total > 0) setProgressPct(Math.round((current / total) * 100));
        setProgressLabel(
          key.startsWith('fetch')
            ? 'Downloading AI model (first time only)…'
            : 'Removing background…'
        );
      };

      // isnet_quint8 is small and reliable on CPU everywhere. If it ever
      // fails for some reason, fall back to the library's own default
      // rather than showing the user a hard error.
      let resultBlob: Blob;
      try {
        resultBlob = await imglyRemoveBackground(selectedFile, {
          device: 'cpu',
          model: 'isnet_quint8',
          progress: onProgress,
        });
      } catch (firstErr) {
        console.warn('isnet_quint8 failed, retrying with default model:', firstErr);
        setProgressLabel('Retrying…');
        resultBlob = await imglyRemoveBackground(selectedFile, {
          device: 'cpu',
          progress: onProgress,
        });
      }

      const url = URL.createObjectURL(resultBlob);
      setResultImage(url);
      setProcessState('done');
      setActiveTab('background');
      setRecentItems((items) => [
        { id: `${Date.now()}`, input: selectedImage as string, output: url },
        ...items.filter((it) => it.input !== selectedImage).slice(0, 7),
      ]);
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
    setActiveTab('cutout');
    setBgColor(DEFAULT_EDIT.bgColor);
    setShadowOn(DEFAULT_EDIT.shadowOn);
    setBrightness(DEFAULT_EDIT.brightness);
    setContrast(DEFAULT_EDIT.contrast);
    setDesignTemplate(null);
    setHistory([]);
    setFuture([]);
  };

  const openRecent = (item: RecentItem) => {
    setSelectedFile(null);
    setSelectedImage(item.input);
    setResultImage(item.output);
    setProcessState('done');
    setActiveTab('background');
    setBgColor(DEFAULT_EDIT.bgColor);
    setShadowOn(DEFAULT_EDIT.shadowOn);
    setBrightness(DEFAULT_EDIT.brightness);
    setContrast(DEFAULT_EDIT.contrast);
    setDesignTemplate(null);
    setHistory([]);
    setFuture([]);
  };

  const handleDownload = async (size: 'preview' | 'hd') => {
    if (!resultImage) return;
    setDownloadMenuOpen(false);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = resultImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      let canvas: HTMLCanvasElement;
      let ctx: CanvasRenderingContext2D;

      if (designTemplate) {
        // Exact print/standard size: fit the cutout inside with a small
        // margin, centered, on the chosen background color.
        canvas = document.createElement('canvas');
        canvas.width = designTemplate.width;
        canvas.height = designTemplate.height;
        const c = canvas.getContext('2d');
        if (!c) throw new Error('Canvas not supported');
        ctx = c;

        ctx.fillStyle = bgColor === 'transparent' ? '#FFFFFF' : bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const marginRatio = 0.08;
        const availW = canvas.width * (1 - marginRatio * 2);
        const availH = canvas.height * (1 - marginRatio * 2);
        const fitScale = Math.min(
          availW / img.naturalWidth,
          availH / img.naturalHeight
        );
        const drawW = img.naturalWidth * fitScale;
        const drawH = img.naturalHeight * fitScale;
        const dx = (canvas.width - drawW) / 2;
        const dy = (canvas.height - drawH) / 2;

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        if (shadowOn) {
          ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
          ctx.shadowBlur = canvas.width * 0.03;
          ctx.shadowOffsetY = canvas.height * 0.015;
        }
        ctx.drawImage(img, dx, dy, drawW, drawH);
      } else {
        const scale =
          size === 'preview'
            ? Math.min(1, 640 / Math.max(img.naturalWidth, img.naturalHeight))
            : 1;
        const baseW = Math.round(img.naturalWidth * scale);
        const baseH = Math.round(img.naturalHeight * scale);
        const padding = shadowOn ? Math.round(baseW * 0.08) : 0;

        canvas = document.createElement('canvas');
        canvas.width = baseW + padding * 2;
        canvas.height = baseH + padding * 2;
        const c = canvas.getContext('2d');
        if (!c) throw new Error('Canvas not supported');
        ctx = c;

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
        ctx.drawImage(img, padding, padding, baseW, baseH);
      }

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Failed to export image');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = designTemplate
        ? `${designTemplate.id}-photo.png`
        : `background-removed-${size}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const isWorkspace = !!selectedImage;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {!isWorkspace ? (
        /* ======================================================= */
        /* ===================  LANDING VIEW  ===================== */
        /* ======================================================= */
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <section className="py-10 sm:py-14">
            <div className="grid items-start gap-10 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="group relative overflow-hidden rounded-[28px] bg-slate-100 shadow-xl">
                    <img
                      src={DEMO_IMAGE}
                      alt="Zor Remover"
                      className="block aspect-[4/3] w-full object-cover object-center transition duration-700 group-hover:scale-[1.02]"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/90 px-3.5 py-2 text-xs font-semibold text-amber-700 shadow-lg backdrop-blur-md">
                        <Crown className="h-3.5 w-3.5" />
                        Premium Tool
                      </span>
                    </div>
                    <div className="absolute bottom-5 left-5">
                      <span className="inline-flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur-md">
                        <Sparkles className="h-3.5 w-3.5 text-white" />
                        AI Background Remover
                      </span>
                    </div>
                  </div>
                  <div className="absolute -bottom-3 left-8 right-8 -z-10 h-8 rounded-full bg-slate-200/60 blur-xl" />
                </div>
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
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  }`}
                >
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
                    <p className="mt-5 text-sm text-slate-500">or drop a file</p>
                    <p className="mt-1 text-sm text-slate-400">
                      paste image or{' '}
                      <span className="text-blue-600 underline">URL</span>
                    </p>
                    <p className="mt-6 text-xs text-slate-400">
                      5 of 5 free removals remaining
                    </p>
                  </label>

                  {errorMessage && processState === 'error' && (
                    <p className="mt-3 text-center text-sm font-medium text-red-600">
                      {errorMessage}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          </section>

          <section className="pb-14">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Automatic</h3>
                <p className="mt-1 text-sm text-slate-500">
                  AI automatically detects the subject.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Clean Result</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Keep your subject clean and sharp.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Zap className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-slate-900">Fast & Free</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Get your result quickly with free removals.
                </p>
              </div>
            </div>
          </section>
        </main>
      ) : (
        /* ======================================================= */
        /* ==================  WORKSPACE VIEW  ===================== */
        /* ======================================================= */
        <div className="flex min-h-[calc(100vh-56px)] flex-col pt-14">
          {/* ---------- Toolbar ---------- */}
          <div className="sticky top-14 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={resetImage}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>

              {processState === 'done' && (
                <div className="hidden gap-1 rounded-xl bg-slate-100 p-1 sm:flex">
                  {(
                    [
                      { id: 'cutout', label: 'Cutout', icon: Scissors },
                      { id: 'background', label: 'Background', icon: Palette },
                      { id: 'effects', label: 'Effects', icon: Wand2 },
                      { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
                      { id: 'design', label: 'Design', icon: LayoutTemplate },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
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
              )}
            </div>

            {processState === 'done' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={undo}
                  disabled={!history.length}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Undo"
                >
                  <Undo2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={redo}
                  disabled={!future.length}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label="Redo"
                >
                  <Redo2 className="h-4 w-4" />
                </button>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setDownloadMenuOpen((v) => !v)}
                    className="flex h-9 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Download
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {downloadMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setDownloadMenuOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        <button
                          type="button"
                          onClick={() => handleDownload('preview')}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Preview
                            </div>
                            <div className="text-xs text-slate-500">
                              Smaller file, quick to share
                            </div>
                          </div>
                          <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            Free
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownload('hd')}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              HD
                            </div>
                            <div className="text-xs text-slate-500">
                              Full resolution, no watermark
                            </div>
                          </div>
                          <span className="rounded-md bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                            Free
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Mobile tab row */}
          {processState === 'done' && (
            <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-3 py-2 sm:hidden">
              {(
                [
                  { id: 'cutout', label: 'Cutout', icon: Scissors },
                  { id: 'background', label: 'Background', icon: Palette },
                  { id: 'effects', label: 'Effects', icon: Wand2 },
                  { id: 'adjust', label: 'Adjust', icon: SlidersHorizontal },
                  { id: 'design', label: 'Design', icon: LayoutTemplate },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-500'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* ---------- Main area ---------- */}
          <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row">
            {/* Canvas */}
            <div className="flex flex-1 flex-col items-center">
              <div
                className="relative flex max-h-[65vh] min-h-[320px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl shadow-lg"
                style={{
                  ...(processState === 'done' && bgColor !== 'transparent'
                    ? { backgroundColor: bgColor }
                    : CHECKERBOARD_STYLE),
                  ...(designTemplate
                    ? {
                        aspectRatio: `${designTemplate.width} / ${designTemplate.height}`,
                        maxWidth: designTemplate.width >= designTemplate.height ? '32rem' : '22rem',
                        margin: '0 auto',
                      }
                    : {}),
                }}
              >
                <img
                  src={resultImage ?? selectedImage ?? ''}
                  alt="Editing preview"
                  className={`block w-full object-contain ${
                    designTemplate ? 'h-full p-6' : 'max-h-[65vh] p-4'
                  }`}
                  style={
                    processState === 'done'
                      ? {
                          filter: `brightness(${brightness}%) contrast(${contrast}%)${
                            shadowOn
                              ? ' drop-shadow(0 18px 20px rgba(15,23,42,0.35))'
                              : ''
                          }`,
                        }
                      : undefined
                  }
                />
                {processState !== 'done' && (
                  <button
                    type="button"
                    onClick={resetImage}
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {processState !== 'done' && (
                <div className="mt-5 w-full max-w-lg">
                  <button
                    type="button"
                    onClick={removeBackground}
                    disabled={processState === 'processing'}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                  {processState === 'processing' && (
                    <p className="mt-2 text-center text-xs text-slate-400">
                      First removal on this device downloads a small AI model
                      — it's cached after that and future images are much
                      faster.
                    </p>
                  )}
                  {processState === 'error' && errorMessage && (
                    <p className="mt-3 text-center text-sm font-medium text-red-600">
                      {errorMessage}
                    </p>
                  )}
                </div>
              )}

              {processState === 'done' && (
                <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Background Removed
                </div>
              )}

              {/* Recent strip */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => newFileInputRef.current?.click()}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 transition hover:border-blue-400 hover:text-blue-500"
                  aria-label="Upload another image"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <input
                  ref={newFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="hidden"
                />
                {recentItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openRecent(item)}
                    className={`h-11 w-11 overflow-hidden rounded-xl border-2 transition ${
                      item.output === resultImage
                        ? 'border-blue-600'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={item.input}
                      alt="Recent upload"
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Side panel */}
            {processState === 'done' && (
              <div className="w-full flex-none rounded-2xl border border-slate-200 p-5 lg:w-80">
                {activeTab === 'cutout' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Cutout</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Your subject has been automatically separated from the
                      background. Switch to the other tabs to add a
                      background color, effects, or adjust the look before
                      downloading.
                    </p>
                  </div>
                )}

                {activeTab === 'background' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Background
                    </h3>
                    <p className="mb-3 mt-1 text-xs text-slate-500">
                      Choose a color, or keep it transparent.
                    </p>
                    <div className="grid grid-cols-6 gap-2">
                      {BG_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          title={c.label}
                          onClick={() => {
                            pushHistory();
                            setBgColor(c.value);
                          }}
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
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Effects
                    </h3>
                    <p className="mb-4 mt-1 text-xs text-slate-500">
                      Add finishing touches to your cutout.
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Drop shadow
                        </p>
                        <p className="text-xs text-slate-500">
                          Soft shadow beneath the subject.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={shadowOn}
                        onClick={() => {
                          pushHistory();
                          setShadowOn((v) => !v);
                        }}
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
                  </div>
                )}

                {activeTab === 'adjust' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Adjust
                    </h3>
                    <p className="mb-4 mt-1 text-xs text-slate-500">
                      Balance brightness and contrast.
                    </p>
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
                          onMouseDown={pushHistory}
                          onTouchStart={pushHistory}
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
                          onMouseDown={pushHistory}
                          onTouchStart={pushHistory}
                          onChange={(e) => setContrast(Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'design' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Design
                    </h3>
                    <p className="mb-3 mt-1 text-xs text-slate-500">
                      Frame your cutout to a standard size. Download will
                      export at exactly this size.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {DESIGN_TEMPLATES.map((tpl) => {
                        const active = designTemplate?.id === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => {
                              pushHistory();
                              if (active) {
                                setDesignTemplate(null);
                              } else {
                                setDesignTemplate(tpl);
                                if (bgColor === 'transparent') {
                                  setBgColor('#FFFFFF');
                                }
                              }
                            }}
                            className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 py-4 text-center transition ${
                              active
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                            style={{ aspectRatio: `${tpl.width} / ${tpl.height}` }}
                          >
                            <span
                              className={`text-xs font-semibold ${
                                active ? 'text-blue-700' : 'text-slate-700'
                              }`}
                            >
                              {tpl.label}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {tpl.sub}
                            </span>
                            {active && (
                              <Check className="mt-1 h-3.5 w-3.5 text-blue-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {designTemplate && (
                      <button
                        type="button"
                        onClick={() => {
                          pushHistory();
                          setDesignTemplate(null);
                        }}
                        className="mt-3 text-xs font-medium text-slate-500 underline hover:text-slate-700"
                      >
                        Remove frame — use original photo size
                      </button>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleDownload('hd')}
                  className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <Download className="h-4 w-4" />
                  Download HD
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isWorkspace && <Footer />}
    </div>
  );
}
