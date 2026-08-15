'use client';

import { useEffect, useMemo, useState } from 'react';
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
  LogOut,
  RefreshCw,
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

function startOfTodayISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoISO(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default function AdminPage() {
  const router = useRouter();

  const {
    user,
    profile,
    loading: authLoading,
    signOut,
  } = useAuth();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [last7Days, setLast7Days] = useState<DayCount[]>([]);

  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);

  /*
   * =========================================================
   * ADMIN SECURITY CHECK
   * =========================================================
   *
   * No session -> login
   * Session + no admin -> homepage
   * Session + admin -> dashboard
   */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (profile === null) {
      setCheckingAdmin(true);
      return;
    }

    if (profile.is_admin !== true) {
      router.replace('/');
      return;
    }

    if (profile.is_banned === true) {
      router.replace('/');
      return;
    }

    setIsAdmin(true);
    setCheckingAdmin(false);
  }, [authLoading, user, profile, router]);

  /*
   * =========================================================
   * ANALYTICS
   * =========================================================
   */

  const loadAnalytics = async () => {
    if (!user || !isAdmin) return;

    setLoading(true);

    try {
      const [todayRes, totalRes, weekRes] =
        await Promise.all([
          supabase
            .from('page_visits')
            .select('id', {
              count: 'exact',
              head: true,
            })
            .gte('created_at', startOfTodayISO()),

          supabase
            .from('page_visits')
            .select('id', {
              count: 'exact',
              head: true,
            }),

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

      (weekRes.data || []).forEach(
        (row: { created_at: string }) => {
          const key = row.created_at.slice(0, 10);

          if (buckets.has(key)) {
            buckets.set(
              key,
              (buckets.get(key) || 0) + 1
            );
          }
        }
      );

      const chartData: DayCount[] = Array.from(
        buckets.entries()
      ).map(([date, visitors]) => ({
        date,
        label: new Date(date).toLocaleDateString(
          'en-US',
          {
            weekday: 'short',
          }
        ),
        visitors,
      }));

      setLast7Days(chartData);
    } catch (error) {
      console.error(
        'Analytics loading error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    loadAnalytics();
  }, [isAdmin]);

  /*
   * =========================================================
   * USERS
   * =========================================================
   */

  const loadUsers = async () => {
    if (!isAdmin) return;

    setUsersLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, full_name, email, mobile, is_admin, is_banned, created_at'
        )
        .order('created_at', {
          ascending: false,
        });

      if (error) {
        console.error(
          'Users loading error:',
          error
        );

        setUsers([]);
        return;
      }

      setUsers((data || []) as Profile[]);
    } catch (error) {
      console.error(
        'Users loading exception:',
        error
      );
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;

    loadUsers();
  }, [isAdmin]);

  /*
   * =========================================================
   * BAN / UNBAN
   * =========================================================
   */

  const toggleBan = async (target: Profile) => {
    if (!isAdmin) return;

    if (target.id === user?.id) {
      return;
    }

    setActioningId(target.id);

    try {
      const newValue = !target.is_banned;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: newValue,
        })
        .eq('id', target.id);

      if (error) {
        console.error(
          'Ban update error:',
          error
        );

        return;
      }

      setUsers((previous) =>
        previous.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_banned: newValue,
              }
            : item
        )
      );
    } finally {
      setActioningId(null);
    }
  };

  /*
   * =========================================================
   * ADMIN ROLE
   * =========================================================
   */

  const toggleAdmin = async (target: Profile) => {
    if (!isAdmin) return;

    /*
     * Never allow the current admin to remove
     * their own admin access.
     */
    if (target.id === user?.id) {
      return;
    }

    setActioningId(target.id);

    try {
      const newValue = !target.is_admin;

      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: newValue,
        })
        .eq('id', target.id);

      if (error) {
        console.error(
          'Admin update error:',
          error
        );

        return;
      }

      setUsers((previous) =>
        previous.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_admin: newValue,
              }
            : item
        )
      );
    } finally {
      setActioningId(null);
    }
  };

  /*
   * =========================================================
   * SEARCH
   * =========================================================
   */

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) {
      return users;
    }

    return users.filter((item) => {
      return (
        item.full_name
          ?.toLowerCase()
          .includes(q) ||
        item.email
          ?.toLowerCase()
          .includes(q) ||
        item.mobile
          ?.toLowerCase()
          .includes(q)
      );
    });
  }, [users, search]);

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  /*
   * =========================================================
   * LOADING / ACCESS DENIED
   * =========================================================
   */

  if (
    authLoading ||
    checkingAdmin ||
    !user ||
    !isAdmin
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Checking admin access...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * ADMIN DASHBOARD
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-lg shadow-blue-200">
                Z
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Admin Panel
                </h1>

                <p className="text-sm text-slate-500">
                  ZorPDF administration dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                loadAnalytics();
                loadUsers();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>

        {/* ANALYTICS */}

        {loading ? (
          <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-20">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
                  recorded visits today
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="mb-4 text-sm font-semibold text-slate-700">
                Last 7 Days
              </p>

              <div className="h-56 w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart data={last7Days}>
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#94a3b8',
                      }}
                    />

                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 12,
                        fill: '#94a3b8',
                      }}
                      width={28}
                    />

                    <Tooltip
                      cursor={{
                        fill: '#f1f5f9',
                      }}
                      contentStyle={{
                        borderRadius: 10,
                        border:
                          '1px solid #e2e8f0',
                        fontSize: 12,
                      }}
                    />

                    <Bar
                      dataKey="visitors"
                      fill="#2563eb"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                      maxBarSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* USER MANAGEMENT */}

        <div className="mt-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                User Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {users.length} registered user
                {users.length === 1 ? '' : 's'}
              </p>
            </div>

            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search name, email or mobile"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {usersLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-400">
                No users found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                      <th className="px-5 py-3">
                        Name
                      </th>

                      <th className="px-5 py-3">
                        Email
                      </th>

                      <th className="px-5 py-3">
                        Mobile
                      </th>

                      <th className="px-5 py-3">
                        Joined
                      </th>

                      <th className="px-5 py-3">
                        Status
                      </th>

                      <th className="px-5 py-3 text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
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
                            ? new Date(
                                u.created_at
                              ).toLocaleDateString()
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
                              type="button"
                              onClick={() =>
                                toggleBan(u)
                              }
                              disabled={
                                actioningId ===
                                  u.id ||
                                u.id === user.id
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                              type="button"
                              onClick={() =>
                                toggleAdmin(u)
                              }
                              disabled={
                                actioningId ===
                                  u.id ||
                                u.id === user.id
                              }
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {u.is_admin ? (
                                <>
                                  <ShieldOff className="h-3.5 w-3.5" />
                                  Remove Admin
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="h-3.5 w-3.5" />
                                  Make Admin
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
