'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PDFDocument, rgb } from 'pdf-lib';
import {
  Upload,
  Download,
  PenLine,
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

    if (text.trim()) {
      firstPage.drawText(text, {
        x: 50,
        y: firstPage.getHeight() - 80,
        size: 18,
        color: rgb(0, 0.25, 0.9),
      });
    }

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
            PDF EDITOR PRO
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold mb-2">
            Edit PDF Online
          </h1>

          <p className="text-slate-400 text-sm">
            Upload PDF, add text/signature, then download edited PDF.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 mb-4">
          <label className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-700 px-4 py-3 cursor-pointer hover:border-blue-500/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Upload className="w-5 h-5 text-blue-400" />
              </div>

              <div>
                <p className="font-bold text-white text-sm">Upload PDF</p>
                <p className="text-slate-400 text-xs">Choose PDF file</p>
                {pdfFile && (
                  <p className="text-green-400 text-[11px] font-semibold mt-1 break-all">
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

            <span className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold whitespace-nowrap">
              Choose File
            </span>
          </label>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 mb-4">
          <div className="grid md:grid-cols-[1fr_1fr_220px] gap-4">
            <div className="rounded-2xl border border-white/10 bg-[#050913]/70 p-4">
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
                <ImagePlus className="w-4 h-4 text-cyan-400" />
                Signature / Image Upload
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-300"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#050913]/70 p-4">
              <label className="flex items-center gap-2 text-sm font-bold mb-2">
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

            <button
              onClick={downloadEditedPdf}
              disabled={!pdfFile}
              className="rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-5 font-bold text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <Download className="w-5 h-5" />
              Download Edited PDF
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-3 min-h-[620px]">
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
                  PDF upload karne ke baad yahan open hoga.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
