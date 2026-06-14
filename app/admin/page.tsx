"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_PHONE = "+919415066641";
const ADMIN_PASSWORD = "Irshad@2026";

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const formattedPhone = `+91${phone}`;

    if (formattedPhone === ADMIN_PHONE && password === ADMIN_PASSWORD) {
      localStorage.setItem("zorpdf_admin", "true");
      router.push("/admin/dashboard");
    } else {
      setError("Galat number ya password. Sirf admin access kar sakta hai.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-white text-xl font-semibold">
          Zor<span className="text-blue-400">PDF</span>
        </span>
        <span className="ml-2 text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">
          Admin
        </span>
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-white text-2xl font-semibold mb-1">Admin Login</h1>
        <p className="text-gray-400 text-sm mb-6">
          Sirf authorized admins yahan access kar sakte hain
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Admin Mobile Number</label>
            <div className="flex gap-2">
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white text-sm flex items-center">
                +91
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="9876543210"
                required
                maxLength={10}
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-800 rounded-lg px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition text-sm"
          >
            {loading ? "Checking..." : "Admin Sign In"}
          </button>
        </form>

        <div className="border-t border-[#30363d] mt-6 pt-4 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition">
            ← Back to ZorPDF
          </Link>
        </div>
      </div>
    </div>
  );
}
