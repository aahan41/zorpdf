import Link from "next/link";
import {
  Crown,
  Zap,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function PremiumSection() {
  return (
    <section className="bg-[#050913] px-4 sm:px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-[28px] border border-yellow-400/20 bg-gradient-to-br from-[#111827] via-[#0b1120] to-[#050913] shadow-2xl shadow-yellow-950/20">
          <div className="absolute top-0 left-0 w-72 h-72 bg-yellow-400/10 blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-orange-500/10 blur-[110px]" />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center px-6 sm:px-10 lg:px-14 py-14 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-300 text-xs sm:text-sm font-bold mb-7">
                <Crown className="w-4 h-4" />
                Premium Coming Soon
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                ZorPDF Premium ke saath{" "}
                <span className="text-yellow-300">zyada power</span> pao
              </h2>

              <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-xl mb-9">
                Abhi ZorPDF free hai. Jaldi hi premium users ke liye zyada file
                limit, faster conversion, priority support aur advanced PDF tools
                available honge.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-9">
                {[
                  {
                    icon: UploadCloud,
                    title: "More File Limit",
                    desc: "Free se zyada files ek saath convert karo.",
                  },
                  {
                    icon: Zap,
                    title: "Faster Conversion",
                    desc: "Premium users ke liye priority speed.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Secure Processing",
                    desc: "Safe aur private document handling.",
                  },
                  {
                    icon: Sparkles,
                    title: "Advanced Tools",
                    desc: "Future mein aur powerful PDF tools.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-yellow-400/40 hover:bg-white/[0.06] transition-all"
                  >
                    <item.icon className="w-6 h-6 text-yellow-300 mb-3" />
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300 transition shadow-lg shadow-yellow-500/20"
                >
                  Join Premium Waitlist →
                </Link>

                <Link
                  href="/#tools"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/5 transition"
                >
                  Free Tools Use Karo
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-[26px] border border-yellow-400/20 bg-[#0b1120]/95 p-5 sm:p-6 shadow-2xl">
                <div className="rounded-[22px] border border-yellow-400/40 bg-[#101827] p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Premium Plan</p>
                      <h3 className="text-white text-2xl font-bold">
                        ZorPDF Pro
                      </h3>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                      <Crown className="w-8 h-8 text-black" />
                    </div>
                  </div>

                  <div className="space-y-4 mb-7">
                    {[
                      "100+ files conversion",
                      "PDF + JPG + PNG mixed merge",
                      "Priority conversion speed",
                      "No waiting queue",
                      "Premium support",
                    ].map((text) => (
                      <div key={text} className="flex items-center gap-3 text-slate-300">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-slate-400 text-sm mb-1">Starting soon</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-extrabold text-white">
                        ₹99
                      </span>
                      <span className="text-slate-400 mb-1">/ month</span>
                    </div>
                    <p className="text-yellow-300 text-sm mt-3">
                      Payment system coming soon.
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    ["Fast", "Speed"],
                    ["Safe", "Files"],
                    ["Pro", "Tools"],
                  ].map(([title, sub]) => (
                    <div key={title} className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-white font-bold">{title}</p>
                      <p className="text-slate-500 text-xs">{sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
