'use client';

import { useRef, useState } from 'react';
import {
  Bot,
  FileText,
  Loader2,
  Send,
  Sparkles,
  Upload,
  User,
  X,
} from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');

  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

  const buffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: buffer,
  }).promise;

  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const text = content.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text) {
      pages.push(`[Page ${pageNumber}]\n${text}`);
    }
  }

  return pages.join('\n\n');
}

export default function PdfChat() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (selected?: File) => {
    if (!selected) return;

    if (
      selected.type !== 'application/pdf' &&
      !selected.name.toLowerCase().endsWith('.pdf')
    ) {
      setError('Please select a PDF file.');
      return;
    }

    if (selected.size > 50 * 1024 * 1024) {
      setError('PDF must be smaller than 50MB.');
      return;
    }

    setError('');
    setLoadingPdf(true);
    setMessages([]);
    setPdfText('');
    setFile(selected);

    try {
      const text = await extractPdfText(selected);

      if (!text.trim()) {
        throw new Error(
          'No selectable text was found. Scanned/image-only PDFs need OCR.'
        );
      }

      setPdfText(text);

      setMessages([
        {
          role: 'assistant',
          content: `I've loaded "${selected.name}". Ask me anything about this PDF.`,
        },
      ]);
    } catch (err) {
      setFile(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Could not read the PDF.'
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  const sendMessage = async () => {
    const question = input.trim();

    if (!question || !pdfText || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: question,
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfText,
          messages: nextMessages.slice(-12),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI request failed.');
      }

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          content: data.answer,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'AI request failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const clearPdf = () => {
    setFile(null);
    setPdfText('');
    setMessages([]);
    setInput('');
    setError('');

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_-20px_rgba(15,23,42,0.15)] overflow-hidden">

      {/* Header */}
      <div className="border-b border-slate-200 p-6 sm:p-8">

        <div className="flex items-start justify-between gap-4">

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              AI Powered
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Chat with your PDF
            </h1>

            <p className="mt-2 text-slate-500">
              Upload a PDF and ask questions about its contents.
            </p>
          </div>

          {file && (
            <button
              onClick={clearPdf}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              title="Remove PDF"
            >
              <X className="h-5 w-5" />
            </button>
          )}

        </div>

        {/* Upload */}
        {!file && !loadingPdf && (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-6 w-full rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:border-violet-400 hover:bg-violet-50/30 transition"
          >
            <Upload className="mx-auto h-10 w-10 text-violet-500" />

            <div className="mt-3 font-semibold text-slate-900">
              Upload PDF
            </div>

            <div className="mt-1 text-sm text-slate-500">
              Maximum 50MB
            </div>
          </button>
        )}

        {/* PDF Loading */}
        {loadingPdf && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-5 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" />
            Reading your PDF...
          </div>
        )}

        {/* Selected PDF */}
        {file && !loadingPdf && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-violet-50 p-4">

            <FileText className="h-8 w-8 text-violet-600" />

            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-slate-900">
                {file.name}
              </div>

              <div className="text-xs text-slate-500">
                {Math.round(file.size / 1024)} KB
              </div>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-green-700">
              Ready
            </span>

          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

      </div>

      {/* Chat */}
      {file && (
        <>
          <div className="h-[480px] overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">

            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${
                  message.role === 'user'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >

                {message.role === 'assistant' && (
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap ${
                    message.role === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 shadow-sm'
                  }`}
                >
                  {message.content}
                </div>

                {message.role === 'user' && (
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
                    <User className="h-5 w-5" />
                  </div>
                )}

              </div>
            ))}

            {loading && (
              <div className="flex gap-3">

                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="h-5 w-5" />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>

              </div>
            )}

          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-4 sm:p-6">

            {error && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 focus-within:border-violet-500">

              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Ask something about this PDF..."
                rows={2}
                className="min-h-[48px] flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm outline-none"
              />

              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="rounded-xl bg-slate-900 p-3 text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-40"
                title="Send"
              >
                <Send className="h-5 w-5" />
              </button>

            </div>

            <p className="mt-2 text-center text-xs text-slate-400">
              Press Enter to send • Shift+Enter for a new line
            </p>

          </div>
        </>
      )}

      {!file && error && (
        <div className="mx-6 mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

    </div>
  );
}
