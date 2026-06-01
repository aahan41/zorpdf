'use client';

import { motion } from 'framer-motion';
import { Zap, Mail, ArrowUp, Github, Twitter, Linkedin } from 'lucide-react';

const footerLinks = {
  Tools: [
    { label: 'JPG to PDF', href: '#tools' },
    { label: 'PDF to JPG', href: '#tools' },
    { label: 'Word to PDF', href: '#tools' },
    { label: 'PDF to Word', href: '#tools' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Contact', href: '#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
    { label: 'GDPR', href: '#' },
  ],
};

const socials = [
  { icon: Twitter, label: 'Twitter' },
  { icon: Github, label: 'GitHub' },
  { icon: Linkedin, label: 'LinkedIn' },
];

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const handleLinkClick = (href: string) => {
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="contact" className="relative border-t border-white/5 mt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#030710] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Zor<span className="text-blue-400">PDF</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              The fastest, most secure online file converter. Convert any file format in seconds — free, forever.
            </p>
            {/* Contact */}
            <a
              href="mailto:hello@zorpdf.com"
              className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors text-sm group"
            >
              <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" />
              hello@zorpdf.com
            </a>
            {/* Socials */}
            <div className="flex items-center gap-3 mt-5">
              {socials.map((s) => (
                <button
                  key={s.label}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-blue-500/40 hover:bg-blue-600/10 transition-all"
                >
                  <s.icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-slate-400 hover:text-white text-sm transition-colors hover:translate-x-0.5 inline-block transform duration-200"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center gap-4 mb-10 py-6 border-t border-white/5">
          {['SSL Secured', 'GDPR Compliant', 'Auto-Delete Files', '100% Free'].map((badge) => (
            <span key={badge} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass border border-white/8 text-slate-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              {badge}
            </span>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/5">
          <p className="text-slate-600 text-sm">
            &copy; 2025 ZorPDF. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-slate-600 text-sm">Made with care for creators everywhere</span>
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-600/25 hover:border-blue-500/40 transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
