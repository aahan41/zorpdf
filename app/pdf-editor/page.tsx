'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PDFDocument, rgb } from 'pdf-lib';
import { Upload, Download, PenLine, Highlighter, ImagePlus, RotateCcw } from 'lucide-react';

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
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setPdfFile(null);
    setPdfUrl('');
    setText('ZorPDF Edited');
    setImageFile(null);
  };

  return (
    <div className="min-h-screen bg-[#050913] text-white px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="text-blue-400 font-bold">
            ← Back Home
          </Link>

          <button
            onClick={resetAll}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-blue-300 text-sm font-bold mb-5">
            PDF EDITOR PRO
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            Edit PDF Online
          </h1>

          <p className="text-slate-400">
            Upload PDF, add text, highlight and image/signature, then download edited PDF.
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-6">
          <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-6">
            <label className="block rounded-2xl border-2 border-dashed border-slate-700 p-8 text-center cursor-pointer hover:border-blue-500/50">
              <Upload className="w-10 h-10 mx-auto mb-4 text-blue-400" />
              <p className="font-bold mb-2">Upload PDF</p>
              <p className="text-slate-400 text-sm mb-4">
                Choose PDF file
              </p>
              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handlePdfUpload(e.target.files?.[0] || null)}
              />
              <span className="inline-flex rounded-xl bg-blue-600 px-5 py-2 font-bold">
                Choose File
              </span>
            </label>

            {pdfFile && (
              <p className="mt-4 text-sm text-green-400 font-semibold">
                Selected: {pdfFile.name}
              </p>
            )}

            <div className="mt-6 space-y-5">
              <div>
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

              <div>
                <label className="flex items-center gap-2 text-sm font-bold mb-2">
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

              <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                <div className="flex items-center gap-2 text-yellow-300 font-bold mb-1">
                  <Highlighter className="w-4 h-4" />
                  Highlight
                </div>
                <p className="text-slate-400 text-sm">
                  Yellow highlight automatically first page par add hoga.
                </p>
              </div>

              <button
                onClick={downloadEditedPdf}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 font-bold text-white shadow-lg shadow-blue-900/30"
              >
                <Download className="w-5 h-5" />
                Download Edited PDF
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-4 min-h-[650px]">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                className="w-full h-[650px] rounded-2xl bg-white"
              />
            ) : (
              <div className="h-[650px] flex items-center justify-center text-center">
                <div>
                  <Upload className="w-14 h-14 mx-auto mb-4 text-slate-600" />
                  <h2 className="text-2xl font-bold mb-2">PDF Preview</h2>
                  <p className="text-slate-500">
                    Upload PDF to preview here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
