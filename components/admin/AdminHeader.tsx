"use client";

import Link from "next/link";

export default function AdminHeader() {
  const handleLogout = () => {
    localStorage.removeItem("zorpdf_admin");
    document.cookie = "zorpdf_admin=; path=/; max-age=0";
    window.location.href = "/admin";
  };

  return (
    <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
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

      <div className="flex items-center gap-4">
        <span className="flex items-center gap-2 text-green-400 text-sm">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Live
        </span>
        <Link
          href="/admin/dashboard"
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          🏠 Home
        </Link>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
}
