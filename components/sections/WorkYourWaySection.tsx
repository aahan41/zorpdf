import Link from "next/link";
import { Monitor, Smartphone, Briefcase, ArrowUpRight } from "lucide-react";

const cards = [
  {
    icon: Monitor,
    title: "Work offline with Desktop",
    desc: "ZorPDF Desktop se documents ko locally manage aur convert karo. Fast, private aur reliable.",
    href: "/",
  },
  {
    icon: Smartphone,
    title: "On-the-go with Mobile",
    desc: "Mobile par bhi PDF tools use karo. Images, PDFs aur documents ko quickly convert karo.",
    href: "/",
  },
  {
    icon: Briefcase,
    title: "Built for Work",
    desc: "Students, shops aur professionals ke liye simple PDF tools — daily work ke liye perfect.",
    href: "/#tools",
  },
];

export default function WorkYourWaySection() {
  return (
    <section className="bg-[#050913] px-4 sm:px-6 py-20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-blue-400 font-semibold text-sm mb-3">
            ZorPDF Solutions
          </p>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white">
            Work your way with ZorPDF
          </h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            Desktop, mobile aur business use ke liye fast, secure aur easy PDF tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group overflow-hidden rounded-3xl border border-blue-500/20 bg-[#0b1120] hover:border-blue-400/40 transition-all shadow-2xl shadow-blue-950/20"
            >
              <div className="h-48 bg-gradient-to-br from-blue-500/20 via-yellow-400/10 to-pink-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <card.icon className="w-12 h-12 text-blue-300" />
                </div>
              </div>

              <div className="p-7 bg-white/[0.03]">
                <h3 className="text-white text-xl font-bold mb-3">
                  {card.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  {card.desc}
                </p>

                <div className="flex justify-end">
                  <span className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ArrowUpRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
