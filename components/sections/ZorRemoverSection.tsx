'use client';

import { motion } from 'framer-motion';
import { Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const REMOVER_IMAGE =
  'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=1200';

export default function ZorRemoverSection() {
  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 py-10">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50"
      >
        <div className="grid items-center gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:grid-cols-2 lg:px-12">

          {/* LEFT CONTENT */}
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-amber-700">
              <Crown className="h-3.5 w-3.5" />
              Zor Remover
            </div>

            <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl">
              Zor Remover
            </h2>

            <p className="mb-6 max-w-lg text-base leading-relaxed text-slate-600 sm:text-lg">
              Remove image background 100% automatically and completely free.
            </p>

            <Link
              href="/zor-remover"
              className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-slate-800"
            >
              Try Zor Remover
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <p className="mt-6 text-sm text-slate-500">
              5 free images • HD download is Premium
            </p>
          </div>

          {/* RIGHT IMAGE DEMO */}
          <div className="w-full">
            <div className="relative mx-auto w-full max-w-[560px] overflow-hidden rounded-2xl bg-white shadow-xl">

              {/* IMAGE FRAME */}
              <div className="relative aspect-[16/9] overflow-hidden">

                {/* CHECKERBOARD BACKGROUND */}
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: '#f8fafc',
                    backgroundImage: `
                      linear-gradient(45deg, #dbe2ea 25%, transparent 25%),
                      linear-gradient(-45deg, #dbe2ea 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #dbe2ea 75%),
                      linear-gradient(-45deg, transparent 75%, #dbe2ea 75%)
                    `,
                    backgroundSize: '32px 32px',
                    backgroundPosition:
                      '0 0, 0 16px, 16px -16px, -16px 0px',
                  }}
                />

                {/* NORMAL IMAGE - LEFT 50% */}
                <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden">
                  <img
                    src={REMOVER_IMAGE}
                    alt="Before background removal"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                  />
                </div>

                {/* REMOVED BACKGROUND EFFECT - RIGHT 50% */}
                <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
                  <img
                    src={REMOVER_IMAGE}
                    alt="After background removal"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                    style={{
                      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                      maskImage:
                        'linear-gradient(to right, black 0%, black 55%, transparent 100%)',
                      WebkitMaskImage:
                        'linear-gradient(to right, black 0%, black 55%, transparent 100%)',
                    }}
                  />
                </div>

                {/* CENTER DIVIDER */}
                <div className="absolute inset-y-0 left-1/2 z-20 w-px bg-white/90 shadow-sm" />

                {/* BEFORE LABEL */}
                <span className="absolute left-4 top-4 z-30 rounded-md bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Before
                </span>

                {/* AFTER LABEL */}
                <span className="absolute right-4 top-4 z-30 rounded-md bg-green-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                  After
                </span>

                {/* TRANSPARENT TEXT */}
                <div className="absolute bottom-4 right-4 z-30 rounded-lg bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm">
                  Background Removed
                </div>
              </div>

              {/* BOTTOM INFO */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-3">
                <span className="text-xs font-medium text-slate-500">
                  AI Background Removal
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                  100% Automatic
                </span>
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
