'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const handleSignup = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const cleanName = fullName.trim();
      const cleanMobile = normalizeMobile(mobile);
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName) {
        setError('Please enter your full name.');
        return;
      }

      if (cleanMobile.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }

      if (password.length < 6) {
        setError(
          'Password must be at least 6 characters long.'
        );
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      /*
       * STEP 1
       * Check whether this mobile number already exists.
       *
       * This prevents an existing customer from accidentally
       * creating another account with the same mobile number.
       */
      const { data: existingMobile, error: mobileError } =
        await supabase
          .from('profiles')
          .select('id, email, mobile')
          .eq('mobile', cleanMobile)
          .maybeSingle();

      if (mobileError) {
        console.error('Mobile check error:', mobileError);

        setError(
          'Unable to verify this mobile number. Please try again.'
        );

        return;
      }

      if (existingMobile) {
        setError(
          'An account with this mobile number already exists. Please sign in instead.'
        );

        return;
      }

      /*
       * STEP 2
       * Check whether the email already exists in profiles.
       */
      const { data: existingEmail, error: emailCheckError } =
        await supabase
          .from('profiles')
          .select('id, email')
          .ilike('email', cleanEmail)
          .maybeSingle();

      if (emailCheckError) {
        console.error(
          'Email check error:',
          emailCheckError
        );

        setError(
          'Unable to verify this email address. Please try again.'
        );

        return;
      }

      if (existingEmail) {
        setError(
          'An account with this email already exists. Please sign in instead.'
        );

        return;
      }

      /*
       * STEP 3
       * Create the Supabase Auth account.
       */
      const {
        data: authData,
        error: signupError,
      } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            mobile: cleanMobile,
          },
        },
      });

      if (signupError) {
        console.error('Signup error:', signupError);

        if (
          signupError.message
            .toLowerCase()
            .includes('already registered')
        ) {
          setError(
            'An account with this email already exists. Please sign in instead.'
          );
        } else {
          setError(
            signupError.message ||
              'Unable to create your account. Please try again.'
          );
        }

        return;
      }

      if (!authData.user) {
        setError(
          'Account creation failed. Please try again.'
        );

        return;
      }

      /*
       * STEP 4
       * Create/update the profile.
       *
       * The authenticated user's ID is always used as
       * the profile identity.
       */
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: authData.user.id,
            full_name: cleanName,
            email: cleanEmail,
            mobile: cleanMobile,
          },
          {
            onConflict: 'id',
          }
        );

      if (profileError) {
        console.error(
          'Profile creation error:',
          profileError
        );

        /*
         * Do NOT delete the Auth user automatically.
         *
         * Automatic deletion from the client is unsafe.
         * The account remains available and can be repaired
         * from the database if necessary.
         */
        setError(
          'Your account was created, but your profile could not be completed. Please contact support.'
        );

        return;
      }

      /*
       * STEP 5
       * If email confirmation is enabled in Supabase,
       * session will be null.
       */
      if (!authData.session) {
        setSuccess(
          'Account created successfully. Please verify your email, then sign in.'
        );

        setTimeout(() => {
          router.replace('/login');
        }, 1800);

        return;
      }

      /*
       * If email confirmation is disabled,
       * user is already logged in.
       */
      setSuccess(
        'Account created successfully. Redirecting...'
      );

      setTimeout(() => {
        router.replace('/');
      }, 800);
    } catch (error) {
      console.error('Signup exception:', error);

      setError(
        'Something went wrong while creating your account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 py-10">
      <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
        <div className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold backdrop-blur">
              Z
            </div>

            <h1 className="text-2xl font-bold">
              Create Account
            </h1>

            <p className="mt-2 text-sm text-blue-100">
              Create your ZorPDF account
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {success}
              </div>
            )}

            <form
              onSubmit={handleSignup}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) =>
                    setFullName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={loading}
                />
              </div>

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
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="Enter your email"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  disabled={loading}
                />
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
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Create a password"
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

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm Password
                </label>

                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-blue-600"
                    disabled={loading}
                  >
                    {showConfirmPassword
                      ? 'Hide'
                      : 'Show'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'Creating Account...'
                  : 'Create Account'}
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
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Sign In
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
