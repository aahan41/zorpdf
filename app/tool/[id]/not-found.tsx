'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050913] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6 mx-auto">
          <AlertCircle className="w-10 h-10 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-3">Tool Not Found</h1>
        <p className="text-slate-400 mb-8">The conversion tool you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/')}
          className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
