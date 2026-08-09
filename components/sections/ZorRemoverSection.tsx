'use client';

import { motion } from 'framer-motion';
import { Crown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const BEFORE_IMAGE = 'https://images.pexels.com/photos/34921744/pexels-photo-34921744.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function ZorRemoverSection() {
  return (
    <section className="px-4 sm:px-6 lg:px-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 border border-amber-100 overflow-hidden"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center p-8 sm:p-12">
            {/* Left side: text */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-amber-200 mb-5 self-start">
                <Crown className="w-4 h-4 text-amber-600" />
                <span className="text-amber-700 text-xs font-semibold">Zor Remover</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
                Zor Remover
              </h2>

              <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-6">
                Remove image background 100% automatically and completely free.
              </p>

              <div className="mb-6">
                <Link
                  href="/zor-remover"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all group"
                >
                  Try Zor Remover
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <p className="text-slate-500 text-sm">
                5 free images &bull; HD download is Premium
              </p>
            </div>

            {/* Right side: before/after image */}
            <div className="relative">
              <div className="relative rounded-2xl overflow-hidden shadow-lg bg-white">
                <div className="grid grid-cols-2 gap-px bg-slate-200">
                  <div className="relative aspect-[3/4] bg-slate-100">
                    <img
                      src={BEFORE_IMAGE}
                      alt="Before background removal"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-black/60 text-white text-[10px] font-semibold uppercase tracking-wide">
                      Before
                    </span>
                  </div>
                  <div className="relative aspect-[3/4] bg-[url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22><rect width=%2240%22 height=%2240%22 fill=%22%23f8fafc%22/><rect width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/><rect x=%2220%22 y=%2220%22 width=%2220%22 height=%2220%22 fill=%22%23f1f5f9%22/></svg>')]">
                    <img
                      src={BEFORE_IMAGE}
                      alt="After background removal"
                      className="w-full h-full object-cover mix-blend-multiply opacity-90"
                      style={{ WebkitMaskImage: 'radial-gradient(ellipse 60% 75% at 50% 40%, black 60%, transparent 75%)', maskImage: 'radial-gradient(ellipse 60% 75% at 50% 40%, black 60%, transparent 75%)' }}
                    />
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-md bg-green-500 text-white text-[10px] font-semibold uppercase tracking-wide">
                      After
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
