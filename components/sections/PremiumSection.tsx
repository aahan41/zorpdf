import Link from "next/link";
import {
  Crown,
  Zap,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  PenLine,
  Highlighter,
  ImagePlus,
  FileSignature,
  ArrowRight,
  Lock,
} from "lucide-react";

export default function PremiumSection() {
  return (
    <section className="bg-[#050913] px-4 sm:px-6 py-20">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* PDF Editor Pro Highlight */}
        <div className="relative overflow-hidden rounded-[30px] border border-blue-500/30 bg-gradient-to-br from-[#081225] via-[#0b1b3a] to-[#050913] shadow-2xl shadow-blue-950/40">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/20 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400/15 blur-[130px]" />
          <div className="absolute top-8 right-8 hidden sm:flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-cyan-300 text-xs font-black">
            FREE BASIC EDITOR
          </div>

          <div className="relative grid lg:grid-cols-2 gap-12 items-center px-6 sm:px-10 lg:px-14 py-14 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-blue-300 text-xs sm:text-sm font-bold mb-7">
                <Sparkles className="w-4 h-4" />
                New Premium Highlight Tool
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                PDF Editor{" "}
                <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                  Pro
                </span>
              </h2>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-9">
                Upload your PDF and edit it online. Add text, signature, images
                and highlights without installing any software.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-9">
                {[
                  {
                    icon: PenLine,
                    title: "Add Text",
                    desc: "PDF ke upar custom text add karo.",
                  },
                  {
                    icon: FileSignature,
                    title: "Add Signature",
                    desc: "Signature image upload karke PDF me lagao.",
                  },
                  {
                    icon: Highlighter,
                    title: "Highlight PDF",
                    desc: "Important line ya area ko highlight karo.",
                  },
                  {
                    icon: ImagePlus,
                    title: "Add Image",
                    desc: "Logo, photo ya stamp PDF me add karo.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-blue-400/50 hover:bg-white/[0.06] transition-all"
                  >
                    <item.icon className="w-6 h-6 text-blue-300 mb-3" />
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/pdf-editor"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-bold text-white hover:scale-[1.02] transition shadow-lg shadow-blue-500/20"
                >
                  Start Editing PDF
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/#tools"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/5 transition"
                >
                  Use Free Tools
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-[26px] border border-blue-400/25 bg-[#071225]/95 p-5 sm:p-6 shadow-2xl shadow-blue-950/40">
                <div className="absolute -top-5 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-6">
                  <Crown className="w-8 h-8 text-black" />
                </div>

                <div className="rounded-[22px] border border-blue-400/30 bg-[#0b1120] p-6 sm:p-7">
                  <div className="flex items-center justify-between mb-7">
                    <div>
                      <p className="text-slate-400 text-sm mb-1">Live Editor</p>
                      <h3 className="text-white text-2xl font-bold">
                        Edit PDF Online
                      </h3>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center">
                      <PenLine className="w-8 h-8 text-blue-300" />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white p-5 min-h-[240px] shadow-inner">
                    <div className="h-3 w-32 rounded bg-slate-300 mb-4" />
                    <div className="space-y-2 mb-5">
                      <div className="h-2 w-full rounded bg-slate-200" />
                      <div className="h-2 w-11/12 rounded bg-slate-200" />
                      <div className="h-2 w-4/5 rounded bg-slate-200" />
                    </div>

                    <div className="h-10 w-44 rounded bg-yellow-200/90 border border-yellow-400 mb-5 flex items-center px-3">
                      <span className="text-[10px] font-bold text-yellow-700">
                        Highlighted Text Area
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="h-12 w-28 rounded-xl border-2 border-blue-500/70 flex items-center justify-center">
                        <span className="text-[11px] font-black text-blue-600">
                          SIGNATURE
                        </span>
                      </div>

                      <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <ImagePlus className="w-7 h-7 text-slate-500" />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    {[
                      ["Text", PenLine],
                      ["Sign", FileSignature],
                      ["Mark", Highlighter],
                      ["Image", ImagePlus],
                    ].map(([title, Icon]) => (
                      <div
                        key={String(title)}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <Icon className="w-4 h-4 text-cyan-300 mx-auto mb-1" />
                        <p className="text-white text-xs font-bold">
                          {String(title)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3">
                    <Lock className="w-4 h-4 text-green-300" />
                    <p className="text-green-300 text-sm font-semibold">
                      Browser-side private editing
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ZorPDF Premium Plan */}
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
                      <p className="text-slate-400 text-sm mb-1">
                        Premium Plan
                      </p>
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
                      <div
                        key={text}
                        className="flex items-center gap-3 text-slate-300"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-slate-400 text-sm mb-1">
                      Starting soon
                    </p>
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
