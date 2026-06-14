"use client";

import Link from "next/link";

export default function DashboardPage() {
return ( <div className="min-h-screen bg-[#0d1117] text-white p-6"> <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

```
  <div className="grid md:grid-cols-3 gap-4 mb-8">
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h3 className="text-gray-400">Total Users</h3>
      <p className="text-3xl font-bold">0</p>
    </div>

    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h3 className="text-gray-400">Total Conversions</h3>
      <p className="text-3xl font-bold">0</p>
    </div>

    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h3 className="text-gray-400">Tools</h3>
      <p className="text-3xl font-bold">6</p>
    </div>
  </div>

  <div className="flex gap-4">
    <Link
      href="/admin/dashboard/users"
      className="bg-blue-600 px-4 py-2 rounded-lg"
    >
      Manage Users
    </Link>

    <Link
      href="/admin/dashboard/settings"
      className="bg-green-600 px-4 py-2 rounded-lg"
    >
      Settings
    </Link>

    <Link
      href="/admin/dashboard/logs"
      className="bg-purple-600 px-4 py-2 rounded-lg"
    >
      Logs
    </Link>
  </div>
</div>
```

);
}
