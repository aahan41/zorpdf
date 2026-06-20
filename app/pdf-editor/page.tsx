'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  Upload,
  Download,
  PenLine,
  Highlighter,
  ImagePlus,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';

export default function PdfEditorPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [text, setText] = useState('ZorPDF Edited');
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handlePdfUpload = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Sirf PDF file upload karo');
      return;
    }

    if (pdfUrl) URL.revokeObjectURL(pdfUrl);

    setPdfFile(file);
    setPdfUrl(URL.createObjectURL(file));
  };

  const downloadEditedPdf = async () => {
    if (!pdfFile) {
      alert('Pehle PDF upload karo');
      return;
    }

    const bytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    if (!pages.length) {
      alert('PDF page load nahi ho paya');
      return;
    }

    const firstPage = pages[0];

    firstPage.drawText(text || 'ZorPDF Edited', {
      x: 50,
      y: firstPage.getHeight() - 80,
      size: 18,
      color: rgb(0, 0.25, 0.9),
    });

    firstPage.drawRectangle({
      x: 45,
      y: firstPage.getHeight() - 125,
      width: 220,
      height: 28,
      color: rgb(1, 0.9, 0.2),
      opacity: 0.45,
    });

    if (imageFile) {
      const imgBytes = await imageFile.arrayBuffer();
      const isPng = imageFile.type === 'image/png';
      const image = isPng
        ? await pdfDoc.embedPng(imgBytes)
        : await pdfDoc.embedJpg(imgBytes);

      firstPage.drawImage(image, {
        x: 50,
        y: 80,
        width: 120,
        height: 60,
      });
    }

    const editedBytes = await pdfDoc.save();
    const blob = new Blob([editedBytes], { type: 'application/pdf' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zorpdf-edited.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    setPdfFile(null);
    setPdfUrl('');
    setText('ZorPDF Edited');
    setImageFile(null);
  };

  return (
    <div className="min-h-screen bg-[#050913] text-white px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-4">
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

        <div className="text-center mb-8">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-300 text-sm font-bold mb-4">
            PDF EDITOR PRO
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-3">
            Edit PDF Online
          </h1>

          <p className="text-slate-400">
            Upload PDF, preview it, then edit and download.
          </p>
        </div>

        {/* TOP HEADER UPLOAD SECTION */}
        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-5 mb-6">
          <label className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-slate-700 px-5 py-5 cursor-pointer hover:border-blue-500/50 transition">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Upload className="w-7 h-7 text-blue-400" />
              </div>

              <div>
                <p className="font-bold text-white">Upload PDF</p>
                <p className="text-slate-400 text-sm">
                  PDF upload karo, preview niche open hoga
                </p>
                {pdfFile && (
                  <p className="text-green-400 text-xs font-semibold mt-1 break-all">
                    Selected: {pdfFile.name}
                  </p>
                )}
              </div>
            </div>

            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handlePdfUpload(e.target.files?.[0] || null)}
            />

            <span className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 font-bold whitespace-nowrap">
              Choose File
            </span>
          </label>
        </div>

        {/* PDF PREVIEW BELOW UPLOAD */}
        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 min-h-[620px] mb-6">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-[620px] rounded-2xl bg-white"
            />
          ) : (
            <div className="h-[620px] flex items-center justify-center text-center">
              <div>
                <Upload className="w-14 h-14 mx-auto mb-4 text-slate-600" />
                <h2 className="text-2xl font-bold mb-2">PDF Preview</h2>
                <p className="text-slate-500">
                  Upload PDF karne ke baad yahan open hoga.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* EDIT OPTIONS BELOW PDF */}
        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-extrabold text-white">
              Edit Options
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Text, signature/image, highlight aur download yahin se hoga.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            <div className="rounded-2xl border border-white/10 bg-[#050913]/70 p-5">
              <label className="flex items-center gap-2 text-sm font-bold mb-3">
                <PenLine className="w-4 h-4 text-blue-400" />
                Add Text
              </label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#050913] px-4 py-3 text-white outline-none focus:border-blue-500"
                placeholder="Enter text"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#050913]/70 p-5">
              <label className="flex items-center gap-2 text-sm font-bold mb-3">
                <ImagePlus className="w-4 h-4 text-cyan-400" />
                Add Signature / Image
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300"
              />
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <div className="flex items-center gap-2 text-yellow-300 font-bold mb-2">
                <Highlighter className="w-4 h-4" />
                Highlight
              </div>
              <p className="text-slate-400 text-sm">
                Yellow highlight automatically first page par add hoga.
              </p>
            </div>

            <button
              onClick={downloadEditedPdf}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-5 font-bold text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-40"
              disabled={!pdfFile}
            >
              <Download className="w-5 h-5" />
              Download Edited PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
