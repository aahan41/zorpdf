'use client';

import { motion } from 'framer-motion';
import { Zap, Shield, UserX, Gift, Clock, Lock, Star, Infinity as InfinityIcon } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Convert files in seconds using our optimized cloud infrastructure. No waiting, no queue.',
    gradient: 'from-yellow-500/20 to-orange-600/20',
    iconGradient: 'from-yellow-500 to-orange-500',
    border: 'border-yellow-500/15',
  },
  {
    icon: Shield,
    title: 'Secure Files',
    description: 'All files are encrypted during upload and automatically deleted after conversion.',
    gradient: 'from-green-500/20 to-emerald-600/20',
    iconGradient: 'from-green-500 to-emerald-600',
    border: 'border-green-500/15',
  },
  {
    icon: UserX,
    title: 'No Signup',
    description: 'No account required. Just upload your file and convert — completely anonymous.',
    gradient: 'from-blue-500/20 to-cyan-600/20',
    iconGradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/15',
  },
  {
    icon: Gift,
    title: 'Free Forever',
    description: 'All tools are completely free to use. No hidden fees, no premium tiers, no limits.',
    gradient: 'from-pink-500/20 to-rose-600/20',
    iconGradient: 'from-pink-500 to-rose-500',
    border: 'border-pink-500/15',
  },
];

const stats = [
  { icon: Clock, value: '< 3s', label: 'Avg. Conversion Time' },
  { icon: Lock, value: '256-bit', label: 'SSL Encryption' },
  { icon: Star, value: '4.9/5', label: 'User Rating' },
  { icon: InfinityIcon, value: 'Unlimited', label: 'Daily Conversions' },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-900/10 blur-[80px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-glow mb-5">
            <span className="text-blue-400 text-sm font-medium">Why ZorPDF</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-5">
            Built for Speed & Privacy
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            We take file security seriously. Your files are processed and deleted — never stored or shared.
          </p>
        </motion.div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group card-hover glass-card rounded-2xl p-6 bg-gradient-to-br ${feature.gradient} ${feature.border}`}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconGradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-bold text-lg mb-3">{feature.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-3xl p-8 sm:p-10 border-glow"
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center mb-3 mx-auto">
                  <stat.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-slate-500 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
