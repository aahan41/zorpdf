"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LogsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [conversions, setConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"logs" | "conversions">("conversions");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) router.push("/admin");
    else { setAuthorized(true); fetchData(); }
  }, [router]);

  async function fetchData() {
    setLoading(true);
    const [logsRes, convRes] = await Promise.all([
      supabase.from("logs").select("*, profiles(full_name, email)").order("created_at", { ascending: false }).limit(100),
      supabase.from("conversions").select("*, profiles(full_name, email)").order("created_at", { ascending: false }).limit(100),
    ]);
    setLogs(logsRes.data || []);
    setConversions(convRes.data || []);
    setLoading(false);
  }

  async function clearLogs() {
    if (!confirm("Saare logs delete karne hain?")) return;
    await supabase.from("logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    fetchData();
  }

  const filteredLogs = logs.filter((l) =>
    (l.action || "").toLowerCase().includes(search.toLowerCase()) ||
    (l.profiles?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredConversions = conversions.filter((c) =>
    (c.tool_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.profiles?.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Navbar */}
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
        <button
          onClick={() => router.push("/admin/dashboard")}
          className="text-sm text-gray-400 hover:text-white transition border border-[#30363d] px-3 py-1.5 rounded-lg"
        >
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Activity Logs</h1>
            <p className="text-gray-400 text-sm">Conversions aur admin actions ka record</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 w-52 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={clearLogs}
              className="px-4 py-2 text-sm bg-red-800 hover:bg-red-700 rounded-lg transition"
            >
              🗑️ Clear Logs
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["conversions", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
                activeTab === tab
                  ? "bg-blue-600 text-white"
                  : "bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]"
              }`}
            >
              {tab === "conversions" ? `📊 Conversions (${conversions.length})` : `📋 Admin Logs (${logs.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : activeTab === "conversions" ? (
          filteredConversions.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-gray-400 text-sm">Abhi koi conversion nahi hui.</p>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#30363d] text-gray-400 text-left">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Tool Used</th>
                    <th className="px-5 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConversions.map((c) => (
                    <tr key={c.id} className="border-b border-[#30363d] hover:bg-[#1c2128] transition">
                      <td className="px-5 py-4">
                        <div className="font-medium">{c.profiles?.full_name || "Unknown"}</div>
                        <div className="text-gray-400 text-xs">{c.profiles?.email || c.user_id}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="bg-blue-900/40 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full text-xs">
                          {c.tool_name || "Unknown Tool"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400">
                        {new Date(c.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredLogs.length === 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
              <div className="text-4xl mb-4">📋</div>
              <p className="text-gray-400 text-sm">Koi admin logs nahi hain.</p>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#30363d] text-gray-400 text-left">
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#30363d] hover:bg-[#1c2128] transition">
                      <td className="px-5 py-4 text-gray-300">{log.action}</td>
                      <td className="px-5 py-4 text-gray-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
