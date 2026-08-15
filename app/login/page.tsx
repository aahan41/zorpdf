'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';

export default function LoginPage() {
  const router = useRouter();
  const { profile } = useAuth();

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

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const cleanMobile = normalizeMobile(mobile);

      if (cleanMobile.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      if (!password) {
        setError('Please enter your password.');
        return;
      }

      /*
       * The database function finds the email belonging
       * to this mobile number.
       *
       * Password authentication is still performed
       * securely by Supabase Auth.
       */
      const { data, error: lookupError } = await supabase.rpc(
        'get_login_email_by_mobile',
        {
          p_mobile: cleanMobile,
        }
      );

      if (lookupError) {
        console.error('Mobile lookup error:', lookupError);
        setError('Unable to find your account. Please try again.');
        return;
      }

      let email: string | null = null;

      if (typeof data === 'string') {
        email = data;
      } else if (Array.isArray(data)) {
        email = data[0]?.email ?? data[0] ?? null;
      } else if (data && typeof data === 'object') {
        email = data.email ?? null;
      }

      if (!email) {
        setError(
          'No account found with this mobile number. Please sign up first.'
        );
        return;
      }

      const {
        data: authData,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (loginError || !authData.user) {
        console.error('Login error:', loginError);
        setError('Invalid mobile number or password.');
        return;
      }

      /*
       * Load profile after successful authentication.
       * Profile identity is always based on Supabase user.id.
       */
      const { data: userProfile, error: profileError } =
        await supabase
          .from('profiles')
          .select(
            'id, full_name, email, mobile, is_admin, is_banned'
          )
          .eq('id', authData.user.id)
          .maybeSingle();

      if (profileError) {
        console.error('Profile error:', profileError);
      }

      if (userProfile?.is_banned === true) {
        await supabase.auth.signOut();
        setError(
          'Your account has been disabled. Please contact support.'
        );
        return;
      }

      /*
       * Admins are allowed to use the normal login.
       * They will be redirected to /admin.
       */
      if (userProfile?.is_admin === true) {
        router.replace('/admin');
        return;
      }

      router.replace('/');
    } catch (error) {
      console.error('Login exception:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /*
   * If the auth context already has a profile, the page
   * can still remain usable. We intentionally do not
   * automatically redirect here because this avoids
   * redirect loops during auth initialization.
   */
  void profile;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">
              Z
            </div>

            <h1 className="text-2xl font-bold">
              Welcome Back
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Sign in to your ZorPDF account
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="mobile"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mobile Number
                </label>

                <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <div className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600">
                    +91
                  </div>

                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) =>
                      setMobile(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 10)
                      )
                    }
                    placeholder="Enter mobile number"
                    className="w-full bg-transparent px-4 py-3 outline-none"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600"
                    disabled={loading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                OR
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <p className="text-center text-sm text-slate-600">
              Don't have an account?{' '}
              <Link
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Create Account
              </Link>
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-sm text-slate-500 hover:text-blue-600"
              >
                ← Back to ZorPDF
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
