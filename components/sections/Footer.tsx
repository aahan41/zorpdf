'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  Globe,
  ChevronDown,
  Facebook,
  Instagram,
  Clock,
  Lock,
  Star,
  Infinity as InfinityIcon,
  Play,
} from 'lucide-react';

const footerColumns = [
  {
    title: 'Product',
    links: [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/#features' },
      { label: 'FAQ', href: '/#faq' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'ZorPDF Desktop', href: '#' },
      { label: 'ZorPDF Mobile', href: '#' },
    ],
  },
  {
    title: 'Solutions',
    links: [{ label: 'Education', href: '#' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Security', href: '/security' },
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-and-conditions' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
];

const stats = [
  { icon: Clock, value: '< 3s', label: 'Avg. Conversion Time' },
  { icon: Lock, value: '256-bit', label: 'SSL Encryption' },
  { icon: Star, value: '4.9/5', label: 'User Rating' },
  { icon: InfinityIcon, value: 'Unlimited', label: 'Daily Conversions' },
];

export default function Footer() {
  const handleLinkClick = (href: string) => {
    if (href.startsWith('/#')) {
      const id = href.slice(2);
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="relative mt-12 overflow-hidden bg-gradient-to-b from-white via-blue-50/40 to-blue-50/70">
      {/* Soft background accents — matching hero section */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-50 blur-2xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-14 pb-8">
        {/* Top: Brand + Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-8 mb-10">
          {/* Brand / Tagline */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-slate-900">Zor</span>
                <span className="text-blue-600">PDF</span>
              </span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-[240px]">
              Fast, secure and professional PDF tools for everyday document conversion.
            </p>
            <a
              href="mailto:support@zorpdf.com"
              className="inline-block text-blue-600 hover:text-blue-700 text-sm font-medium mt-3 transition-colors"
            >
              support@zorpdf.com
            </a>
          </div>

          {/* Five Link Columns */}
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="text-slate-900 font-bold text-xs uppercase tracking-wider mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => {
                  const isRoute = link.href.startsWith('/') && !link.href.startsWith('/#');
                  return (
                    <li key={link.label}>
                      {isRoute ? (
                        <Link
                          href={link.href}
                          className="text-slate-500 hover:text-blue-600 text-sm transition-colors text-left"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleLinkClick(link.href)}
                          className="text-slate-500 hover:text-blue-600 text-sm transition-colors text-left"
                        >
                          {link.label}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-blue-100 mb-7" />

        {/* Bottom Row */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: Language + Social */}
          <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-start lg:flex-shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-slate-700 hover:border-blue-200 hover:text-blue-700 transition-colors text-sm whitespace-nowrap">
              <Globe className="w-4 h-4 text-blue-600" />
              English
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div className="flex items-center gap-2.5">
              <motion.a
                href="#"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Facebook"
                className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:border-blue-200 hover:text-blue-700 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Instagram"
                className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 hover:border-blue-200 hover:text-blue-700 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </motion.a>
            </div>
          </div>

          {/* Center: Stats + Google Play Badge — single line, never wraps */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            <div className="flex items-center justify-center lg:justify-center gap-6 flex-nowrap w-max mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-1.5">
                    <stat.icon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-slate-900 font-bold text-sm leading-tight whitespace-nowrap">{stat.value}</span>
                  <span className="text-slate-500 text-[11px] leading-tight mt-0.5 whitespace-nowrap">{stat.label}</span>
                </div>
              ))}

              <a
                href="#"
                className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-blue-50 border border-blue-100 hover:border-blue-200 transition-colors whitespace-nowrap flex-shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <Play className="w-3 h-3 text-white fill-white ml-0.5" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-slate-500 text-[9px] uppercase tracking-wide">Get it on</span>
                  <span className="text-slate-900 text-sm font-semibold">Google Play</span>
                </div>
              </a>
            </div>
          </div>

          {/* Right: Copyright */}
          <p className="text-slate-400 text-xs text-center lg:text-right whitespace-nowrap lg:flex-shrink-0">
            &copy; 2026 ZorPDF. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
