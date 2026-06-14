"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UsersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) router.push("/admin");
    else setAuthorized(true);
  }, [router]);

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
          <span className="font-semibold">Zor<span className="text-blue-400">PDF</span></span>
          <span className="ml-2 text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">Admin Panel</span>
        </div>
        <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition border border-[#30363d] px-3 py-1.5 rounded-lg">
          ← Dashboard
        </Link>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Users Manage karo</h1>
        <p className="text-gray-400 text-sm mb-8">Sab registered users ki list</p>
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-gray-400 text-sm">Abhi koi users registered nahi hain.</p>
        </div>
      </div>
    </div>
  );
}
