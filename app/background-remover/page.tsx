'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  Download,
  ArrowLeft,
  RotateCcw,
  Loader2,
  ImageIcon,
  Wand2,
  Palette,
} from 'lucide-react';

type PresetBg = 'transparent' | 'white' | 'blue' | 'red' | 'custom-color' | 'custom-image';

const PRESETS: { id: PresetBg; label: string; swatch: string }[] = [
  { id: 'transparent', label: 'Transparent', swatch: 'checkerboard' },
  { id: 'white', label: 'White', swatch: '#FFFFFF' },
  { id: 'blue', label: 'Blue', swatch: '#2563EB' },
  { id: 'red', label: 'Red', swatch: '#DC2626' },
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

export default function BackgroundRemoverPage() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [cutoutUrl, setCutoutUrl] = useState<string | null>(null);
  const [finalDataUrl, setFinalDataUrl] = useState<string | null>(null);
  const [bg, setBg] = useState<PresetBg>('transparent');
  const [customColor, setCustomColor] = useState('#22C55E');
  const [customBgFile, setCustomBgFile] = useState<File | null>(null);
  const [customBgPreview, setCustomBgPreview] = useState('');
  const [isRemoving, setIsRemoving] = useState(false);
  const [isCompositing, setIsCompositing] = useState(false);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleUpload = (file: File | null) => {
    if (!file) return;
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Sirf JPG, PNG ya WEBP image upload karo');
      return;
    }
    setError('');
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    setOriginalFile(file);
    setOriginalPreview(URL.createObjectURL(file));
    setCutoutUrl(null);
    setFinalDataUrl(null);
    setBg('transparent');
  };

  const handleCustomBgUpload = (file: File | null) => {
    if (!file) return;
    if (customBgPreview) URL.revokeObjectURL(customBgPreview);
    setCustomBgFile(file);
    setCustomBgPreview(URL.createObjectURL(file));
    setBg('custom-image');
  };

  const removeBackground = async () => {
    if (!originalFile) {
      setError('Pehle photo upload karo');
      return;
    }
    setError('');
    setIsRemoving(true);
    setCutoutUrl(null);
    setFinalDataUrl(null);

    try {
      const formData = new FormData();
      formData.append('image', originalFile);

      const res = await fetch('/api/remove-bg', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Background remove nahi ho paya');
      }

      setCutoutUrl(proxied(data.imageUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kuch gadbad ho gayi');
    } finally {
      setIsRemoving(false);
    }
  };

  const composite = async (targetBg: PresetBg) => {
    if (!cutoutUrl) return;
    setIsCompositing(true);
    setError('');

    try {
      const fg = await loadImage(cutoutUrl);
      const canvas = canvasRef.current ?? document.createElement('canvas');
      canvasRef.current = canvas;
      canvas.width = fg.naturalWidth;
      canvas.height = fg.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas support nahi mila');

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (targetBg === 'transparent') {
        ctx.drawImage(fg, 0, 0);
      } else if (targetBg === 'white' || targetBg === 'blue' || targetBg === 'red' || targetBg === 'custom-color') {
        const colorMap: Record<string, string> = {
          white: '#FFFFFF',
          blue: '#2563EB',
          red: '#DC2626',
          'custom-color': customColor,
        };
        ctx.fillStyle = colorMap[targetBg];
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(fg, 0, 0);
      } else if (targetBg === 'custom-image') {
        if (!customBgPreview) throw new Error('Pehle custom background image upload karo');
        const bgImg = await loadImage(customBgPreview);
        const scale = Math.max(canvas.width / bgImg.naturalWidth, canvas.height / bgImg.naturalHeight);
        const w = bgImg.naturalWidth * scale;
        const h = bgImg.naturalHeight * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        ctx.drawImage(bgImg, x, y, w, h);
        ctx.drawImage(fg, 0, 0);
      }

      setFinalDataUrl(canvas.toDataURL('image/png', 1.0));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background apply nahi ho paya');
    } finally {
      setIsCompositing(false);
    }
  };

  const handleSelectBg = (target: PresetBg) => {
    setBg(target);
    composite(target);
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
    if (originalPreview) URL.revokeObjectURL(originalPreview);
    if (customBgPreview) URL.revokeObjectURL(customBgPreview);
    setOriginalFile(null);
    setOriginalPreview('');
    setCutoutUrl(null);
    setFinalDataUrl(null);
    setBg('transparent');
    setCustomBgFile(null);
    setCustomBgPreview('');
    setError('');
  };

  const displayImage = finalDataUrl || cutoutUrl || originalPreview;

  return (
    <div className="min-h-screen bg-[#050913] text-white px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back Home
          </Link>

          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <div className="text-center mb-6">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-300 text-sm font-bold mb-3">
            AI BACKGROUND REMOVER
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-2">
            Remove &amp; Change Photo Background
          </h1>
          <p className="text-slate-400 text-sm">
            Photo upload karo, AI se background hatao, aur naya background (white / blue / red / custom) laga do.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 mb-4">
          <label className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-700 px-4 py-3 cursor-pointer hover:border-blue-500/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Upload Photo</p>
                <p className="text-slate-400 text-xs">JPG, PNG ya WEBP choose karo</p>
                {originalFile && (
                  <p className="text-green-400 text-[11px] font-semibold mt-1 break-all">
                    Selected: {originalFile.name}
                  </p>
                )}
              </div>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0] || null)}
            />
            <span className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold whitespace-nowrap">
              Choose File
            </span>
          </label>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 mb-4">
          <button
            onClick={removeBackground}
            disabled={!originalFile || isRemoving}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 font-bold text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isRemoving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Background Remove ho raha hai...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Remove Background (AI)
              </>
            )}
          </button>
        </div>

        {cutoutUrl && (
          <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-cyan-400" />
              <p className="font-bold text-sm">Naya Background Choose Karo</p>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleSelectBg(p.id)}
                  disabled={isCompositing}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                    bg === p.id ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/20"
                    style={
                      p.swatch === 'checkerboard'
                        ? {
                            backgroundImage:
                              'linear-gradient(45deg, #888 25%, transparent 25%), linear-gradient(-45deg, #888 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #888 75%), linear-gradient(-45deg, transparent 75%, #888 75%)',
                            backgroundSize: '6px 6px',
                            backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
                          }
                        : { backgroundColor: p.swatch }
                    }
                  />
                  {p.label}
                </button>
              ))}

              <button
                onClick={() => handleSelectBg('custom-color')}
                disabled={isCompositing}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                  bg === 'custom-color' ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-white/10 text-slate-300 hover:border-white/30'
                }`}
              >
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    if (bg === 'custom-color') composite('custom-color');
                  }}
                  className="w-5 h-5 rounded-full border-0 bg-transparent cursor-pointer"
                />
                Custom Color
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#050913]/70 p-4">
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                Ya apni khud ki Background Image lagao
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => handleCustomBgUpload(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300"
              />
              {customBgFile && (
                <p className="text-green-400 text-[11px] font-semibold mt-2 break-all">
                  Selected: {customBgFile.name}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-3 min-h-[480px]">
          {displayImage ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div
                className="rounded-2xl overflow-hidden border border-white/10 max-w-full"
                style={{
                  backgroundImage:
                    'linear-gradient(45deg, #1e293b 25%, transparent 25%), linear-gradient(-45deg, #1e293b 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1e293b 75%), linear-gradient(-45deg, transparent 75%, #1e293b 75%)',
                  backgroundSize: '20px 20px',
                  backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={displayImage} alt="Preview" className="max-h-[500px] max-w-full object-contain" />
              </div>

              {isCompositing && (
                <p className="text-slate-400 text-xs flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Background apply ho raha hai...
                </p>
              )}

              <button
                onClick={download}
                disabled={!finalDataUrl}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-bold text-white shadow-lg shadow-blue-900/30 disabled:opacity-40"
              >
                <Download className="w-5 h-5" />
                Download Photo
              </button>
            </div>
          ) : (
            <div className="h-[480px] flex items-center justify-center text-center">
              <div>
                <Upload className="w-14 h-14 mx-auto mb-4 text-slate-600" />
                <h2 className="text-2xl font-bold mb-2">Photo Preview</h2>
                <p className="text-slate-500">Upload karne ke baad yahan preview dikhega.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
