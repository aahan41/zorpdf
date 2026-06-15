"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import AdminNavbar from "@/components/admin/AdminNavbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UsersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) router.push("/admin");
    else { setAuthorized(true); fetchUsers(); }
  }, [router]);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }

  async function banUser(id: string, currentStatus: boolean) {
    await supabase.from("profiles").update({ is_banned: !currentStatus }).eq("id", id);
    await supabase.from("logs").insert({ action: `User ${!currentStatus ? "banned" : "unbanned"}: ${id}` });
    fetchUsers();
  }

  async function deleteUser(id: string) {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    await supabase.from("profiles").delete().eq("id", id);
    await supabase.from("logs").insert({ action: `User deleted: ${id}` });
    fetchUsers();
  }

  const filtered = users.filter((u) =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!authorized) return null;

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <AdminNavbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-1">Users Manage karo</h1>
            <p className="text-gray-400 text-sm">Total: {users.length} users</p>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-sm text-white placeholder-gray-500 w-64 focus:outline-none focus:border-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-20">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-400 text-sm">Koi users nahi mile.</p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#30363d] text-gray-400 text-left">
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-[#30363d] hover:bg-[#1c2128] transition">
                    <td className="px-5 py-4">
                      <div className="font-medium">{user.full_name || "No Name"}</div>
                      <div className="text-gray-400 text-xs">{user.email || user.id}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "admin" ? "bg-purple-900/50 text-purple-400 border border-purple-800" : "bg-gray-800 text-gray-400"
                      }`}>
                        {user.role || "user"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.is_banned ? "bg-red-900/50 text-red-400 border border-red-800" : "bg-green-900/50 text-green-400 border border-green-800"
                      }`}>
                        {user.is_banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => banUser(user.id, user.is_banned)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                            user.is_banned
                              ? "bg-green-700 hover:bg-green-600 text-white"
                              : "bg-yellow-700 hover:bg-yellow-600 text-white"
                          }`}
                        >
                          {user.is_banned ? "Unban" : "Ban"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="px-3 py-1 rounded-lg text-xs font-medium bg-red-700 hover:bg-red-600 text-white transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
