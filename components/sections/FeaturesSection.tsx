'use client';

import {
  Zap,
  ShieldCheck,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

const features = [
  {
    title: 'Lightning Fast',
    description:
      'Convert files quickly with optimized processing that keeps everything smooth and responsive.',
    icon: Zap,
    iconClass: 'bg-orange-500/20 text-orange-400',
  },
  {
    title: 'Secure Files',
    description:
      '256-bit SSL encryption keeps your files and personal data safe during conversion.',
    icon: ShieldCheck,
    iconClass: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    title: 'No Signup',
    description:
      'Convert your documents without creating an account or going through unnecessary steps.',
    icon: FileCheck2,
    iconClass: 'bg-blue-500/20 text-blue-400',
  },
  {
    title: 'Easy Forever',
    description:
      'A clean and simple interface makes everyday document conversion effortless.',
    icon: Sparkles,
    iconClass: 'bg-pink-500/20 text-pink-400',
  },
];

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="w-full bg-[#030712] px-6 py-14"
    >
      <div className="mx-auto max-w-7xl">

        {/* Heading */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[10px] font-medium text-blue-400">
            WHY ZORPDF
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl">
            Built for Speed &amp; Privacy
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-xs leading-5 text-slate-500">
            We take file security seriously. Your files are processed and
            deleted automatically — never stored or shared.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-xl border border-blue-500/30 bg-[#080f20] p-4 transition-colors hover:border-blue-400/50"
              >
                <div
                  className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg ${feature.iconClass}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <h3 className="text-sm font-bold text-white">
                  {feature.title}
                </h3>

                <p className="mt-2 text-[11px] leading-4 text-slate-500">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
