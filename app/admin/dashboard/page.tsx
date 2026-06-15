"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversions: 0,
    totalTools: 0,
    enabledTools: 0,
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const channel = supabase
      .channel("realtime-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversions" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .on("postgres_changes", { event: "*", schema: "public", table: "logs" }, () => fetchStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchStats() {
    setLoading(true);
    try {
      const [usersRes, conversionsRes, toolsRes, logsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("conversions").select("*", { count: "exact", head: true }),
        supabase.from("tools").select("*"),
        supabase.from("logs").select("*").order("created_at", { ascending: false }).limit(5),
      ]);
      const tools = toolsRes.data || [];
      setStats({
        totalUsers: usersRes.count || 0,
        totalConversions: conversionsRes.count || 0,
        totalTools: tools.length,
        enabledTools: tools.filter((t: any) => t.is_enabled).length,
      });
      setRecentLogs(logsRes.data || []);
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });
      const { data: convData } = await supabase
        .from("conversions")
        .select("created_at")
        .gte("created_at", days[0]);
      const grouped = days.map((day) => ({
        day: day.slice(5),
        conversions: (convData || []).filter((c: any) => c.created_at.startsWith(day)).length,
      }));
      setChartData(grouped);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const handleLogout = () => {
    localStorage.removeItem("zorpdf_admin");
    document.cookie = "zorpdf_admin=; path=/; max-age=0";
    window.location.href = "/admin";
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
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
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Users", value: stats.totalUsers, color: "text-blue-400" },
          { label: "Total Conversions", value: stats.totalConversions, color: "text-green-400" },
          { label: "Total Tools", value: stats.totalTools, color: "text-purple-400" },
          { label: "Active Tools", value: stats.enabledTools, color: "text-yellow-400" },
        ].map((card) => (
          <div key={card.label} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
            <h3 className="text-gray-400 text-sm mb-2">{card.label}</h3>
            <p className={`text-4xl font-bold ${card.color}`}>
              {loading ? "..." : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">Conversions — Last 7 Days</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData}>
            <XAxis dataKey="day" stroke="#555" />
            <YAxis stroke="#555" allowDecimals={false} />
            <Tooltip contentStyle={{ background: "#161b22", border: "1px solid #30363d" }} />
            <Line type="monotone" dataKey="conversions" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Logs */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-8">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        {recentLogs.length === 0 ? (
          <p className="text-gray-500 text-sm">Abhi koi activity nahi hai.</p>
        ) : (
          <ul className="space-y-2">
            {recentLogs.map((log) => (
              <li key={log.id} className="flex justify-between text-sm border-b border-[#30363d] pb-2">
                <span className="text-gray-300">{log.action}</span>
                <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 flex-wrap">
        <Link href="/admin/dashboard/users" className="bg-blue-600 hover:bg-blue-700 px-5 py-2.5 rounded-lg font-medium transition">
          👥 Manage Users
        </Link>
        <Link href="/admin/dashboard/settings" className="bg-green-600 hover:bg-green-700 px-5 py-2.5 rounded-lg font-medium transition">
          ⚙️ Settings
        </Link>
        <Link href="/admin/dashboard/logs" className="bg-purple-600 hover:bg-purple-700 px-5 py-2.5 rounded-lg font-medium transition">
          📋 Logs
        </Link>
      </div>
    </div>
  );
}
