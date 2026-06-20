import Link from "next/link";
import {
  Crown,
  Zap,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  CheckCircle2,
  PenLine,
  Lock,
  Unlock,
  Scissors,
  Minimize2,
  Files,
} from "lucide-react";

export default function PremiumSection() {
  const editorFeatures = [
    { icon: PenLine, title: "PDF Editor", desc: "Add text, signature, image and highlight.", href: "/pdf-editor" },
    { icon: Files, title: "PDF Merge", desc: "Multiple PDFs ko ek file me combine karo.", href: "/#tools" },
    { icon: Scissors, title: "PDF Split", desc: "PDF pages ko alag-alag file me nikalo.", href: "/#tools" },
    { icon: Minimize2, title: "PDF Compress", desc: "PDF ka size reduce karo.", href: "/#tools" },
    { icon: Lock, title: "PDF Protect", desc: "PDF me password protection add karo.", href: "/#tools" },
    { icon: Unlock, title: "PDF Unlock", desc: "Unlocked PDF ko edit/download karo.", href: "/#tools" },
  ];

  return (
    <section className="bg-[#050913] px-4 sm:px-6 py-20">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="relative overflow-hidden rounded-[30px] border border-blue-500/30 bg-gradient-to-br from-[#081225] via-[#0b1b3a] to-[#050913] shadow-2xl shadow-blue-950/40">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-blue-500/20 blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-400/15 blur-[130px]" />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center px-6 sm:px-10 lg:px-14 py-14 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-yellow-300 text-xs sm:text-sm font-bold mb-7">
                <Crown className="w-4 h-4" />
                NEW PREMIUM FEATURE
              </div>

              <h2 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-5">
                PDF Editor{" "}
                <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                  Pro
                </span>
              </h2>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl mb-8">
                Edit, merge, split, compress, protect and unlock PDF files online without installing any software.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-9">
                {editorFeatures.slice(0, 4).map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-blue-400/50 hover:bg-white/[0.06] transition-all"
                  >
                    <item.icon className="w-6 h-6 text-blue-300 mb-3" />
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/#pdf-tools"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 font-bold text-white hover:scale-[1.02] transition shadow-lg shadow-blue-500/20"
                >
                  Start Editing PDF
                  →
                </Link>

                <Link
                  href="/#tools"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-6 py-3 font-semibold text-white hover:bg-white/5 transition"
                >
                  Use Free Tools
                </Link>
              </div>
            </div>

            <div id="pdf-tools" className="relative scroll-mt-28">
              <div className="relative rounded-[26px] border border-blue-400/25 bg-[#071225]/95 p-5 sm:p-6 shadow-2xl shadow-blue-950/40">
                <div className="absolute -top-5 -right-4 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-300 to-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 rotate-6">
                  <Crown className="w-8 h-8 text-black" />
                </div>

                <div className="rounded-[22px] border border-blue-400/30 bg-[#0b1120] p-6 sm:p-7">
                  <p className="text-slate-400 text-sm mb-1">All PDF Tools</p>
                  <h3 className="text-white text-2xl font-bold mb-6">
                    Pro Toolkit
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    {editorFeatures.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 hover:border-cyan-400/40 hover:bg-white/[0.06] transition"
                      >
                        <item.icon className="w-6 h-6 text-cyan-300 mb-3" />
                        <p className="text-white font-bold text-sm">{item.title}</p>
                        <p className="text-slate-500 text-xs mt-1">{item.desc}</p>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-green-400/20 bg-green-400/10 px-4 py-3">
                    <ShieldCheck className="w-4 h-4 text-green-300" />
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
                Abhi ZorPDF free hai. Jaldi hi premium users ke liye zyada file limit, faster conversion, priority support aur advanced PDF tools available honge.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-9">
                {[
                  { icon: UploadCloud, title: "More File Limit", desc: "Free se zyada files ek saath convert karo." },
                  { icon: Zap, title: "Faster Conversion", desc: "Premium users ke liye priority speed." },
                  { icon: ShieldCheck, title: "Secure Processing", desc: "Safe aur private document handling." },
                  { icon: Sparkles, title: "Advanced Tools", desc: "Future mein aur powerful PDF tools." },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 hover:border-yellow-400/40 hover:bg-white/[0.06] transition-all"
                  >
                    <item.icon className="w-6 h-6 text-yellow-300 mb-3" />
                    <h3 className="text-white font-bold mb-1">{item.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
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
                      <
