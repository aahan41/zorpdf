'use client';

import Link from 'next/link';
import { PenLine, FileSignature, Highlighter, ImagePlus } from 'lucide-react';

export default function PdfEditorPage() {
  return (
    <div className="min-h-screen bg-[#050913] text-white">
      <div className="max-w-7xl mx-auto px-4 py-16">

        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-bold mb-6">
            PDF EDITOR PRO
          </div>

          <h1 className="text-5xl font-extrabold mb-4">
            Edit PDF Online
          </h1>

          <p className="text-slate-400 max-w-2xl mx-auto">
            Add text, signatures, images and highlights to your PDF directly from your browser.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-500/20 bg-slate-900/60 p-8 mb-10">
          <div className="border-2 border-dashed border-slate-700 rounded-2xl p-16 text-center">
            <h2 className="text-2xl font-bold mb-3">
              Upload PDF
            </h2>

            <p className="text-slate-400 mb-6">
              Select a PDF file to start editing
            </p>

            <input
              type="file"
              accept=".pdf"
              className="block mx-auto"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-5">

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <PenLine className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="font-bold mb-2">Add Text</h3>
            <p className="text-slate-400 text-sm">
              Add custom text anywhere in PDF.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <FileSignature className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="font-bold mb-2">Signature</h3>
            <p className="text-slate-400 text-sm">
              Add digital signature.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <Highlighter className="w-8 h-8 text-yellow-400 mb-4" />
            <h3 className="font-bold mb-2">Highlight</h3>
            <p className="text-slate-400 text-sm">
              Highlight important content.
            </p>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <ImagePlus className="w-8 h-8 text-cyan-400 mb-4" />
            <h3 className="font-bold mb-2">Add Image</h3>
            <p className="text-slate-400 text-sm">
              Insert logo, stamp or photo.
            </p>
          </div>

        </div>

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="inline-flex px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold"
          >
            Back To Home
          </Link>
        </div>

      </div>
    </div>
  );
}
