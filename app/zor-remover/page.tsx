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
  Crop,
  ScanFace,
  ZoomIn,
  Minus,
  Move,
  Grid3x3,
} from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

type ProcessState = 'idle' | 'processing' | 'done' | 'error';
type EditorTab = 'cutout' | 'crop' | 'face-clean' | 'background' | 'effects' | 'adjust' | 'design';

type EditState = {
  bgColor: string;
  shadowOn: boolean;
  brightness: number;
  contrast: number;
  faceCleanOn: boolean;
  faceCleanIntensity: number;
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
  faceCleanOn: false,
  faceCleanIntensity: 45,
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
  printable?: boolean;
};

// Real standard photo/print sizes, rendered at ~300 DPI.
const DESIGN_TEMPLATES: DesignTemplate[] = [
  { id: 'passport', label: 'Passport', sub: '2 × 2 in', width: 600, height: 600, printable: true },
  { id: 'id-card', label: 'ID Card', sub: '35 × 45 mm', width: 413, height: 531, printable: true },
  { id: 'poster', label: 'Poster', sub: 'A4', width: 1240, height: 1754 },
  { id: 'social', label: 'Social Post', sub: '1080 × 1080', width: 1080, height: 1080 },
];

const PRINT_COUNT_OPTIONS = [2, 3, 4, 6, 8, 9, 12];
const CROP_PRESETS = [
  { id: 'square', label: '1:1', sub: 'Square', width: 1000, height: 1000 },
  { id: 'id', label: '35 × 45', sub: 'ID photo', width: 413, height: 531 },
  { id: 'passport', label: '2 × 2', sub: 'Passport', width: 600, height: 600 },
  { id: 'four-three', label: '4:3', sub: 'Photo', width: 1200, height: 900 },
  { id: 'sixteen-nine', label: '16:9', sub: 'Wide', width: 1600, height: 900 },
];
const A4_SHEET = { width: 2480, height: 3508 }; // A4 @ 300dpi

// Picks the column count that fits `count` photos on the sheet as large
// as possible (classic photo-studio print-sheet layout).
function computePrintGrid(count: number, photoW: number, photoH: number) {
  // Passport 2x2 inch prints: keep the physical size exact (600x600 @ 300dpi).
  // Six true passport prints fit cleanly as 2 columns x 3 rows on portrait A4.
  if (count === 6 && photoW === 600 && photoH === 600) {
    return { cols: 2, rows: 3, scale: 1 };
  }

  let best = { cols: 1, rows: count, scale: 0 };
  for (let cols = 1; cols <= count; cols++) {
    const rows = Math.ceil(count / cols);
    const cellW = A4_SHEET.width / cols;
    const cellH = A4_SHEET.height / rows;
    const scale = Math.min(cellW / photoW, cellH / photoH);
    if (scale > best.scale) best = { cols, rows, scale };
  }
  return best;
}

// The on-screen frame's exact pixel box for a given template, computed in
// JS instead of via CSS aspect-ratio — guarantees the preview always
// visibly matches the chosen template's shape, regardless of any
// surrounding flex/min-height/max-height layout.
function getFrameBoxSize(tpl: DesignTemplate) {
  const maxDim = 420;
  const ratio = tpl.width / tpl.height;
  return ratio >= 1
    ? { width: maxDim, height: maxDim / ratio }
    : { width: maxDim * ratio, height: maxDim };
}

// Shared contain-fit + zoom + pan math used by BOTH the live preview and
// the canvas export, so what you see is exactly what you download.
function computeCropBox(
  frameW: number,
  frameH: number,
  imgW: number,
  imgH: number,
  zoom: number,
  offsetX: number,
  offsetY: number
) {
  // Crop mode must COVER the frame, not contain inside it. This removes the
  // unwanted empty borders and makes the crop match the exported image.
  const baseFit = Math.max(frameW / imgW, frameH / imgH);
  const scale = baseFit * Math.max(1, zoom);
  const drawW = imgW * scale;
  const drawH = imgH * scale;
  const maxX = Math.max(0, (drawW - frameW) / 2);
  const maxY = Math.max(0, (drawH - frameH) / 2);
  const left = (frameW - drawW) / 2 + clamp(offsetX, -1, 1) * maxX * 2;
  const top = (frameH - drawH) / 2 + clamp(offsetY, -1, 1) * maxY * 2;
  return { left, top, drawW, drawH };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function drawFaceClean(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  drawX: number,
  drawY: number,
  drawW: number,
  drawH: number,
  intensity: number,
) {
  if (intensity <= 0) return;

  const scaleX = drawW / img.naturalWidth;
  const scaleY = drawH / img.naturalHeight;
  // A portrait-safe face region: upper-middle of the subject. The overlay is
  // deliberately soft so eyes, eyebrows, lips and hair keep their detail.
  const cx = drawX + img.naturalWidth * 0.50 * scaleX;
  const cy = drawY + img.naturalHeight * 0.25 * scaleY;
  const rx = Math.max(12, img.naturalWidth * 0.17 * scaleX);
  const ry = Math.max(12, img.naturalHeight * 0.15 * scaleY);
  const blurPx = Math.max(1, intensity / 18);
  const alpha = Math.min(0.58, 0.10 + intensity / 180);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.filter = `blur(${blurPx}px)`;
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();
}

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
  const [faceCleanOn, setFaceCleanOn] = useState(false);
  const [faceCleanIntensity, setFaceCleanIntensity] = useState(45);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [designTemplate, setDesignTemplate] = useState<DesignTemplate | null>(null);
  const [printCount, setPrintCount] = useState<number | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropOffset, setCropOffset] = useState({ x: 0, y: 0 });
  const [imgNaturalSize, setImgNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    startY: number;
    startOffX: number;
    startOffY: number;
  } | null>(null);

  // ============ Undo / redo ============
  const [history, setHistory] = useState<EditState[]>([]);
  const [future, setFuture] = useState<EditState[]>([]);

  // ============ Recent images this session ============
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const snapshot = (): EditState => ({
    bgColor,
    shadowOn,
    brightness,
    contrast,
    faceCleanOn,
    faceCleanIntensity,
  });
  const applyEditState = (s: EditState) => {
    setBgColor(s.bgColor);
    setShadowOn(s.shadowOn);
    setBrightness(s.brightness);
    setContrast(s.contrast);
    setFaceCleanOn(s.faceCleanOn);
    setFaceCleanIntensity(s.faceCleanIntensity);
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
    setFaceCleanOn(DEFAULT_EDIT.faceCleanOn);
    setFaceCleanIntensity(DEFAULT_EDIT.faceCleanIntensity);
    setDesignTemplate(null);
    setPrintCount(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setImgNaturalSize(null);
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

  // Large phone-camera photos (often 3000-4000px wide) make the AI model
  // take much longer and can make the tab feel frozen while it computes.
  // Downscaling to a sane max dimension first keeps quality plenty good
  // for cutouts while cutting processing time dramatically.
  const downscaleForProcessing = (file: File, maxDim = 3000): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        if (scale >= 1) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              resolve(file);
              return;
            }
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(file);
      };
      img.src = url;
    });
  };

  const removeBackground = async () => {
    if (!selectedFile) return;
    setProcessState('processing');
    setErrorMessage(null);
    setProgressPct(0);
    setProgressLabel('Preparing image…');
    // Let the "Processing…" UI actually paint before the heavy work
    // begins, so the click feels instant instead of the tab freezing.
    await new Promise((r) => setTimeout(r, 30));

    try {
      const fileForProcessing = await downscaleForProcessing(selectedFile);
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

      // isnet_quint8 is small (fast to download and run) and reliable on
      // CPU everywhere. If it ever fails for some reason, fall back to
      // the higher-quality (but larger/slower) model as a last resort.
      let resultBlob: Blob;
      try {
        resultBlob = await imglyRemoveBackground(fileForProcessing, {
          device: 'cpu',
          model: 'isnet_quint8',
          progress: onProgress,
        });
      } catch (firstErr) {
        console.warn('isnet_quint8 failed, retrying with isnet_fp16:', firstErr);
        setProgressLabel('Retrying…');
        resultBlob = await imglyRemoveBackground(fileForProcessing, {
          device: 'cpu',
          model: 'isnet_fp16',
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
    setFaceCleanOn(DEFAULT_EDIT.faceCleanOn);
    setFaceCleanIntensity(DEFAULT_EDIT.faceCleanIntensity);
    setDesignTemplate(null);
    setPrintCount(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setImgNaturalSize(null);
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
    setFaceCleanOn(DEFAULT_EDIT.faceCleanOn);
    setFaceCleanIntensity(DEFAULT_EDIT.faceCleanIntensity);
    setDesignTemplate(null);
    setPrintCount(null);
    setCropZoom(1);
    setCropOffset({ x: 0, y: 0 });
    setImgNaturalSize(null);
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
        // Exact print/standard size — same fit+zoom+pan math as the
        // live preview, so the download matches exactly what's shown.
        canvas = document.createElement('canvas');
        canvas.width = designTemplate.width;
        canvas.height = designTemplate.height;
        const c = canvas.getContext('2d');
        if (!c) throw new Error('Canvas not supported');
        ctx = c;

        ctx.fillStyle = bgColor === 'transparent' ? '#FFFFFF' : bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const box = computeCropBox(
          canvas.width,
          canvas.height,
          img.naturalWidth,
          img.naturalHeight,
          cropZoom,
          cropOffset.x,
          cropOffset.y
        );

        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        if (shadowOn) {
          ctx.shadowColor = 'rgba(15, 23, 42, 0.35)';
          ctx.shadowBlur = canvas.width * 0.03;
          ctx.shadowOffsetY = canvas.height * 0.015;
        }
        ctx.drawImage(img, box.left, box.top, box.drawW, box.drawH);
        if (faceCleanOn) {
          drawFaceClean(ctx, img, box.left, box.top, box.drawW, box.drawH, faceCleanIntensity);
        }
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
        if (faceCleanOn) {
          drawFaceClean(ctx, img, padding, padding, baseW, baseH, faceCleanIntensity);
        }
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

  const handleDownloadPrintSheet = async () => {
    if (!resultImage || !designTemplate || !printCount) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = resultImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const photoW = designTemplate.width;
      const photoH = designTemplate.height;
      const { cols, rows, scale } = computePrintGrid(printCount, photoW, photoH);
      const renderW = photoW * scale;
      const renderH = photoH * scale;
      const cellW = A4_SHEET.width / cols;
      const cellH = A4_SHEET.height / rows;

      // Render one copy of the framed photo (same crop/zoom/pan math as
      // the live preview) once, then stamp it onto the sheet N times.
      const tile = document.createElement('canvas');
      tile.width = photoW;
      tile.height = photoH;
      const tctx = tile.getContext('2d');
      if (!tctx) throw new Error('Canvas not supported');
      tctx.fillStyle = bgColor === 'transparent' ? '#FFFFFF' : bgColor;
      tctx.fillRect(0, 0, photoW, photoH);
      const tileBox = computeCropBox(
        photoW,
        photoH,
        img.naturalWidth,
        img.naturalHeight,
        cropZoom,
        cropOffset.x,
        cropOffset.y
      );
      tctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      tctx.drawImage(img, tileBox.left, tileBox.top, tileBox.drawW, tileBox.drawH);
      if (faceCleanOn) {
        drawFaceClean(
          tctx,
          img,
          tileBox.left,
          tileBox.top,
          tileBox.drawW,
          tileBox.drawH,
          faceCleanIntensity,
        );
      }

      const canvas = document.createElement('canvas');
      canvas.width = A4_SHEET.width;
      canvas.height = A4_SHEET.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let placed = 0;
      for (let r = 0; r < rows && placed < printCount; r++) {
        for (let c = 0; c < cols && placed < printCount; c++) {
          const cx = c * cellW + (cellW - renderW) / 2;
          const cy = r * cellH + (cellH - renderH) / 2;
          ctx.drawImage(tile, cx, cy, renderW, renderH);
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, renderW, renderH);
          ctx.restore();
          placed++;
        }
      }

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) throw new Error('Failed to export sheet');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${designTemplate.id}-print-sheet-${printCount}pc-A4.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Print sheet download failed:', err);
    }
  };

  const handleQuickA4Six = () => {
    if (!resultImage) return;
    const printableTemplate =
      designTemplate?.id === 'passport'
        ? designTemplate
        : DESIGN_TEMPLATES.find((tpl) => tpl.id === 'passport')!;
    setDesignTemplate(printableTemplate);
    setPrintCount(6);
    setActiveTab('design');
    // Render with the current state immediately; no second click is required.
    void handleDownloadPrintSheetWithTemplate(printableTemplate, 6, 1, { x: 0, y: 0 });
  };

  const handleDownloadPrintSheetWithTemplate = async (
    template: DesignTemplate,
    count: number,
    zoom = cropZoom,
    offset = cropOffset,
  ) => {
    if (!resultImage) return;
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = resultImage;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const photoW = template.width;
      const photoH = template.height;
      const { cols, rows, scale } = computePrintGrid(count, photoW, photoH);
      const renderW = photoW * scale;
      const renderH = photoH * scale;
      const cellW = A4_SHEET.width / cols;
      const cellH = A4_SHEET.height / rows;

      const tile = document.createElement('canvas');
      tile.width = photoW;
      tile.height = photoH;
      const tctx = tile.getContext('2d');
      if (!tctx) throw new Error('Canvas not supported');
      tctx.fillStyle = bgColor === 'transparent' ? '#FFFFFF' : bgColor;
      tctx.fillRect(0, 0, photoW, photoH);

      const tileBox = computeCropBox(
        photoW,
        photoH,
        img.naturalWidth,
        img.naturalHeight,
        zoom,
        offset.x,
        offset.y,
      );
      tctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      tctx.drawImage(img, tileBox.left, tileBox.top, tileBox.drawW, tileBox.drawH);
      if (faceCleanOn) {
        drawFaceClean(
          tctx,
          img,
          tileBox.left,
          tileBox.top,
          tileBox.drawW,
          tileBox.drawH,
          faceCleanIntensity,
        );
      }

      const canvas = document.createElement('canvas');
      canvas.width = A4_SHEET.width;
      canvas.height = A4_SHEET.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      let placed = 0;
      for (let r = 0; r < rows && placed < count; r++) {
        for (let c = 0; c < cols && placed < count; c++) {
          const cx = c * cellW + (cellW - renderW) / 2;
          const cy = r * cellH + (cellH - renderH) / 2;
          ctx.drawImage(tile, cx, cy, renderW, renderH);
          ctx.save();
          ctx.strokeStyle = '#94a3b8';
          ctx.setLineDash([4, 3]);
          ctx.lineWidth = 1;
          ctx.strokeRect(cx, cy, renderW, renderH);
          ctx.restore();
          placed++;
        }
      }

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png'),
      );
      if (!blob) throw new Error('Failed to export sheet');

      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${template.id}-6-photo-A4.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Quick A4 download failed:', err);
      setErrorMessage('A4 sheet could not be created. Please try again.');
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
                      { id: 'crop', label: 'Crop', icon: Crop },
                      { id: 'face-clean', label: 'Face Clean', icon: ScanFace },
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
                  { id: 'crop', label: 'Crop', icon: Crop },
                  { id: 'face-clean', label: 'Face Clean', icon: ScanFace },
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
              {designTemplate ? (
                (() => {
                  const frame = getFrameBoxSize(designTemplate);
                  const box =
                    imgNaturalSize &&
                    computeCropBox(
                      frame.width,
                      frame.height,
                      imgNaturalSize.w,
                      imgNaturalSize.h,
                      cropZoom,
                      cropOffset.x,
                      cropOffset.y
                    );
                  return (
                    <div
                      ref={frameRef}
                      onPointerDown={(e) => {
                        (e.target as Element).setPointerCapture(e.pointerId);
                        dragStateRef.current = {
                          startX: e.clientX,
                          startY: e.clientY,
                          startOffX: cropOffset.x,
                          startOffY: cropOffset.y,
                        };
                      }}
                      onPointerMove={(e) => {
                        if (!dragStateRef.current || !frameRef.current) return;
                        const rect = frameRef.current.getBoundingClientRect();
                        const dx = (e.clientX - dragStateRef.current.startX) / rect.width;
                        const dy = (e.clientY - dragStateRef.current.startY) / rect.height;
                        setCropOffset({
                          x: clamp(dragStateRef.current.startOffX + dx, -0.5, 0.5),
                          y: clamp(dragStateRef.current.startOffY + dy, -0.5, 0.5),
                        });
                      }}
                      onPointerUp={() => {
                        dragStateRef.current = null;
                      }}
                      className="relative touch-none select-none overflow-hidden rounded-2xl shadow-lg"
                      style={{
                        width: frame.width,
                        height: frame.height,
                        cursor: dragStateRef.current ? 'grabbing' : 'grab',
                        ...(bgColor !== 'transparent'
                          ? { backgroundColor: bgColor }
                          : CHECKERBOARD_STYLE),
                      }}
                    >
                      <img
                        src={resultImage ?? selectedImage ?? ''}
                        alt="Editing preview"
                        draggable={false}
                        onLoad={(e) =>
                          setImgNaturalSize({
                            w: e.currentTarget.naturalWidth,
                            h: e.currentTarget.naturalHeight,
                          })
                        }
                        className="pointer-events-none absolute"
                        style={
                          box
                            ? {
                                left: box.left,
                                top: box.top,
                                width: box.drawW,
                                height: box.drawH,
                                filter: `brightness(${brightness}%) contrast(${contrast}%)${
                                  shadowOn
                                    ? ' drop-shadow(0 18px 20px rgba(15,23,42,0.35))'
                                    : ''
                                }`,
                              }
                            : { opacity: 0 }
                        }
                      />
                      {faceCleanOn && (
                        <img
                          src={resultImage ?? selectedImage ?? ''}
                          alt=""
                          aria-hidden="true"
                          draggable={false}
                          className="pointer-events-none absolute inset-0 h-full w-full object-contain opacity-30 blur-[2px]"
                          style={{
                            clipPath: 'ellipse(18% 18% at 50% 25%)',
                          }}
                        />
                      )}
                    </div>
                  );
                })()
              ) : (
                <div
                  className="relative flex max-h-[65vh] min-h-[320px] w-full max-w-lg items-center justify-center overflow-hidden rounded-2xl shadow-lg"
                  style={
                    processState === 'done' && bgColor !== 'transparent'
                      ? { backgroundColor: bgColor }
                      : CHECKERBOARD_STYLE
                  }
                >
                  <img
                    src={resultImage ?? selectedImage ?? ''}
                    alt="Editing preview"
                    onLoad={(e) =>
                      setImgNaturalSize({
                        w: e.currentTarget.naturalWidth,
                        h: e.currentTarget.naturalHeight,
                      })
                    }
                    className="block max-h-[65vh] w-full object-contain p-4"
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
                  {processState === 'done' && faceCleanOn && (
                    <img
                      src={resultImage ?? selectedImage ?? ''}
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] object-contain opacity-30 blur-[2px]"
                      style={{ clipPath: 'ellipse(18% 18% at 50% 25%)' }}
                    />
                  )}
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
              )}

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
                        {progressLabel || 'Preparing…'}
                        {progressPct !== null && progressPct > 0
                          ? ` ${progressPct}%`
                          : ''}
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

                {activeTab === 'crop' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Crop Photo</h3>
                    <p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">
                      Choose a ready-made crop ratio, then drag and zoom the photo inside the frame.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {CROP_PRESETS.map((preset) => {
                        const active = designTemplate?.id === `crop-${preset.id}`;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setCropZoom(1);
                              setCropOffset({ x: 0, y: 0 });
                              setDesignTemplate({
                                id: `crop-${preset.id}`,
                                label: preset.label,
                                sub: preset.sub,
                                width: preset.width,
                                height: preset.height,
                              });
                              if (bgColor === 'transparent') setBgColor('#FFFFFF');
                            }}
                            className={`rounded-lg border-2 p-3 text-left transition ${
                              active
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-bold text-slate-800">{preset.label}</div>
                            <div className="mt-0.5 text-[10px] text-slate-400">{preset.sub}</div>
                          </button>
                        );
                      })}
                    </div>

                    {designTemplate && designTemplate.id.startsWith('crop-') && (
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Move className="h-3.5 w-3.5" />
                          Drag inside the preview to position the crop.
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-700">Zoom</span>
                            <span className="text-slate-400">{Math.round(cropZoom * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={100}
                            max={300}
                            value={Math.round(cropZoom * 100)}
                            onChange={(e) => setCropZoom(Number(e.target.value) / 100)}
                            className="w-full accent-blue-600"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCropZoom(1);
                            setCropOffset({ x: 0, y: 0 });
                          }}
                          className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                        >
                          Reset crop
                        </button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDownload('hd')}
                      className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Crop className="h-3.5 w-3.5" />
                      Download Cropped Photo
                    </button>
                  </div>
                )}

                {activeTab === 'face-clean' && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Face Clean</h3>
                    <p className="mb-4 mt-1 text-xs leading-relaxed text-slate-500">
                      Smooth small skin imperfections while keeping the photo natural. The clean effect is applied during export too.
                    </p>
                    <div className="flex items-center justify-between border-t border-slate-100 py-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Skin smoothing</p>
                        <p className="text-xs text-slate-500">Natural portrait retouch</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={faceCleanOn}
                        onClick={() => {
                          pushHistory();
                          setFaceCleanOn((v) => !v);
                        }}
                        className={`relative h-6 w-11 flex-none rounded-full transition ${
                          faceCleanOn ? 'bg-blue-600' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                            faceCleanOn ? 'left-5' : 'left-0.5'
                          }`}
                        />
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1.5 flex justify-between text-xs font-medium">
                        <span className="text-slate-700">Intensity</span>
                        <span className="text-slate-400">{faceCleanIntensity}%</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={80}
                        value={faceCleanIntensity}
                        onMouseDown={pushHistory}
                        onTouchStart={pushHistory}
                        onChange={(e) => setFaceCleanIntensity(Number(e.target.value))}
                        className="w-full accent-blue-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        pushHistory();
                        setFaceCleanOn(true);
                        setFaceCleanIntensity(45);
                      }}
                      className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      <ScanFace className="h-3.5 w-3.5" />
                      Apply Face Clean
                    </button>
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
                              setCropZoom(1);
                              setCropOffset({ x: 0, y: 0 });
                              if (active) {
                                setDesignTemplate(null);
    setPrintCount(null);
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
                      <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Move className="h-3.5 w-3.5" />
                          Drag the photo to reposition it in the frame.
                        </div>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
                            <span className="flex items-center gap-1.5 text-slate-700">
                              <ZoomIn className="h-3.5 w-3.5" />
                              Zoom
                            </span>
                            <span className="text-slate-400">
                              {Math.round(cropZoom * 100)}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setCropZoom((z) => clamp(Math.round((z - 0.1) * 10) / 10, 1, 3));
                              }}
                              disabled={cropZoom <= 1}
                              className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Zoom out"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <input
                              type="range"
                              min={100}
                              max={300}
                              value={Math.round(cropZoom * 100)}
                              onMouseDown={pushHistory}
                              onTouchStart={pushHistory}
                              onChange={(e) =>
                                setCropZoom(Number(e.target.value) / 100)
                              }
                              className="w-full accent-blue-600"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                pushHistory();
                                setCropZoom((z) => clamp(Math.round((z + 0.1) * 10) / 10, 1, 3));
                              }}
                              disabled={cropZoom >= 3}
                              className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Zoom in"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            pushHistory();
                            setCropZoom(1);
                            setCropOffset({ x: 0, y: 0 });
                          }}
                          className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                        >
                          Reset position &amp; zoom
                        </button>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                              <Grid3x3 className="h-3.5 w-3.5" />
                              Print Sheet (A4)
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Six passport photos are fixed at 2 × 2 in and arranged 2 × 3 on portrait A4, ready to print.
                            </p>
                            <button
                              type="button"
                              onClick={handleQuickA4Six}
                              className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
                            >
                              <Grid3x3 className="h-3.5 w-3.5" />
                              One Click: 6 Passport Photos on A4
                            </button>
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {PRINT_COUNT_OPTIONS.map((n) => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() =>
                                    setPrintCount(printCount === n ? null : n)
                                  }
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-semibold transition ${
                                    printCount === n
                                      ? 'border-blue-600 bg-blue-600 text-white'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                            {designTemplate.printable && printCount && (
                              <button
                                type="button"
                                onClick={handleDownloadPrintSheet}
                                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 text-xs font-semibold text-white transition hover:bg-blue-700"
                              >
                                <Download className="h-3.5 w-3.5" />
                                Download {printCount}-Photo A4 Sheet
                              </button>
                            )}
                          </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              pushHistory();
                              setDesignTemplate(null);
    setPrintCount(null);
                              setCropZoom(1);
                              setCropOffset({ x: 0, y: 0 });
                            }}
                            className="text-xs font-medium text-slate-500 underline hover:text-slate-700"
                          >
                            Remove frame — use original photo size
                          </button>
                        </div>
                      </div>
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
