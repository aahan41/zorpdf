"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type User = {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
  status: "active" | "blocked";
};

export default function UsersPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const isAdmin = localStorage.getItem("zorpdf_admin");
    if (!isAdmin) {
      router.push("/admin");
      return;
    }

    setAuthorized(true);

    const savedUsers = localStorage.getItem("zorpdf_users");
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    }
  }, [router]);

  const saveUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    localStorage.setItem("zorpdf_users", JSON.stringify(updatedUsers));
  };

  const toggleStatus = (id: number) => {
    const updatedUsers = users.map((user) =>
      user.id === id
        ? { ...user, status: user.status === "active" ? "blocked" : "active" }
        : user
    );

    saveUsers(updatedUsers);
  };

  const deleteUser = (id: number) => {
    const updatedUsers = users.filter((user) => user.id !== id);
    saveUsers(updatedUsers);
  };

  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())
  );

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
          <span className="font-semibold">
            Zor<span className="text-blue-400">PDF</span>
          </span>
          <span className="ml-2 text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full border border-blue-800">
            Admin Panel
          </span>
        </div>

        <Link href="/admin/dashboard" className="text-sm text-gray-400 hover:text-white transition border border-[#30363d] px-3 py-1.5 rounded-lg">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-2">Users Manage karo</h1>
        <p className="text-gray-400 text-sm mb-6">Sab registered users ki list</p>

        <input
          type="text"
          placeholder="User search karo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full mb-6 bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3 text-sm outline-none focus:border-blue-500"
        />

        {filteredUsers.length === 0 ? (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
            <div className="text-4xl mb-4">👥</div>
            <p className="text-gray-400 text-sm">Abhi koi users registered nahi hain.</p>
          </div>
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#0d1117] text-gray-400">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Joined Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-[#30363d]">
                    <td className="p-4">{user.name}</td>
                    <td className="p-4 text-gray-300">{user.email}</td>
                    <td className="p-4 text-gray-300">{user.joinedAt}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.status === "active"
                          ? "bg-green-900/40 text-green-400"
                          : "bg-red-900/40 text-red-400"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2">
                      <button
                        onClick={() => toggleStatus(user.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {user.status === "active" ? "Block" : "Active"}
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-xs"
                      >
                        Delete
                      </button>
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
