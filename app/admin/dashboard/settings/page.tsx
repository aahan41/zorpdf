"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AdminNavbar from "@/components/admin/AdminNavbar";

const DEFAULT_TOOLS = [
  "JPG to PDF",
  "PDF to JPG",
  "PNG to PDF",
  "Word to PDF",
  "PDF to Word",
  "PDF Compressor",
];

export default function SettingsPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) router.push("/admin");
    else { setAuthorized(true); fetchTools(); }
  }, [router]);

  async function fetchTools() {
    setLoading(true);
    const { data } = await supabase.from("tools").select("*").order("name");
    if (!data || data.length === 0) {
      const inserts = DEFAULT_TOOLS.map((name) => ({ name, is_enabled: true }));
      await supabase.from("tools").insert(inserts);
      const { data: fresh } = await supabase.from("tools").select("*").order("name");
      setTools(fresh || []);
    } else {
      setTools(data);
    }
    setLoading(false);
  }

  async function toggleTool(id: string, currentStatus: boolean) {
    setSaving(id);
    await supabase.from("tools").update({ is_enabled: !currentStatus }).eq("id", id);
    await supabase.from("logs").insert({
      action: `Tool ${!currentStatus ? "enabled" : "disabled"}: ${tools.find(t => t.id === id)?.name}`,
    });
    setTools((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_enabled: !currentStatus } : t))
    );
    setSaving(null);
    showToast(!currentStatus ? "✅ Tool enabled!" : "⛔ Tool disabled!");
  }

  async function toggleAll(enable: boolean) {
    await supabase.from("tools").update({ is_enabled: enable }).neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("logs").insert({ action: enable ? "All tools enabled" : "All tools disabled" });
    setTools((prev) => prev.map((t) => ({ ...t, is_enabled: enable })));
    showToast(enable ? "✅ Sabhi tools enabled!" : "⛔ Sabhi tools disabled!");
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  if (!authorized) return null;

  const enabledCount = tools.filter((t) => t.is_enabled).length;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 bg-[#161b22] border border-[#30363d] text-white px-4 py-2 rounded-lg text-sm shadow-lg z-50 transition">
          {toast}
        </div>
      )}

      <AdminNavbar />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-1">Site Settings</h1>
        <p className="text-gray-400 text-sm mb-8">Tools enable/disable karo — changes live ho jaate hain</p>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-white">Tools Manager</h3>
              <p className="text-xs text-gray-400 mt-0.5">{enabledCount}/{tools.length} tools active</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 rounded-lg transition">
                Enable All
              </button>
              <button onClick={() => toggleAll(false)} className="px-3 py-1.5 text-xs bg-red-800 hover:bg-red-700 rounded-lg transition">
                Disable All
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
          ) : (
            <div className="space-y-1">
              {tools.map((tool) => (
                <div key={tool.id} className="flex items-center justify-between py-3 px-2 border-b border-[#30363d] last:border-0 hover:bg-[#1c2128] rounded-lg transition">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${tool.is_enabled ? "bg-green-400" : "bg-red-400"}`}></span>
                    <span className="text-sm text-gray-200">{tool.name}</span>
                  </div>
                  <button
                    onClick={() => toggleTool(tool.id, tool.is_enabled)}
                    disabled={saving === tool.id}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${tool.is_enabled ? "bg-blue-600" : "bg-gray-600"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${tool.is_enabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
