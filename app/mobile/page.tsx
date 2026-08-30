'use client';

import { motion } from 'framer-motion';
import {
  Smartphone,
  Camera,
  MousePointerClick,
  Share2,
  Wifi,
  HardDriveDownload,
  Fingerprint,
  Zap,
} from 'lucide-react';

import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const steps = [
  {
    icon: Camera,
    title: 'Pick a File or Snap a Photo',
    desc: 'Choose a file from your phone\u2019s storage, or use your camera to capture a document directly.',
  },
  {
    icon: MousePointerClick,
    title: 'Tap Your Tool',
    desc: 'Select the conversion or edit you need — everything is sized for one-thumb tapping.',
  },
  {
    icon: Share2,
    title: 'Save or Share',
    desc: 'Save the result to your phone, or share it straight to WhatsApp, Gmail, or any app you use.',
  },
];

const perks = [
  {
    icon: Wifi,
    title: 'No App Install Needed',
    desc: 'ZorPDF opens instantly in your mobile browser — no storage taken up on your phone.',
  },
  {
    icon: HardDriveDownload,
    title: 'Light on Data',
    desc: 'Pages are optimized to load fast even on slower mobile connections.',
  },
  {
    icon: Fingerprint,
    title: 'Private by Default',
    desc: 'Files are processed securely and deleted afterwards — nothing lingers on our servers.',
  },
];

export default function MobilePage() {
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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
                <Smartphone className="h-3.5 w-3.5" />
                ZorPDF Mobile
              </div>

              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Convert files on the go, right from your phone
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
                ZorPDF works straight from your phone&apos;s browser — no app to
                download. Open the site, pick a file, and get your result in
                seconds.
              </p>

              <a
                href="/#tools"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700"
              >
                <Zap className="h-4 w-4 fill-white" />
                Open ZorPDF on Mobile
              </a>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
          <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
            How it works on mobile
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
            Why use ZorPDF on mobile
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
