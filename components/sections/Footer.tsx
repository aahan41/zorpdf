'use client';

import { motion } from 'framer-motion';
import { Zap, Mail, ArrowUp, Github, Twitter, Linkedin } from 'lucide-react';



 

 

const footerLinks = {
  Product: [
    { label: 'Home', href: '/' },
    { label: 'Tools', href: '#tools' },
    { label: 'Features', href: '#features' },
    { label: 'Contact', href: '#contact' },
  ],
  Tools: [
    { label: 'JPG to PDF', href: '#tools' },
    { label: 'PDF to JPG', href: '#tools' },
    { label: 'PNG to JPG', href: '#tools' },
    { label: 'PNG to PDF', href: '#tools' },
    { label: 'DOCX to PDF', href: '#tools' },
    { label: 'PDF to DOCX', href: '#tools' },
  ],
  Company: [
    { label: 'About Us', href: '#' },
    { label: 'Contact Us', href: '#contact' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms & Conditions', href: '#' },
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
    <footer id="contact" className="relative border-t border-white/5 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <span className="text-base font-bold text-white">
                Zor<span className="text-blue-400">PDF</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-3 max-w-[200px]">
              Fast, secure online file converter. Free, forever.
            </p>
            <a
              href="mailto:hello@zorpdf.com"
              className="flex items-center gap-1.5 text-slate-500 hover:text-blue-400 transition-colors text-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              hello@zorpdf.com
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => handleLinkClick(link.href)}
                      className="text-slate-500 hover:text-white text-xs transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/5">
          <p className="text-slate-600 text-xs">
            &copy; 2026 ZorPDF. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {socials.map((s) => (
              <button
                key={s.label}
                aria-label={s.label}
                className="w-7 h-7 rounded-lg glass border border-white/10 flex items-center justify-center text-slate-500 hover:text-white hover:border-blue-500/40 transition-all"
              >
                <s.icon className="w-3.5 h-3.5" />
              </button>
            ))}
            <motion.button
              onClick={scrollToTop}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="w-7 h-7 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 hover:bg-blue-600/20 transition-all"
              aria-label="Back to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
