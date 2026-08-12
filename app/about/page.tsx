'use client';

import { motion } from 'framer-motion';
import { Zap, ShieldCheck, Gauge, Users, Sparkles } from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const values = [
  {
    icon: Gauge,
    title: 'Speed First',
    desc: 'Every tool is built to convert, compress and process files in seconds, not minutes.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy by Design',
    desc: 'Files are processed and deleted automatically — we never store or share your documents.',
  },
  {
    icon: Sparkles,
    title: 'Simple & Free',
    desc: 'No clutter, no confusing menus. Just upload, convert, and download — free for everyone.',
  },
  {
    icon: Users,
    title: 'Built for Everyone',
    desc: 'From students to professionals, ZorPDF is designed to make document work effortless.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <Zap className="w-3.5 h-3.5 fill-blue-600" />
                About ZorPDF
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                Document tools that get out of your way
              </h1>

              <p className="mt-5 text-lg text-slate-500
