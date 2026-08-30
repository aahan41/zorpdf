'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageCircle, MapPin, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import Navbar from '@/components/sections/Navbar';
import Footer from '@/components/sections/Footer';

const contactInfo = [
  {
    icon: Mail,
    title: 'Email Us',
    detail: 'support@zorpdf.com',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    detail: 'Mon–Fri, 9am–6pm',
  },
  {
    icon: MapPin,
    title: 'Based In',
    detail: 'Lucknow, India',
  },
];

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);

    // Simulated send — wire this up to an API route or email service later.
    await new Promise((resolve) => setTimeout(resolve, 900));

    setLoading(false);
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="pt-28 pb-20">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-blue-100/40 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-5 sm:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6 flex justify-center">
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </a>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
                <MessageCircle className="w-3.5 h-3.5" />
                Get in Touch
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
                We&apos;d love to hear from you
              </h1>

              <p className="mt-5 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                Questions, feedback, or found a bug? Send us a message and our team
                will get back to you as soon as possible.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-5 sm:px-8 mt-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Contact info column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-2 flex flex-col gap-4"
            >
              {contactInfo.map((c) => (
                <div key={c.title} className="glass-card rounded-2xl p-5 flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <c.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-slate-900 font-semibold text-sm">{c.title}</p>
                    <p className="text-slate-500 text-sm mt-0.5">{c.detail}</p>
                  </div>
                </div>
              ))}

              <div className="glass-card rounded-2xl p-5">
                <p className="text-slate-900 font-semibold text-sm mb-1.5">Response Time</p>
                <p className="text-slate-500 text-sm leading-relaxed">
                  We typically reply within 24 hours on business days.
                </p>
              </div>
            </motion.div>

            {/* Form column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-3"
            >
              <div className="glass-card rounded-2xl p-7 sm:p-8">
                {sent ? (
                  <div className="flex flex-col items-center text-center py-8">
                    <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-7 h-7 text-blue-600" />
                    </div>
                    <h3 className="text-slate-900 font-semibold text-lg">Message sent!</h3>
                    <p className="text-slate-500 text-sm mt-1.5 max-w-sm">
                      Thanks for reaching out — we&apos;ll get back to you shortly.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className="mt-6 text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Name</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-slate-700">Message</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="How can we help?"
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
                      />
                    </div>

                    {error && (
                      <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
