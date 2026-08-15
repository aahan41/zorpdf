'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  CheckCircle,
  ChevronDown,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  UserX,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';

interface UserProfile {
  id: string;
  full_name: string | null;
  mobile: string | null;
  phone: string | null;
  email: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string | null;
}

interface Visit {
  id?: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();
  const {
    user,
    profile,
    loading: authLoading,
    signOut,
    refreshProfile,
  } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [openMenu, setOpenMenu] = useState<string | null>(
    null
  );

  /*
   * =========================================================
   * AUTHORIZATION
   * =========================================================
   */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!profile) {
      return;
    }

    if (profile.is_banned) {
      router.replace('/');
      return;
    }

    if (!profile.is_admin) {
      router.replace('/');
      return;
    }
  }, [
    user,
    profile,
    authLoading,
    router,
  ]);

  /*
   * =========================================================
   * LOAD USERS
   * =========================================================
   */

  const loadUsers = async () => {
    setUsersLoading(true);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          full_name,
          mobile,
          phone,
          email,
          is_admin,
          is_banned,
          created_at
          `
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

      setUsers(
        (data ?? []).map((item) => ({
          id: item.id,
          full_name: item.full_name ?? null,
          mobile: item.mobile ?? null,
          phone: item.phone ?? null,
          email: item.email ?? null,
          is_admin: item.is_admin === true,
          is_banned: item.is_banned === true,
          created_at: item.created_at ?? null,
        }))
      );
    } catch (error) {
      console.error(
        'Users loading exception:',
        error
      );
    } finally {
      setUsersLoading(false);
    }
  };

  /*
   * =========================================================
   * LOAD VISITS
   * =========================================================
   */

  const loadVisits = async () => {
    setVisitsLoading(true);

    try {
      const { data, error } = await supabase
        .from('page_visits')
        .select('id, created_at')
        .order('created_at', {
          ascending: false,
        })
        .limit(1000);

      if (error) {
        console.error(
          'Visits loading error:',
          error
        );

        setVisits([]);
        return;
      }

      setVisits(data ?? []);
    } catch (error) {
      console.error(
        'Visits loading exception:',
        error
      );
    } finally {
      setVisitsLoading(false);
    }
  };

  /*
   * =========================================================
   * INITIAL DATA
   * =========================================================
   */

  useEffect(() => {
    if (
      authLoading ||
      !user ||
      !profile?.is_admin
    ) {
      return;
    }

    loadUsers();
    loadVisits();
  }, [
    authLoading,
    user,
    profile?.is_admin,
  ]);

  /*
   * =========================================================
   * REFRESH
   * =========================================================
   */

  const refreshAll = async () => {
    await Promise.all([
      loadUsers(),
      loadVisits(),
      refreshProfile(),
    ]);
  };

  /*
   * =========================================================
   * USER SEARCH
   * =========================================================
   */

  const filteredUsers = useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) return users;

    return users.filter((item) => {
      return (
        item.full_name
          ?.toLowerCase()
          .includes(value) ||
        item.email
          ?.toLowerCase()
          .includes(value) ||
        item.mobile
          ?.toLowerCase()
          .includes(value) ||
        item.phone
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [users, search]);

  /*
   * =========================================================
   * STATISTICS
   * =========================================================
   */

  const totalUsers = users.length;

  const bannedUsers = users.filter(
    (item) => item.is_banned
  ).length;

  const adminUsers = users.filter(
    (item) => item.is_admin
  ).length;

  const activeUsers =
    totalUsers - bannedUsers;

  /*
   * =========================================================
   * LAST 7 DAYS
   * =========================================================
   */

  const last7Days = useMemo(() => {
    const result: {
      label: string;
      visitors: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();

      date.setHours(0, 0, 0, 0);
      date.setDate(
        date.getDate() - i
      );

      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const visitors = visits.filter(
        (visit) => {
          const visitDate = new Date(
            visit.created_at
          );

          return (
            visitDate.getFullYear() === year &&
            visitDate.getMonth() === month &&
            visitDate.getDate() === day
          );
        }
      ).length;

      result.push({
        label: date.toLocaleDateString(
          'en-IN',
          {
            weekday: 'short',
          }
        ),
        visitors,
      });
    }

    return result;
  }, [visits]);

  /*
   * =========================================================
   * BAN / UNBAN
   * =========================================================
   */

  const toggleBan = async (
    target: UserProfile
  ) => {
    if (target.id === user?.id) {
      return;
    }

    setActionLoading(target.id);
    setOpenMenu(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: !target.is_banned,
        })
        .eq('id', target.id);

      if (error) {
        console.error(
          'Ban update error:',
          error
        );

        alert(
          'Unable to update user status.'
        );

        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_banned:
                  !item.is_banned,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Ban update exception:',
        error
      );

      alert(
        'Something went wrong.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =========================================================
   * ADMIN / CUSTOMER ROLE
   * =========================================================
   */

  const toggleAdmin = async (
    target: UserProfile
  ) => {
    if (target.id === user?.id) {
      alert(
        'You cannot remove your own admin access.'
      );

      return;
    }

    setActionLoading(target.id);
    setOpenMenu(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_admin: !target.is_admin,
        })
        .eq('id', target.id);

      if (error) {
        console.error(
          'Admin update error:',
          error
        );

        alert(
          'Unable to update admin status.'
        );

        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_admin:
                  !item.is_admin,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        'Admin update exception:',
        error
      );

      alert(
        'Something went wrong.'
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout = async () => {
    setActionLoading('logout');

    try {
      await signOut();
      router.replace('/login');
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (
    authLoading ||
    !user ||
    !profile ||
    !profile.is_admin
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />

          <p className="mt-3 text-sm text-slate-500">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ADMIN DASHBOARD
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <Zap className="h-5 w-5 fill-white text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                ZorPDF Admin
              </h1>

              <p className="text-xs text-slate-500">
                Administration Panel
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={refreshAll}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  usersLoading ||
                  visitsLoading
                    ? 'animate-spin'
                    : ''
                }`}
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={
                actionLoading ===
                'logout'
              }
              className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {actionLoading ===
              'logout' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* CONTENT */}
      {/* ================================================= */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Welcome */}

        <div className="mb-8">

          <div className="flex items-center gap-2">

            <ShieldCheck className="h-6 w-6 text-blue-600" />

            <h2 className="text-2xl font-bold text-slate-900">
              Welcome,{' '}
              {profile.full_name ||
                'Admin'}
            </h2>

          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage customers, admin access and
            website activity from one place.
          </p>

        </div>

        {/* ================================================= */}
        {/* STAT CARDS */}
        {/* ================================================= */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Users"
            value={totalUsers}
            icon={
              <Users className="h-5 w-5" />
            }
          />

          <StatCard
            title="Active Users"
            value={activeUsers}
            icon={
              <UserCheck className="h-5 w-5" />
            }
          />

          <StatCard
            title="Banned Users"
            value={bannedUsers}
            icon={
              <UserX className="h-5 w-5" />
            }
          />

          <StatCard
            title="Administrators"
            value={adminUsers}
            icon={
              <Shield className="h-5 w-5" />
            }
          />

        </div>

        {/* ================================================= */}
        {/* VISITORS */}
        {/* ================================================= */}

        <section className="mt-8">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h3 className="font-bold text-slate-900">
                  Website Visitors
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Visitor activity for the last 7 days
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Users className="h-5 w-5" />
              </div>

            </div>

            <div className="h-64 w-full">

              {visitsLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={last7Days}
                  >
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
              )}

            </div>

          </div>

        </section>

        {/* ================================================= */}
        {/* USER MANAGEMENT */}
        {/* ================================================= */}

        <section className="mt-10">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                User Management
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {users.length}{' '}
                registered user
                {users.length === 1
                  ? ''
                  : 's'}
              </p>
            </div>

            <div className="relative w-full sm:w-80">

              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search name, email or mobile"
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {usersLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : filteredUsers.length ===
              0 ? (
              <div className="py-20 text-center">

                <Users className="mx-auto h-10 w-10 text-slate-300" />

                <p className="mt-3 text-sm text-slate-400">
                  No users found.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">

                      <th className="px-5 py-4">
                        User
                      </th>

                      <th className="px-5 py-4">
                        Mobile
                      </th>

                      <th className="px-5 py-4">
                        Email
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4">
                        Role
                      </th>

                      <th className="px-5 py-4 text-right">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredUsers.map(
                      (item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                        >

                          {/* USER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                                {(
                                  item.full_name ||
                                  item.email ||
                                  'U'
                                )
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate font-semibold text-slate-900">
                                  {item.full_name ||
                                    'Unnamed User'}
                                </p>

                                <p className="text-xs text-slate-400">
                                  {item.created_at
                                    ? new Date(
                                        item.created_at
                                      ).toLocaleDateString(
                                        'en-IN'
                                      )
                                    : ''}
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* MOBILE */}

                          <td className="px-5 py-4 text-slate-600">
                            {item.mobile ||
                              item.phone ||
                              '—'}
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4 text-slate-600">
                            {item.email ||
                              '—'}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {item.is_banned ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                                <XCircle className="h-3.5 w-3.5" />
                                Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                              </span>
                            )}

                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-4">

                            {item.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                                <Shield className="h-3.5 w-3.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Customer
                              </span>
                            )}

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4 text-right">

                            {item.id ===
                            user.id ? (
                              <span className="text-xs font-medium text-slate-400">
                                You
                              </span>
                            ) : (
                              <div className="relative inline-block">

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenMenu(
                                      openMenu ===
                                        item.id
                                        ? null
                                        : item.id
                                    )
                                  }
                                  disabled={
                                    actionLoading ===
                                    item.id
                                  }
                                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
                                >
                                  {actionLoading ===
                                  item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      Manage
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    </>
                                  )}
                                </button>

                                {openMenu ===
                                  item.id && (
                                  <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleAdmin(
                                          item
                                        )
                                      }
                                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Shield className="h-4 w-4" />

                                      {item.is_admin
                                        ? 'Remove Admin'
                                        : 'Make Admin'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleBan(
                                          item
                                        )
                                      }
                                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${
                                        item.is_banned
                                          ? 'text-green-600 hover:bg-green-50'
                                          : 'text-red-600 hover:bg-red-50'
                                      }`}
                                    >
                                      {item.is_banned ? (
                                        <>
                                          <CheckCircle className="h-4 w-4" />
                                          Unban User
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="h-4 w-4" />
                                          Ban User
                                        </>
                                      )}
                                    </button>

                                  </div>
                                )}

                              </div>
                            )}

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </div>

        </section>

        {/* ================================================= */}
        {/* SECURITY NOTICE */}
        {/* ================================================= */}

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex gap-3">

            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

            <div>

              <h3 className="font-semibold text-blue-900">
                Admin Security
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                This dashboard is protected by
                Supabase authentication. Only
                accounts with
                <strong> is_admin = true </strong>
                can access the admin panel.
                Banned accounts are automatically
                blocked.
              </p>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

/*
 * ===========================================================
 * STAT CARD
 * ===========================================================
 */

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
          {icon}
        </div>

      </div>

    </div>
  );
}
