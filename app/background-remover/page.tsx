'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload,
  Download,
  ArrowLeft,
  Loader2,
  Wand2,
  Palette,
  Crop as CropIcon,
  Check,
  X,
  Undo2,
  Redo2,
  Scissors,
  Image as ImageIcon,
  Sliders,
  Sparkles as SparklesIcon,
  Layout,
  User,
  PawPrint,
  Car,
  Package,
  ChevronDown,
} from 'lucide-react';

type PresetBg =
  | 'transparent'
  | 'white'
  | 'blue'
  | 'red'
  | 'sky'
  | 'gray'
  | 'black'
  | 'green'
  | 'pink'
  | 'custom-color';

type CropRatio = 'free' | 'passport' | 'square' | 'portrait';
type Tab = 'cutout' | 'background' | 'effects' | 'adjust' | 'design';
type Effect = 'none' | 'grayscale' | 'bright' | 'contrast';

const BG_PRESETS: { id: PresetBg; label: string; swatch: string }[] = [
  { id: 'transparent', label: 'Transparent', swatch: 'checkerboard' },
  { id: 'white', label: 'White', swatch: '#FFFFFF' },
  { id: 'sky', label: 'Sky Blue', swatch: '#38BDF8' },
  { id: 'blue', label: 'Blue', swatch: '#2563EB' },
  { id: 'red', label: 'Red', swatch: '#DC2626' },
  { id: 'green', label: 'Green', swatch: '#16A34A' },
  { id: 'gray', label: 'Gray', swatch: '#9CA3AF' },
  { id: 'black', label: 'Black', swatch: '#000000' },
  { id: 'pink', label: 'Pink', swatch: '#EC4899' },
];

const CROP_RATIOS: { id: CropRatio; label: string; ratio: number | null }[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'passport', label: 'Passport (35x45)', ratio: 35 / 45 },
  { id: 'square', label: 'Square (1:1)', ratio: 1 },
  { id: 'portrait', label: 'Portrait (3:4)', ratio: 3 / 4 },
];

const DEMO_SAMPLES = [
  { id: 'person', label: 'Person', icon: User, color: 'from-orange-400 to-pink-400' },
  { id: 'pet', label: 'Pet', icon: PawPrint, color: 'from-amber-500 to-yellow-400' },
  { id: 'car', label: 'Car', icon: Car, color: 'from-slate-600 to-slate-400' },
  { id: 'product', label: 'Product', icon: Package, color: 'from-cyan-500 to-blue-400' },
];

const TABS: { id: Tab; label: string; icon: typeof Scissors }[] = [
  { id: 'cutout', label: 'Cutout', icon: Scissors },
  { id: 'background', label: 'Background', icon: ImageIcon },
  { id: 'effects', label: 'Effects', icon: SparklesIcon },
  { id: 'adjust', label: 'Adjust', icon: Sliders },
  { id: 'design', label: 'Design', icon: Layout },
];

function proxied(url: string) {
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

interface CropBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function BackgroundRemoverPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null); // AI transparent cutout (proxied)
  const [finalDataUrl, setFinalDataUrl] = useState<string | null>(null); // current visible/editable result

  const [bg, setBg] = useState<PresetBg>('transparent');
  const [customColor, setCustomColor] = useState('#22C55E');
  const [effect, setEffect] = useState<Effect>('none');

  const [activeTab, setActiveTab] = useState<Tab>('cutout');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  // Undo/redo history of finalDataUrl snapshots
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Crop state
  const [isCropping, setIsCropping] = useState(false);
  const [cropRatio, setCropRatio] = useState<CropRatio>('free');
  const [cropBox, setCropBox] = useState<CropBox>({ x: 10, y: 10, w: 80, h: 80 });
  const [dragMode, setDragMode] = useState<'move' | 'resize' | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; box: CropBox } | null>(null);
  const cropImgWrapRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const pushHistory = (dataUrl: string) => {
    const hist = historyRef.current.slice(0, historyIndexRef.current + 1);
    hist.push(dataUrl);
    historyRef.current = hist;
    historyIndexRef.current = hist.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const setResult = (dataUrl: string, recordHistory = true) => {
    setFinalDataUrl(dataUrl);
    if (recordHistory) pushHistory(dataUrl);
  };

  const undo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setFinalDataUrl(historyRef.current[historyIndexRef.current]);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  };

  const redo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setFinalDataUrl(historyRef.current[historyIndexRef.current]);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const startFresh = (file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Sirf JPG, PNG ya WEBP image upload karo');
      return;
    }
    setError('');
    setOriginalFile(file);
    setCutoutUrl(null);
    setFinalDataUrl(null);
    setBg('transparent');
    setEffect('none');
    setActiveTab('cutout');
    setIsCropping(false);
    historyRef.current = [];
    historyIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
    void runRemoveBackground(file);
  };

  const runRemoveBackground = async (file: File) => {
    setIsRemoving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Background remove nahi ho paya');
      }

      const proxiedUrl = proxied(data.imageUrl);
      setCutoutUrl(proxiedUrl);

      // Render initial transparent result to canvas so it's downloadable immediately
      const fg = await loadImage(proxiedUrl);
      const canvas = document.createElement('canvas');
      canvas.width = fg.naturalWidth;
      canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(fg, 0, 0);
      canvasRef.current = canvas;
      setResult(canvas.toDataURL('image/png', 1.0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kuch gadbad ho gayi');
    } finally {
      setIsRemoving(false);
    }
  };

  const applyEffectToCtx = (ctx: CanvasRenderingContext2D, w: number, h: number, eff: Effect) => {
    if (eff === 'none') return;
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue; // skip transparent pixels
      if (eff === 'grayscale') {
        const avg = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = d[i + 1] = d[i + 2] = avg;
      } else if (eff === 'bright') {
        d[i] = Math.min(255, d[i] * 1.18);
        d[i + 1] = Math.min(255, d[i + 1] * 1.18);
        d[i + 2] = Math.min(255, d[i + 2] * 1.18);
      } else if (eff === 'contrast') {
        const factor = 1.25;
        d[i] = Math.min(255, Math.max(0, (d[i] - 128) * factor + 128));
        d[i + 1] = Math.min(255, Math.max(0, (d[i + 1] - 128) * factor + 128));
        d[i + 2] = Math.min(255, Math.max(0, (d[i + 2] - 128) * factor + 128));
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const rebuild = async (targetBg: PresetBg, targetEffect: Effect) => {
    if (!cutoutUrl) return;
    setIsProcessing(true);
    setError('');

    try {
      const fg = await loadImage(cutoutUrl);
      const canvas = document.createElement('canvas');
      canvas.width = fg.naturalWidth;
      canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas support nahi mila');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const solidColors: Record<string, string> = {
        white: '#FFFFFF',
        sky: '#38BDF8',
        blue: '#2563EB',
        red: '#DC2626',
        green: '#16A34A',
        gray: '#9CA3AF',
        black: '#000000',
        pink: '#EC4899',
        'custom-color': customColor,
      };

      if (targetBg !== 'transparent' && solidColors[targetBg]) {
        ctx.fillStyle = solidColors[targetBg];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(fg, 0, 0);

      applyEffectToCtx(ctx, canvas.width, canvas.height, targetEffect);

      canvasRef.current = canvas;
      setResult(canvas.toDataURL('image/png', 1.0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Process nahi ho paya');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSelectBg = (target: PresetBg) => {
    setBg(target);
    rebuild(target, effect);
  };

  const handleSelectEffect = (target: Effect) => {
    setEffect(target);
    rebuild(bg, target);
  };

  const download = () => {
    if (!finalDataUrl) return;
    const a = document.createElement('a');
    a.href = finalDataUrl;
    a.download = 'zorpdf-background-removed.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetAll = () => {
    setOriginalFile(null);
    setCutoutUrl(null);
    setFinalDataUrl(null);
    setBg('transparent');
    setEffect('none');
    setError('');
    setActiveTab('cutout');
    setIsCropping(false);
    historyRef.current = [];
    historyIndexRef.current = -1;
    setCanUndo(false);
    setCanRedo(false);
  };

  // ---------- Crop logic ----------

  const applyCropRatio = (ratio: CropRatio) => {
    setCropRatio(ratio);
    const info = CROP_RATIOS.find((r) => r.id === ratio);
    if (!info || info.ratio === null) return;

    const wrap = cropImgWrapRef.current;
    const displayRatio = wrap ? wrap.clientWidth / wrap.clientHeight : 1;
    const targetRatio = info.ratio;

    let w = 80;
    let h = (w / targetRatio) * displayRatio;
    if (h > 90) {
      h = 90;
      w = (h * targetRatio) / displayRatio;
    }
    setCropBox({ x: (100 - w) / 2, y: (100 - h) / 2, w, h });
  };

  const startCropping = () => {
    setIsCropping(true);
    applyCropRatio(cropRatio);
  };

  const clampBox = (box: CropBox): CropBox => {
    let { x, y, w, h } = box;
    w = Math.min(Math.max(w, 5), 100);
    h = Math.min(Math.max(h, 5), 100);
    x = Math.min(Math.max(x, 0), 100 - w);
    y = Math.min(Math.max(y, 0), 100 - h);
    return { x, y, w, h };
  };

  const handlePointerDown = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDragMode(mode);
    dragStartRef.current = { x: e.clientX, y: e.clientY, box: cropBox };
  };

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragMode || !dragStartRef.current || !cropImgWrapRef.current) return;
      const rect = cropImgWrapRef.current.getBoundingClientRect();
      const dxPct = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dyPct = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;
      const start = dragStartRef.current.box;

      if (dragMode === 'move') {
        setCropBox(clampBox({ ...start, x: start.x + dxPct, y: start.y + dyPct }));
      } else {
        const info = CROP_RATIOS.find((r) => r.id === cropRatio);
        let w = start.w + dxPct;
        let h = start.h + dyPct;
        if (info?.ratio) {
          const displayRatio = rect.width / rect.height;
          h = (w / info.ratio) * displayRatio;
        }
        w = Math.min(Math.max(w, 5), 100 - start.x);
        h = Math.min(Math.max(h, 5), 100 - start.y);
        setCropBox({ ...start, w, h });
      }
    },
    [dragMode, cropRatio]
  );

  const handlePointerUp = useCallback(() => {
    setDragMode(null);
    dragStartRef.current = null;
  }, []);

  useEffect(() => {
    if (!dragMode) return;
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragMode, handlePointerMove, handlePointerUp]);

  const applyCrop = async () => {
    if (!finalDataUrl) return;
    setIsProcessing(true);
    setError('');

    try {
      const img = await loadImage(finalDataUrl);
      const sx = (cropBox.x / 100) * img.naturalWidth;
      const sy = (cropBox.y / 100) * img.naturalHeight;
      const sw = (cropBox.w / 100) * img.naturalWidth;
      const sh = (cropBox.h / 100) * img.naturalHeight;

      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas support nahi mila');

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      canvasRef.current = canvas;
      setResult(canvas.toDataURL('image/png', 1.0));
      setIsCropping(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crop apply nahi ho paya');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasImage = Boolean(originalFile);

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      {/* Top bar */}
      <div className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-sm">
            <ArrowLeft className="w-4 h-4" />
            ZorPDF
          </Link>

          <div className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 border border-blue-200 px-3.5 py-1.5">
            <span className="text-xs font-bold text-purple-600">PHOTO</span>
            <ArrowLeft className="w-3 h-3 rotate-180 text-slate-400" />
            <span className="text-xs font-bold text-blue-600">PNG</span>
          </div>

          {hasImage && (
            <button
              onClick={resetAll}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      {!hasImage ? (
        /* ---------------- EMPTY / HERO STATE ---------------- */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: heading */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-600 mb-5">
                <Wand2 className="w-3.5 h-3.5" />
                AI POWERED
              </div>
              <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] text-slate-900 mb-5">
                Remove Image
                <br />
                Background
              </h1>
              <p className="text-lg text-slate-500 mb-1">
                100% Automatically and{' '}
                <span className="inline-flex items-center rounded-full bg-blue-600 text-white text-sm font-bold px-3 py-1 align-middle">
                  Free
                </span>
              </p>
              <p className="text-slate-500 mt-4 max-w-md">
                Ek click mein background hatao, naya background lagao, crop karo — sab kuch HD quality mein, AI se.
              </p>
            </div>

            {/* Right: upload card */}
            <div>
              <div
                className="rounded-3xl border-2 border-dashed border-slate-200 bg-white shadow-xl shadow-slate-200/50 p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-blue-400 transition"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  startFresh(e.dataTransfer.files?.[0] || null);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => startFresh(e.target.files?.[0] || null)}
                />
                <button className="rounded-full bg-blue-600 hover:bg-blue-700 transition text-white font-bold px-8 py-3.5 shadow-lg shadow-blue-600/25 mb-3">
                  Upload Image
                </button>
                <p className="text-slate-500 text-sm">or drop a file</p>
              </div>

              <div className="mt-6">
                <p className="text-sm font-semibold text-slate-700 mb-3">No image? Try one of these:</p>
                <div className="flex gap-3">
                  {DEMO_SAMPLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setError('Demo ke liye apni khud ki photo upload karo — real demo images jaldi aayenge!')}
                      className={`w-14 h-14 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white shadow-md hover:scale-105 transition`}
                      title={s.label}
                    >
                      <s.icon className="w-6 h-6" />
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ---------------- EDITOR STATE ---------------- */
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          {/* Toolbar */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm px-3 py-2 mb-6 flex flex-wrap items-center gap-1 sm:gap-2">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id !== 'adjust') setIsCropping(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition ${
                  activeTab === t.id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}

            <div className="flex-1" />

            <button
              onClick={undo}
              disabled={!canUndo}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>

            <button
              onClick={download}
              disabled={!finalDataUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-bold px-4 py-2 disabled:opacity-40 ml-1"
            >
              <Download className="w-4 h-4" />
              Download
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Image canvas */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 flex items-center justify-center min-h-[420px]">
              {isRemoving ? (
                <div className="text-center py-16">
                  <Loader2 className="w-10 h-10 mx-auto mb-4 text-blue-500 animate-spin" />
                  <p className="text-slate-500 font-medium">AI background remove kar raha hai...</p>
                </div>
              ) : !isCropping ? (
                <div
                  className="rounded-2xl overflow-hidden border border-slate-200 max-w-full relative"
                  style={{
                    backgroundImage:
                      bg === 'transparent'
                        ? 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)'
                        : undefined,
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                  }}
                >
                  {finalDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={finalDataUrl} alt="Result" className="max-h-[500px] max-w-full object-contain" />
                  )}
                  {isProcessing && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div
                  ref={cropImgWrapRef}
                  className="relative mx-auto max-w-full select-none touch-none"
                  style={{ width: 'fit-content' }}
                >
                  {finalDataUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={finalDataUrl}
                      alt="Crop preview"
                      className="max-h-[460px] max-w-full block rounded-xl"
                      draggable={false}
                    />
                  )}
                  <div
                    className="absolute border-2 border-blue-500 cursor-move"
                    style={{
                      left: `${cropBox.x}%`,
                      top: `${cropBox.y}%`,
                      width: `${cropBox.w}%`,
                      height: `${cropBox.h}%`,
                      boxShadow: '0 0 0 9999px rgba(15,23,42,0.55)',
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                  >
                    <div
                      className="absolute -right-2 -bottom-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-white cursor-se-resize"
                      onPointerDown={(e) => handlePointerDown(e, 'resize')}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-5">
              {activeTab === 'cutout' && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-blue-500" />
                    Cutout
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    AI ne photo ka background automatically hata diya hai. Ab background badalne ke liye "Background" tab pe jao.
                  </p>
                  <button
                    onClick={() => setActiveTab('background')}
                    className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-bold py-2.5"
                  >
                    Change Background →
                  </button>
                </div>
              )}

              {activeTab === 'background' && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-500" />
                    Background
                  </h3>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {BG_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectBg(p.id)}
                        disabled={isProcessing}
                        className={`aspect-square rounded-xl border-2 flex items-center justify-center transition ${
                          bg === p.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'
                        }`}
                        title={p.label}
                      >
                        <span
                          className="w-full h-full rounded-lg m-1"
                          style={
                            p.swatch === 'checkerboard'
                              ? {
                                  backgroundImage:
                                    'linear-gradient(45deg, #cbd5e1 25%, transparent 25%), linear-gradient(-45deg, #cbd5e1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #cbd5e1 75%), linear-gradient(-45deg, transparent 75%, #cbd5e1 75%)',
                                  backgroundSize: '8px 8px',
                                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                                }
                              : { backgroundColor: p.swatch }
                          }
                        />
                      </button>
                    ))}
                  </div>

                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 cursor-pointer hover:border-slate-300">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => {
                        setCustomColor(e.target.value);
                        if (bg === 'custom-color') rebuild('custom-color', effect);
                      }}
                      onClick={() => setBg('custom-color')}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-600">Custom Color</span>
                  </label>
                </div>
              )}

              {activeTab === 'effects' && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <SparklesIcon className="w-4 h-4 text-blue-500" />
                    Effects
                  </h3>
                  <div className="space-y-2">
                    {([
                      { id: 'none', label: 'Original' },
                      { id: 'grayscale', label: 'Black & White' },
                      { id: 'bright', label: 'Brighten' },
                      { id: 'contrast', label: 'High Contrast' },
                    ] as { id: Effect; label: string }[]).map((e) => (
                      <button
                        key={e.id}
                        onClick={() => handleSelectEffect(e.id)}
                        disabled={isProcessing}
                        className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                          effect === e.id
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {e.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <CropIcon className="w-4 h-4 text-blue-500" />
                    Crop
                  </h3>

                  {!isCropping ? (
                    <button
                      onClick={startCropping}
                      className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-bold py-2.5"
                    >
                      Start Cropping
                    </button>
                  ) : (
                    <>
                      <div className="space-y-2 mb-4">
                        {CROP_RATIOS.map((r) => (
                          <button
                            key={r.id}
                            onClick={() => applyCropRatio(r.id)}
                            className={`w-full text-left rounded-xl border px-3.5 py-2.5 text-sm font-semibold transition ${
                              cropRatio === r.id
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {r.label}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsCropping(false)}
                          className="flex-1 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold py-2.5 flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                        <button
                          onClick={applyCrop}
                          disabled={isProcessing}
                          className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-bold py-2.5 flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Apply
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'design' && (
                <div>
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Layout className="w-4 h-4 text-blue-500" />
                    Design
                  </h3>
                  <p className="text-sm text-slate-500">
                    Text overlays, frames aur templates jaldi aa rahe hain — coming soon! ✨
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
