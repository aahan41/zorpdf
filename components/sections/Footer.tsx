import Link from 'next/link';
import {
  Zap,
  Globe2,
  Play,
  Facebook,
  Instagram,
  Clock3,
  LockKeyhole,
  Star,
  Infinity,
} from 'lucide-react';

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

const stats = [
  {
    value: '< 3s',
    label: 'Avg. Conversion Time',
    icon: Clock3,
  },
  {
    value: '256-bit',
    label: 'SSL Encryption',
    icon: LockKeyhole,
  },
  {
    value: '4.9/5',
    label: 'User Rating',
    icon: Star,
  },
  {
    value: 'Unlimited',
    label: 'Daily Conversions',
    icon: Infinity,
  },
];

export default function Footer() {
  return (
    <footer className="w-full px-6 pb-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-blue-500/30 bg-[#080f20] px-8 py-8">
        
        {/* Main Footer */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.3fr_repeat(5,1fr)]">
          
          {/* Brand */}
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
                <Zap className="h-6 w-6 fill-white text-white" />
              </div>

              <span className="text-xl font-bold">
                <span className="text-white">Zor</span>
                <span className="text-blue-500">PDF</span>
              </span>
            </div>

            <p className="max-w-[180px] text-sm leading-6 text-slate-400">
              Fast, secure and professional PDF tools for everyday document
              conversion.
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-white">
                {group.title}
              </h3>

              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom divider */}
        <div className="my-6 h-px bg-white/10" />

        {/* Compact Bottom Section */}
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

          {/* Language + Social */}
          <div className="flex items-center gap-3">
            <button className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/20 px-4 text-sm font-medium text-white transition-colors hover:bg-white/5">
              <Globe2 className="h-4 w-4" />
              English
            </button>

            <div className="flex items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition-all hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-white"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Stats - compact */}
          <div className="flex items-center justify-center">
            {stats.map((stat, index) => (
              <div
                key={stat.value}
                className={`flex min-w-[105px] flex-col items-center px-4 text-center ${
                  index !== 0 ? 'border-l border-white/10' : ''
                }`}
              >
                <stat.icon className="mb-1 h-5 w-5 text-blue-400" />

                <span className="text-base font-bold leading-tight text-white">
                  {stat.value}
                </span>

                <span className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Google Play + Copyright */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-blue-500/30 px-4 text-white transition-colors hover:border-blue-400 hover:bg-blue-500/10"
            >
              <Play className="h-5 w-5 fill-white" />

              <span className="leading-none">
                <span className="block text-[9px] uppercase tracking-wide text-slate-300">
                  Get it on
                </span>

                <span className="block text-base font-semibold">
                  Google Play
                </span>
              </span>
            </a>

            <p className="whitespace-nowrap text-xs text-slate-400">
              © 2026 ZorPDF. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
