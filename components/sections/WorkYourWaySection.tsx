import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileImage,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

export default function WorkYourWaySection() {
  return (
    <section className="relative overflow-hidden bg-[#050913] px-4 sm:px-6 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.22),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(234,179,8,0.16),transparent_35%),radial-gradient(circle_at_50%_90%,rgba(14,165,233,0.14),transparent_35%)]" />

      <div className="relative max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-4 py-2 text-blue-300 text-sm font-bold mb-6">
              <Sparkles className="w-4 h-4" />
              Smart PDF Workspace
            </div>

            <h2 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
              Ek hi jagah par{" "}
              <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-yellow-300 bg-clip-text text-transparent">
                sabhi PDF tools
              </span>
            </h2>

            <p className="text-slate-400 text-lg leading-relaxed mb-8 max-w-xl">
              ZorPDF ko daily document work ke liye design kiya gaya hai —
              image merge, PDF convert, compression aur mixed file workflow sab
              ek clean premium interface mein.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              {[
                ["Mixed File Merge", "PDF + JPG + PNG ek saath"],
                ["Clean Output", "Professional document result"],
                ["Fast Workflow", "Upload, reorder, convert"],
                ["No Signup Needed", "Free tools instantly use karo"],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                >
                  <div className="flex items-center gap-2 text-white font-bold mb-1">
                    <BadgeCheck className="w-5 h-5 text-green-400" />
                    {title}
                  </div>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              ))}
            </div>

            <Link
              href="/#tools"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-900/30"
            >
              Tools Start Karo
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative rounded-[32px] border border-blue-400/20 bg-[#0b1120]/90 p-5 shadow-2xl shadow-blue-950/30">
              <div className="rounded-[26px] border border-white/10 bg-[#111827] overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <p className="text-slate-400 text-sm">ZorPDF Workspace</p>
                </div>

                <div className="p-5 grid gap-4">
                  <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-5">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-slate-400 text-sm">Current Tool</p>
                        <h3 className="text-white text-2xl font-bold">
                          JPG + PDF Merge
                        </h3>
                      </div>
                      <Layers className="w-10 h-10 text-blue-300" />
                    </div>

                    <div className="h-28 rounded-xl border-2 border-dashed border-blue-400/30 bg-[#050913]/60 flex items-center justify-center">
                      <p className="text-slate-300 text-sm">
                        Drag & drop files here
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      { icon: FileImage, title: "Images", value: "JPG / PNG" },
                      { icon: FileText, title: "PDF", value: "Multi Pages" },
                      { icon: Zap, title: "Speed", value: "Instant" },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <item.icon className="w-6 h-6 text-yellow-300 mb-3" />
                        <p className="text-white font-bold">{item.title}</p>
                        <p className="text-slate-500 text-xs">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-green-400/20 bg-green-500/10 p-4 flex items-center gap-3">
                    <ShieldCheck className="w-7 h-7 text-green-400" />
                    <div>
                      <p className="text-white font-bold">Secure Processing</p>
                      <p className="text-slate-400 text-sm">
                        Files safely processed for conversion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -right-5 -bottom-5 hidden sm:block rounded-2xl border border-yellow-400/30 bg-yellow-400 px-5 py-4 text-black shadow-xl">
                <p className="text-sm font-bold">Premium Ready</p>
                <p className="text-xs">Future upgrades supported</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
