"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) {
      router.push("/admin");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("zorpdf_admin");
    router.push("/admin");
  };

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <nav className="border-b border-[#30363d] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-white font-semibold">Zor<span className="text-blue-400">PDF</span></span>
          <span className="ml-2 text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">Admin Panel</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-red-400 transition border border-[#30363d] px-3 py-1.5 rounded-lg">
          Logout
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Welcome, Admin</h1>
        <p className="text-gray-400 text-sm mb-8">ZorPDF ka pura control yahan hai</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: "—", icon: "👤" },
            { label: "Conversions Today", value: "—", icon: "🔄" },
            { label: "Files Processed", value: "—", icon: "📄" },
            { label: "Active Sessions", value: "—", icon: "🟢" },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-xl font-semibold text-white">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <h2 className="text-lg font-medium mb-4">Admin Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/dashboard/users">
            <div className="bg-[#161b22] border border-[#30363d] hover:border-blue-700 rounded-xl p-5 cursor-pointer transition group">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-medium text-white group-hover:text-blue-400 transition mb-1">Users Manage karo</h3>
              <p className="text-xs text-gray-400">Sab registered users dekho, block/unblock karo</p>
            </div>
          </Link>
          <Link href="/admin/dashboard/logs">
            <div className="bg-[#161b22] border border-[#30363d] hover:border-blue-700 rounded-xl p-5 cursor-pointer transition group">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-medium text-white group-hover:text-blue-400 transition mb-1">Conversions Log</h3>
              <p className="text-xs text-gray-400">Kaunsi file kab convert hui, details dekho</p>
            </div>
          </Link>
          <Link href="/admin/dashboard/settings">
            <div className="bg-[#161b22] border border-[#30363d] hover:border-blue-700 rounded-xl p-5 cursor-pointer transition group">
              <div className="text-3xl mb-3">⚙️</div>
              <h3 className="font-medium text-white group-hover:text-blue-400 transition mb-1">Site Settings</h3>
              <p className="text-xs text-gray-400">File size limits, tools enable/disable karo</p>
            </div>
          </Link>
        </div>

        <div className="mt-8 border-t border-[#30363d] pt-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition">← Main site par wapas jao</Link>
        </div>
      </div>
    </div>
  );
}
