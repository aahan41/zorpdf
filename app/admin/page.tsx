'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  TrendingUp,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  Ban,
  CheckCircle2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useAuth } from '@/lib/authContext';
import { supabase } from '@/lib/supabase';

interface DayCount {
  date: string;
  label: string;
  visitors: number;
}

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  is_admin: boolean | null;
  is_banned: boolean | null;
  created_at: string | null;
}

function startOfTodayISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // --- Admin gate ---
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- Analytics state ---
  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [last7Days, setLast7Days] = useState<DayCount[]>([]);

  // --- User management state ---
  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // Verify the logged-in user actually has admin rights.
  // Anyone can sign up and log in normally, but only a profile
  // with is_admin = true is allowed to see this page.
  useEffect(() => {
    if (authLoading || !user) return;

    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data?.is_admin) {
        router.replace('/');
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    };

    checkAdmin();
  }, [authLoading, user, router]);

  // Load visitor analytics
  useEffect(() => {
    if (!user || !isAdmin) return;

    const load = async () => {
      setLoading(true);

      const [todayRes, totalRes, weekRes] = await Promise.all([
        supabase
          .from('page_visits')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', startOfTodayISO()),

        supabase
          .from('page_visits')
          .select('id', { count: 'exact', head: true }),

        supabase
          .from('page_visits')
          .select('created_at')
          .gte('created_at', daysAgoISO(6)),
      ]);

      setTodayCount(todayRes.count ?? 0);
      setTotalCount(totalRes.count ?? 0);

      const buckets = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        buckets.set(key, 0);
      }

      (weekRes.data || []).forEach((row: { created_at: string }) => {
        const key = row.created_at.slice(0, 10);
        if (buckets.has(key)) {
          buckets.set(key, (buckets.get(key) || 0) + 1);
        }
      });

      const chartData: DayCount[] = Array.from(buckets.entries()).map(
        ([date, visitors]) => ({
          date,
          label: new Date(date).toLocaleDateString('en-US', {
            weekday: 'short',
          }),
          visitors,
        })
      );

      setLast7Days(chartData);
      setLoading(false);
    };

    load();
  }, [user, isAdmin]);

  // Load all users
  const loadUsers = async () => {
    setUsersLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, mobile, is_admin, is_banned, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUsers(data as Profile[]);
    }
    setUsersLoading(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin]);

  const toggleBan = async (target: Profile) => {
    setActioningId(target.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !target.is_banned })
      .eq('id', target.id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id ? { ...u, is_banned: !u.is_banned } : u
        )
      );
    }
    setActioningId(null);
  };

  const toggleAdmin = async (target: Profile) => {
    // Safety: don't let an admin remove their own admin rights from here
    if (target.id === user?.id) return;

    setActioningId(target.id);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !target.is_admin })
      .eq('id', target.id);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === target.id ? { ...u, is_admin: !u.is_admin } : u
        )
      );
    }
    setActioningId(null);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.mobile?.toLowerCase().includes(q)
    );
  });

  if (authLoading || !user || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-slate-500">
          Visitor analytics and full user management.
        </p>

        {/* ===================== ANALYTICS ===================== */}
        {loading ? (
          <div className="mt-10 flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    Today
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {todayCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  unique visitors so far today
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-slate-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    All time
                  </span>
                </div>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {totalCount}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  total recorded visits
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-4 text-sm font-semibold text-slate-700">
                Last 7 days
              </p>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={last7Days}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#94a3b8' }}
                      width={28}
                    />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="visitors"
                      fill="#2563eb"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ===================== USER MANAGEMENT ===================== */}
        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                User Management
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {users.length} registered user{users.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4 relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or mobile"
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Table */}
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">Name</th>
                      <th className="px-5 py-3">Email</th>
                      <th className="px-5 py-3">Mobile</th>
                      <th className="px-5 py-3">Joined</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td className="px-5 py-3 font-medium text-slate-800">
                          {u.full_name || '—'}
                          {u.is_admin && (
                            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                              Admin
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {u.email || '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {u.mobile || '—'}
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-5 py-3">
                          {u.is_banned ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleBan(u)}
                              disabled={actioningId === u.id}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                              {u.is_banned ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  Unban
                                </>
                              ) : (
                                <>
                                  <Ban className="h-3.5 w-3.5" />
                                  Ban
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => toggleAdmin(u)}
                              disabled={
                                actioningId === u.id || u.id === user?.id
                              }
                              title={
                                u.id === user?.id
                                  ? "You can't change your own admin status here"
                                  : ''
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {u.is_admin ? (
                                <>
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  Remove admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Make admin
                                </>
                              )}
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
      </div>
    </div>
  );
}
