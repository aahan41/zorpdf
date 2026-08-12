'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Gauge, Users, Sparkles } from 'lucide-react';
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

const stats = [
  { value: '4.9/5', label: 'User Rating' },
  { value: '< 3s', label: 'Avg. Conversion Time' },
  { value: 'Unlimited', label: 'Daily Conversions' },
  { value: '256-bit', label: 'SSL Encryption' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5 fill-blue-600" />
                About ZorPDF
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Document tools that get out of your way
              </h1>

              <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
                ZorPDF started with a simple frustration — everyday PDF and image tools
                were slow, cluttered with ads, or locked behind paywalls. We built ZorPDF
                to be the opposite: fast, clean, private, and free.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Values */}
        <section className="max-w-6xl mx-auto px-5 sm:px-8 mt-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <v.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-1.5">
                  {v.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="max-w-4xl mx-auto px-5 sm:px-8 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="glass-card rounded-2xl p-8 sm:p-10"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Story</h2>
            <div className="space-y-4 text-slate-600 text-sm leading-relaxed">
              <p>
                We kept running into the same problem: converting a PDF, removing a
                background, or compressing an image shouldn&apos;t take five clicks past
                pop-up ads and account walls. So we built ZorPDF — a set of tools that
                do one job each, and do it well.
              </p>
              <p>
                Every file you upload is processed on secure infrastructure and deleted
                shortly after — nothing is stored longer than it needs to be, and nothing
                is shared with third parties. That&apos;s not a feature we bolted on later,
                it&apos;s the reason the product exists.
              </p>
              <p>
                Today ZorPDF is used by students, freelancers and teams who just want
                their files handled quickly, safely, and without friction.
              </p>
            </div>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 mt-16">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="text-center glass-card rounded-2xl py-6"
              >
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-slate-500 text-xs mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 mt-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to get started?
          </h2>
          <p className="mt-3 text-slate-500">
            Try any of our tools free — no sign up required to start.
          </p>
          <a
            href="/#tools"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-sm"
          >
            Explore Tools
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
