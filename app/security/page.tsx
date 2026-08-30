'use client';

import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Trash2, Server, Eye, KeyRound, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const points = [
  {
    icon: Lock,
    title: '256-bit SSL Encryption',
    desc: 'Every file transfer between your device and our servers is encrypted end-to-end using industry-standard TLS/SSL.',
  },
  {
    icon: Trash2,
    title: 'Automatic File Deletion',
    desc: 'Uploaded files are processed and then automatically deleted from our servers shortly after conversion — nothing is kept.',
  },
  {
    icon: Server,
    title: 'Secure Infrastructure',
    desc: 'Our processing pipelines run on hardened, access-controlled infrastructure with regular security monitoring.',
  },
  {
    icon: Eye,
    title: 'No Human Access',
    desc: 'Your documents are processed automatically. No one at ZorPDF views, reviews, or accesses your file content.',
  },
  {
    icon: KeyRound,
    title: 'Account Protection',
    desc: 'Passwords are hashed and never stored in plain text. Authentication is handled through secure, industry-standard practices.',
  },
  {
    icon: ShieldCheck,
    title: 'No Third-Party Sharing',
    desc: 'We never sell, share, or use your files or personal data for advertising or any purpose beyond the tool you requested.',
  },
];

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
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
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </a>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <ShieldCheck className="w-3.5 h-3.5" />
                Security
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Built for speed & privacy
              </h1>

              <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                We take file security seriously. Here&apos;s exactly how we protect your
                documents and data at every step.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Points */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 mt-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {points.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="glass-card rounded-2xl p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                  <p.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-slate-900 font-semibold text-base mb-1.5">
                    {p.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact note */}
        <section className="max-w-3xl mx-auto px-5 sm:px-8 mt-16 text-center">
          <p className="text-slate-500 text-sm">
            Found a security issue or have a question?{' '}
            <a
              href="mailto:support@zorpdf.com"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              support@zorpdf.com
            </a>
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
}
