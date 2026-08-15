'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Zap, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizeMobile = (value: string) => {
    let number = value.replace(/\D/g, '');

    if (number.startsWith('91') && number.length === 12) {
      number = number.substring(2);
    }

    if (number.startsWith('0') && number.length === 11) {
      number = number.substring(1);
    }

    return number;
  };

  const handleLogin = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const cleanMobile = normalizeMobile(mobile);

      if (cleanMobile.length !== 10) {
        setError(
          'Please enter a valid 10-digit mobile number.'
        );
        return;
      }

      if (!password) {
        setError('Please enter your password.');
        return;
      }

      /*
       * Find account email using mobile number.
       */
      const {
        data: emailData,
        error: emailError,
      } = await supabase.rpc(
        'get_login_email_by_mobile',
        {
          p_mobile: cleanMobile,
        }
      );

      if (emailError) {
        console.error(
          'Mobile lookup error:',
          emailError
        );

        setError(
          'Unable to find your account. Please try again.'
        );

        return;
      }

      if (!emailData) {
        setError(
          'No account found with this mobile number.'
        );

        return;
      }

      /*
       * Supabase Auth login.
       */
      const {
        data: loginData,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: emailData,
        password,
      });

      if (loginError || !loginData.user) {
        console.error(
          'Login error:',
          loginError
        );

        setError(
          'Invalid mobile number or password.'
        );

        return;
      }

      /*
       * Load profile.
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select(
          'id, is_admin, is_banned'
        )
        .eq('id', loginData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          'Profile check error:',
          profileError
        );

        await supabase.auth.signOut();

        setError(
          'Unable to verify your account. Please try again.'
        );

        return;
      }

      /*
       * Block banned users.
       */
      if (profile?.is_banned === true) {
        await supabase.auth.signOut();

        setError(
          'Your account has been blocked. Please contact support.'
        );

        return;
      }

      /*
       * ADMIN
       */
      if (profile?.is_admin === true) {
        router.replace('/admin9415');
        return;
      }

      /*
       * CUSTOMER
       */
      router.replace('/');
    } catch (error) {
      console.error(
        'Login exception:',
        error
      );

      setError(
        'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-12">

      <div className="w-full max-w-md">

        {/* Logo */}

        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
            <Zap className="h-7 w-7 fill-white text-white" />
          </div>
        </div>

        {/* Heading */}

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            ZorPDF
          </h1>

          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            Welcome back
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Sign in to your account
          </p>
        </div>

        {/* Login Card */}

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">

          <form
            onSubmit={handleLogin}
            className="flex flex-col gap-5"
          >

            {/* Mobile */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="mobile"
                className="text-sm font-medium text-slate-700"
              >
                Mobile Number
              </label>

              <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-slate-50 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">

                <div className="flex items-center border-r border-slate-200 bg-slate-100 px-3 text-sm font-medium text-slate-600">
                  +91
                </div>

                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                    )
                  }
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  required
                  disabled={loading}
                  className="h-11 w-full bg-transparent px-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 disabled:bg-slate-100"
                />

              </div>
            </div>

            {/* Password */}

            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>

              </div>
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Login Button */}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

          </form>

          {/* Signup */}

          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-sm text-slate-500">
            Don't have an account?{' '}

            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Sign up
            </Link>
          </div>

        </div>

        {/* Back */}

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link
            href="/"
            className="hover:text-slate-600"
          >
            ← Back to ZorPDF
          </Link>
        </p>

      </div>
    </main>
  );
}
