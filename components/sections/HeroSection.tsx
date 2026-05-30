'use client';

import { motion } from 'framer-motion';
import { ArrowDown, Sparkles, Shield, Clock } from 'lucide-react';

const badges = [
  { icon: Clock, label: 'Lightning Fast' },
  { icon: Shield, label: 'Bank-Level Secure' },
  { icon: Sparkles, label: 'Free Forever' },
];

export default function HeroSection() {
  const scrollToTools = () => {
    document.querySelector('#tools')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToUpload = () => {
    document.querySelector('#upload')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-grid">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="animate-pulse-glow absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="animate-pulse-glow absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/8 blur-[100px]" style={{ animationDelay: '2s' }} />
        <div className="animate-float absolute top-20 right-16 w-[200px] h-[200px] rounded-full bg-blue-700/6 blur-[60px]" />
        <div className="animate-float-delayed absolute bottom-20 left-16 w-[150px] h-[150px] rounded-full bg-blue-400/8 blur-[50px]" />
      </div>

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-[#050913] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-glow mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-slate-300 font-medium">Trusted by 10M+ users worldwide</span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight mb-6"
        >
          <span className="text-white">Convert Any File</span>
          <br />
          <span className="text-gradient">in Seconds</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Fast, secure and free online converter tools. Transform your files instantly — no signup, no limits, no watermarks.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
        >
          <motion.button
            onClick={scrollToUpload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-white shadow-xl shadow-blue-900/40 min-w-[200px]"
          >
            Start Converting
          </motion.button>
          <motion.button
            onClick={scrollToTools}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-semibold text-slate-300 hover:text-white glass border-glow transition-all min-w-[200px]"
          >
            Explore Tools
          </motion.button>
        </motion.div>

        {/* Trust badges row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-6 mb-16"
        >
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-slate-400">
              <badge.icon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.button
          onClick={scrollToTools}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors mx-auto"
        >
          <span className="text-xs font-medium uppercase tracking-wider">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-5 h-5" />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
