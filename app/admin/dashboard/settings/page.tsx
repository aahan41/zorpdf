"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SettingsPage() {
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
        <h1 className="text-2xl font-semibold mb-2">Site Settings</h1>
        <p className="text-gray-400 text-sm mb-8">File size limits aur tools manage karo</p>

        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <h3 className="font-medium text-white mb-1">Max File Size</h3>
            <p className="text-xs text-gray-400 mb-3">Upload limit set karo</p>
            <select className="bg-[#0d1117] border border-[#30363d] text-white text-sm rounded-lg px-3 py-2">
              <option>10 MB</option>
              <option selected>50 MB</option>
              <option>100 MB</option>
            </select>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <h3 className="font-medium text-white mb-1">Tools Enable/Disable</h3>
            <p className="text-xs text-gray-400 mb-3">Kaunsa tool available ho</p>
            <div className="space-y-2">
              {["JPG to PDF", "PDF to JPG", "PNG to PDF", "Word to PDF", "PDF to Word", "PDF Compressor"].map(tool => (
                <div key={tool} className="flex items-center justify-between py-2 border-b border-[#30363d]">
                  <span className="text-sm text-gray-300">{tool}</span>
                  <div className="w-10 h-5 bg-blue-600 rounded-full cursor-pointer"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
