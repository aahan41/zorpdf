'use client';

import { motion } from 'framer-motion';
import { Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const BEFORE_IMAGE =
  'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=900';

const AFTER_IMAGE =
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=900';

export default function ZorRemoverSection() {
  return (
    <section className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-100 overflow-hidden"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-10 p-8 sm:p-10 lg:p-12">

          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-300 bg-white/70 text-amber-700 text-xs font-semibold mb-5">
              <Crown className="w-3.5 h-3.5" />
              Zor Remover
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              Zor Remover
            </h2>

            <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6 max-w-lg">
              Remove image background 100% automatically and completely free.
            </p>

            <Link
              href="/zor-remover"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all group mb-6"
            >
              Try Zor Remover
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <p className="text-slate-500 text-sm">
              5 free images &bull; HD download is Premium
            </p>
          </div>

          {/* RIGHT - FIXED FRAME */}
          <div className="relative w-full max-w-xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-lg bg-white">

              <div className="grid grid-cols-2">

                {/* BEFORE */}
                <div className="relative h-[300px] sm:h-[340px] overflow-hidden bg-slate-100">
                  <img
                    src={BEFORE_IMAGE}
                    alt="Before background removal"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />

                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-black/65 text-white text-[10px] font-bold uppercase tracking-wide">
                    Before
                  </span>
                </div>

                {/* AFTER */}
                <div
                  className="relative h-[300px] sm:h-[340px] overflow-hidden"
                  style={{
                    backgroundColor: '#f8fafc',
                    backgroundImage: `
                      linear-gradient(45deg, #dce2e8 25%, transparent 25%),
                      linear-gradient(-45deg, #dce2e8 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #dce2e8 75%),
                      linear-gradient(-45deg, transparent 75%, #dce2e8 75%)
                    `,
                    backgroundSize: '24px 24px',
                    backgroundPosition:
                      '0 0, 0 12px, 12px -12px, -12px 0px',
                  }}
                >
                  <img
                    src={AFTER_IMAGE}
                    alt="After background removal"
                    className="absolute inset-0 w-full h-full object-cover object-center"
                  />

                  <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-md bg-green-500 text-white text-[10px] font-bold uppercase tracking-wide">
                    After
                  </span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </section>
  );
}
