'use client';

import { motion } from 'framer-motion';
import {
  Monitor,
  MousePointerClick,
  UploadCloud,
  DownloadCloud,
  Keyboard,
  Maximize2,
  Chrome,
  Zap,
  ArrowLeft,
} from 'lucide-react';

import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const steps = [
  {
    icon: UploadCloud,
    title: 'Drag & Drop or Browse',
    desc: 'Drop your file anywhere on the page, or click the upload box and pick it from your computer.',
  },
  {
    icon: MousePointerClick,
    title: 'Pick Your Tool',
    desc: 'Choose from PDF to Word, image compression, background removal and more — all in one click.',
  },
  {
    icon: DownloadCloud,
    title: 'Download Instantly',
    desc: 'Your converted file is ready in seconds and downloads straight to your Downloads folder.',
  },
];

const perks = [
  {
    icon: Maximize2,
    title: 'Full-Screen Workspace',
    desc: 'The larger desktop screen gives you side-by-side previews and faster multi-file handling.',
  },
  {
    icon: Keyboard,
    title: 'Keyboard Friendly',
    desc: 'Paste files with Ctrl/Cmd+V or drag multiple files at once for bulk conversion.',
  },
  {
    icon: Chrome,
    title: 'Works in Any Browser',
    desc: 'Chrome, Edge, Firefox or Safari — no installation or plugin needed, it just works.',
  },
];

export default function DesktopPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-5 text-center sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 flex justify-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </a>
              </div>

              <div className="mb-6 flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
                  <Monitor className="h-3.5 w-3.5" />
                  ZorPDF Desktop
                </div>
              </div>

              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                All of ZorPDF, right in your browser
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
                There&apos;s nothing to install. ZorPDF runs entirely in your desktop
                browser — open the site, drop your file, and get your converted
                document in seconds.
              </p>

              <a
                href="/#tools"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 fill-white" />
                Open ZorPDF on Desktop
              </a>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            How it works on desktop
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">
                    {index + 1}. {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Perks */}
        <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            Why use ZorPDF on desktop
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {perks.map((perk, index) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                  </div>
                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">
                    {perk.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-500">
                    {perk.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Ready to try it?
          </h2>

          <p className="mt-3 text-slate-500">
            No download, no sign up — just open the tools and start converting.
          </p>

          <a
            href="/#tools"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
          >
            Explore Tools
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
