'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Zap,
  Globe,
  ChevronDown,
  Clock,
  Lock,
  Star,
  Infinity as InfinityIcon,
  Play,
} from 'lucide-react';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFDD55" />
          <stop offset="25%" stopColor="#FF543E" />
          <stop offset="50%" stopColor="#C837AB" />
          <stop offset="75%" stopColor="#8134AF" />
          <stop offset="100%" stopColor="#5B34AF" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-gradient)" />
      <rect x="2" y="2" width="20" height="20" rx="5.5" stroke="none" />
      <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
      <circle cx="17.15" cy="6.85" r="1.15" fill="white" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.5 6.2s-.23-1.64-.94-2.36c-.9-.95-1.9-.95-2.36-1.01C16.9 2.5 12 2.5 12 2.5h-.01s-4.89 0-8.19.33c-.46.06-1.46.06-2.36 1.01C.73 4.56.5 6.2.5 6.2S.26 8.12.26 10.04v1.8c0 1.92.24 3.84.24 3.84s.23 1.64.94 2.36c.9.95 2.08.92 2.6 1.02 1.89.18 8.02.33 8.02.33s4.9-.01 8.2-.34c.46-.06 1.46-.06 2.36-1.01.71-.72.94-2.36.94-2.36s.24-1.92.24-3.84v-1.8c0-1.92-.24-3.84-.24-3.84z"
        fill="#FF0000"
      />
      <path d="M9.6 14.6V7.4l6.3 3.6-6.3 3.6z" fill="white" />
    </svg>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" fill="#25D366" />
      <path
        d="M12.02 5.5c-3.6 0-6.52 2.92-6.52 6.52 0 1.15.3 2.27.87 3.26L5.5 18.5l3.32-.87a6.5 6.5 0 0 0 3.2.84h.01c3.6 0 6.52-2.92 6.52-6.52 0-1.74-.68-3.38-1.91-4.61a6.48 6.48 0 0 0-4.62-1.84zm0 11.93h-.01a5.4 5.4 0 0 1-2.76-.75l-.2-.12-2.05.54.55-2-.13-.21a5.4 5.4 0 0 1-.83-2.87c0-2.99 2.44-5.43 5.44-5.43 1.45 0 2.82.57 3.84 1.6a5.4 5.4 0 0 1 1.59 3.84c0 3-2.44 5.4-5.44 5.4z"
        fill="white"
      />
      <path
        d="M14.4 13.15c-.16-.08-.94-.46-1.09-.52-.15-.05-.25-.08-.36.08-.1.16-.4.51-.5.62-.09.1-.18.11-.34.04-.16-.08-.68-.25-1.29-.79-.48-.42-.8-.95-.89-1.11-.09-.16-.01-.25.07-.33.07-.07.16-.18.24-.27.08-.09.1-.16.16-.26.05-.1.02-.19-.01-.27-.04-.08-.36-.86-.49-1.18-.13-.31-.26-.27-.36-.27-.09-.01-.2-.01-.3-.01s-.27.04-.42.19c-.14.16-.55.53-.55 1.3s.56 1.51.64 1.62c.08.1 1.1 1.68 2.67 2.35.37.16.66.26.89.33.37.12.71.1.98.06.3-.04.94-.38 1.07-.75.13-.37.13-.68.09-.75-.04-.06-.14-.1-.3-.18z"
        fill="white"
      />
    </svg>
  );
}

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
      { label: 'ZorPDF Desktop', href: '/desktop' },
      { label: 'ZorPDF Mobile', href: '/mobile' },
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
    <footer className="relative mt-12 overflow-hidden bg-blue-50">
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
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 text-slate-700 hover:border-blue-200 hover:text-blue-700 transition-colors text-sm whitespace-nowrap">
              <Globe className="w-4 h-4 text-blue-600" />
              English
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div className="flex items-center gap-2.5">
              <motion.a
                href="https://www.instagram.com/mr_aahan41/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Instagram"
                className="w-11 h-11 rounded-lg bg-white border border-blue-100 flex items-center justify-center hover:border-blue-200 transition-colors overflow-hidden"
              >
                <InstagramIcon className="w-8 h-8" />
              </motion.a>
              <motion.a
                href="https://www.youtube.com/@Zorsolution"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="YouTube"
                className="w-11 h-11 rounded-lg bg-white border border-blue-100 flex items-center justify-center hover:border-blue-200 transition-colors"
              >
                <YoutubeIcon className="w-8 h-8" />
              </motion.a>
              <motion.a
                href="https://chat.whatsapp.com/HOFrjjDN93WGh6FdAZtwMA"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                aria-label="WhatsApp"
                className="w-11 h-11 rounded-lg bg-white border border-blue-100 flex items-center justify-center hover:border-blue-200 transition-colors"
              >
                <WhatsappIcon className="w-8 h-8" />
              </motion.a>
            </div>
          </div>

          {/* Center: Stats + Google Play Badge — single line, never wraps */}
          <div className="flex-1 min-w-0 overflow-x-auto">
            <div className="flex items-center justify-center gap-4 sm:gap-6 flex-nowrap w-max mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col items-center text-center flex-shrink-0">
                  <div className="w-7 h-7 rounded-full bg-white border border-blue-100 flex items-center justify-center mb-1">
                    <stat.icon className="w-3.5 h-3.5 text-blue-600" strokeWidth={1.5} />
                  </div>
                  <span className="text-slate-900 font-bold text-xs sm:text-sm leading-tight whitespace-nowrap">{stat.value}</span>
                  <span className="text-slate-500 text-[10px] leading-tight mt-0.5 whitespace-nowrap">{stat.label}</span>
                </div>
              ))}

              <a
                href="#"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-blue-100 hover:border-blue-200 transition-colors whitespace-nowrap flex-shrink-0"
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
