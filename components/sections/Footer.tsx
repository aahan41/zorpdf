import Link from 'next/link';
import { Zap, Globe2, Play, Facebook, Instagram } from 'lucide-react';

const footerLinks = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/#features' },
      { label: 'Tools', href: '/#tools' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'ZorPDF Desktop', href: '/' },
      { label: 'ZorPDF Mobile', href: '/' },
    ],
  },
  {
    title: 'SOLUTIONS',
    links: [{ label: 'Education', href: '/#features' }],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-conditions' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

const socialLinks = [
  { label: 'Facebook', href: '#', icon: Facebook },
  { label: 'Instagram', href: '#', icon: Instagram },
];

export default function Footer() {
  return (
    <footer className="bg-[#050913] px-4 sm:px-6 pt-14 pb-8">
      <div className="max-w-7xl mx-auto rounded-3xl border border-blue-500/20 bg-[#0b1120] overflow-hidden shadow-2xl shadow-blue-950/20">
        <div className="px-6 sm:px-8 lg:px-10 py-8 lg:py-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
            <div className="col-span-2 md:col-span-3 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-900/30">
                  <Zap className="w-5 h-5 text-white fill-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Zor<span className="text-blue-400">PDF</span>
                </span>
              </Link>

              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Fast, secure and professional PDF tools for everyday document conversion.
              </p>
            </div>

            {footerLinks.map((group) => (
              <div key={group.title}>
                <h3 className="text-white font-bold text-xs uppercase tracking-wider mb-4">
                  {group.title}
                </h3>

                <ul className="space-y-3">
                  {group.links.map((link) => (
                    <li key={`${group.title}-${link.label}`}>
                      <Link
                        href={link.href}
                        className="text-slate-400 hover:text-white text-[14px] transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-9 pt-7 border-t border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-white hover:bg-white/5 transition-colors">
                <Globe2 className="w-4 h-4" />
                English
              </button>

              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    aria-label={social.label}
                    className="w-9 h-9 rounded-xl border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-400/40 hover:bg-blue-500/10 transition-all"
                  >
                    <social.icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <a
                href="#"
                className="inline-flex items-center gap-3 rounded-2xl border border-blue-500/30 px-4 py-2.5 text-white hover:border-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                <Play className="w-6 h-6 fill-white" />
                <span className="leading-none">
                  <span className="block text-[10px] uppercase tracking-wide text-slate-300">
                    Get it on
                  </span>
                  <span className="block text-base font-semibold">
                    Google Play
                  </span>
                </span>
              </a>

              <p className="text-slate-400 text-sm whitespace-nowrap">
                © 2026 ZorPDF. All Rights Reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
