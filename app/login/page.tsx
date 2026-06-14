'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (phone.length !== 10) {
      setError('Valid 10 digit mobile number daalo');
      return;
    }

    setLoading(true);

    const formattedPhone = `+91${phone}`;

    // Phone number se email dhundo
    const { data: emailData, error: lookupError } = await supabase.rpc('get_email_by_phone', {
      phone_input: formattedPhone,
    });

    if (lookupError || !emailData) {
      setError('Is mobile number se koi account nahi mila');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email: emailData, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#050913] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-bold text-white">
              Zor<span className="text-blue-400">PDF</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Mobile Number</label>
              <div className="flex gap-2">
                <div className="h-11 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm flex items-center">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  required
                  maxLength={10}
                  className="flex-1 h-11 px-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full h-11 px-4 pr-11 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/8 text-center text-sm text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Sign up
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          <Link href="/" className="hover:text-slate-400 transition-colors">
            ← Back to ZorPDF
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
