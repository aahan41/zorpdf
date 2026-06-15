"use client";

import { useRouter } from "next/navigation";

export default function AdminNavbar() {
  const router = useRouter();

  const handleLogout = async () => {
    router.push("/");
  };

  return (
    <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
      {/* Left: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-semibold">Zor<span className="text-blue-400">PDF</span></span>
        <span className="ml-2 text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">
          Admin Panel
        </span>
      </div>

      {/* Right: Live + Home + Logout */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm text-green-400 font-medium">Live</span>
        </div>

        <button
          onClick={() => router.push("/admin/dashboard")}
          className="flex items-center gap-2 text-sm font-medium bg-[#1f2937] hover:bg-[#374151] text-white px-4 py-2 rounded-lg transition"
        >
          🏠 Home
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
