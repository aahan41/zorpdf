'use client';

import { motion } from 'framer-motion';
import {
  Zap,
  ShieldCheck,
  Gauge,
  Users,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const values = [
  {
    icon: Gauge,
    title: 'Speed First',
    desc: 'Every tool is built to convert, compress and process files in seconds, not minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by Design',
    desc: 'Files are processed and deleted automatically — we never store or share your documents.',
  },
  {
    icon: Sparkles,
    title: 'Simple & Free',
    desc: 'No clutter, no confusing menus. Just upload, convert, and download — free for everyone.',
  },
  {
    icon: Users,
    title: 'Built for Everyone',
    desc: 'From students to professionals, ZorPDF is designed to make document work effortless.',
  },
];

export default function AboutPage() {
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

              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600">
                <Zap className="h-3.5 w-3.5 fill-blue-600" />
                About ZorPDF
              </div>

              <h1 className="text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
                Document tools that get out of your way
              </h1>

              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-500">
                ZorPDF started with a simple frustration — everyday PDF and image
                tools were slow, cluttered with ads, or locked behind paywalls.
                We built ZorPDF to be the opposite: fast, clean, private, and free.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const Icon = value.icon;

              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.08,
                  }}
                  className="glass-card rounded-2xl p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
                    <Icon
                      className="h-5 w-5 text-blue-600"
                      strokeWidth={1.75}
                    />
                  </div>

                  <h3 className="mb-1.5 text-base font-semibold text-slate-900">
                    {value.title}
                  </h3>

                  <p className="text-sm leading-relaxed text-slate-500">
                    {value.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto mt-20 max-w-4xl px-5 sm:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl p-8 sm:p-10"
          >
            <h2 className="mb-4 text-2xl font-bold text-slate-900">
              Our Story
            </h2>

            <div className="space-y-4 text-sm leading-relaxed text-slate-600">
              <p>
                We kept running into the same problem: converting a PDF, removing
                a background, or compressing an image shouldn&apos;t take five
                clicks past pop-up ads and account walls. So we built ZorPDF — a
                set of tools that do one job each, and do it well.
              </p>

              <p>
                Every file you upload is processed on secure infrastructure and
                deleted shortly after — nothing is stored longer than it needs to
                be, and nothing is shared with third parties. That&apos;s not a
                feature we bolted on later, it&apos;s the reason the product exists.
              </p>

              <p>
                Today ZorPDF is used by students, freelancers and teams who just
                want their files handled quickly, safely, and without friction.
              </p>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Ready to get started?
          </h2>

          <p className="mt-3 text-slate-500">
            Try any of our tools free — no sign up required to start.
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
