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
  TrendingUp,
  UserCheck,
  UserX,
  Users,
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

type DayCount = {
  date: string;
  label: string;
  visitors: number;
};

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

type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  mobile: string | null;
  email: string | null;
  is_admin: boolean;
  is_banned: boolean;
  created_at: string | null;
};

export default function Admin9415Page() {
  const router = useRouter();

  const {
    user,
    profile,
    loading: authLoading,
    signOut,
  } = useAuth();

  const [users, setUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState('');

  const [loadingVisits, setLoadingVisits] = useState(true);
  const [todayVisits, setTodayVisits] = useState(0);
  const [totalVisits, setTotalVisits] = useState(0);
  const [last7Days, setLast7Days] = useState<DayCount[]>([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [actionLoading, setActionLoading] =
    useState<string | null>(null);
  const [menuOpen, setMenuOpen] =
    useState<string | null>(null);

  /*
   * =====================================================
   * ADMIN SECURITY CHECK
   * =====================================================
   */

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!profile) return;

    if (profile.is_banned) {
      router.replace('/');
      return;
    }

    if (!profile.is_admin) {
      router.replace('/');
      return;
    }
  }, [
    authLoading,
    user,
    profile,
    router,
  ]);

  /*
   * =====================================================
   * LOAD ALL USERS
   * =====================================================
   */

  const loadUsers = async () => {
    setLoadingUsers(true);

    try {
      const { data, error } =
        await supabase
          .from('profiles')
          .select(
            `
              id,
              full_name,
              phone,
              mobile,
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
          'Admin users error:',
          error
        );

        alert(
          'Users load nahi ho pa rahe hain.'
        );

        setUsers([]);
        return;
      }

      setUsers(
        (data || []).map((item) => ({
          id: item.id,
          full_name:
            item.full_name || null,
          phone: item.phone || null,
          mobile: item.mobile || null,
          email: item.email || null,
          is_admin:
            item.is_admin === true,
          is_banned:
            item.is_banned === true,
          created_at:
            item.created_at || null,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingUsers(false);
    }
  };

  /*
   * =====================================================
   * LOAD VISITOR ANALYTICS
   * =====================================================
   */

  const loadVisits = async () => {
    setLoadingVisits(true);

    try {
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

      setTodayVisits(todayRes.count ?? 0);
      setTotalVisits(totalRes.count ?? 0);

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
    } catch (error) {
      console.error('Visit analytics error:', error);
    } finally {
      setLoadingVisits(false);
    }
  };

  /*
   * =====================================================
   * ADD NEW CUSTOMER (via Edge Function)
   * =====================================================
   */

  const handleAddCustomer = async () => {
    setAddUserError('');

    const cleanMobile = newMobile.replace(/\D/g, '');

    if (!newName.trim()) {
      setAddUserError('Please enter a full name.');
      return;
    }
    if (cleanMobile.length !== 10) {
      setAddUserError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setAddUserError('Please enter a valid email address.');
      return;
    }
    if (newPassword.length < 6) {
      setAddUserError('Password must be at least 6 characters.');
      return;
    }

    setAddingUser(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        'create-customer',
        {
          body: {
            fullName: newName.trim(),
            mobile: cleanMobile,
            email: newEmail.trim().toLowerCase(),
            password: newPassword,
          },
        }
      );

      if (error || data?.error) {
        setAddUserError(data?.error || error?.message || 'Could not create account.');
        return;
      }

      setShowAddModal(false);
      setNewName('');
      setNewMobile('');
      setNewEmail('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      setAddUserError('Something went wrong. Please try again.');
    } finally {
      setAddingUser(false);
    }
  };

  /*
   * =====================================================
   * LOAD AFTER ADMIN AUTHENTICATION
   * =====================================================
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
   * =====================================================
   * SEARCH
   * =====================================================
   */

  const filteredUsers = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) return users;

    return users.filter((item) => {
      return (
        (item.full_name || '')
          .toLowerCase()
          .includes(q) ||
        (item.email || '')
          .toLowerCase()
          .includes(q) ||
        (item.phone || '')
          .toLowerCase()
          .includes(q) ||
        (item.mobile || '')
          .toLowerCase()
          .includes(q)
      );
    });
  }, [users, search]);

  /*
   * =====================================================
   * STATISTICS
   * =====================================================
   */

  const totalUsers = users.length;

  const adminCount = users.filter(
    (item) => item.is_admin
  ).length;

  const bannedCount = users.filter(
    (item) => item.is_banned
  ).length;

  const activeCount =
    totalUsers - bannedCount;

  /*
   * =====================================================
   * BAN / UNBAN USER
   * =====================================================
   */

  const toggleBan = async (
    target: Profile
  ) => {
    if (!user) return;

    if (target.id === user.id) {
      alert(
        'Aap apne account ko ban nahi kar sakte.'
      );
      return;
    }

    setActionLoading(target.id);
    setMenuOpen(null);

    try {
      const newStatus =
        !target.is_banned;

      const { error } =
        await supabase
          .from('profiles')
          .update({
            is_banned: newStatus,
          })
          .eq('id', target.id);

      if (error) {
        console.error(error);

        alert(
          'User status update nahi hua.'
        );

        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_banned:
                  newStatus,
              }
            : item
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =====================================================
   * MAKE ADMIN / REMOVE ADMIN
   * =====================================================
   */

  const toggleAdmin = async (
    target: Profile
  ) => {
    if (!user) return;

    if (target.id === user.id) {
      alert(
        'Aap apna khud ka admin access remove nahi kar sakte.'
      );
      return;
    }

    setActionLoading(target.id);
    setMenuOpen(null);

    try {
      const newStatus =
        !target.is_admin;

      const { error } =
        await supabase
          .from('profiles')
          .update({
            is_admin: newStatus,
          })
          .eq('id', target.id);

      if (error) {
        console.error(error);

        alert(
          'Admin status update nahi hua.'
        );

        return;
      }

      setUsers((current) =>
        current.map((item) =>
          item.id === target.id
            ? {
                ...item,
                is_admin:
                  newStatus,
              }
            : item
        )
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =====================================================
   * LOGOUT
   * =====================================================
   */

  const handleLogout = async () => {
    setActionLoading('logout');

    try {
      await signOut();
      router.replace('/login');
    } catch (error) {
      console.error(error);
      router.replace('/login');
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * =====================================================
   * REFRESH
   * =====================================================
   */

  const refresh = async () => {
    await loadUsers();
  };

  /*
   * =====================================================
   * LOADING / SECURITY SCREEN
   * =====================================================
   */

  if (
    authLoading ||
    !user ||
    !profile ||
    !profile.is_admin
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600">
            <Loader2 className="h-7 w-7 animate-spin text-white" />
          </div>

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Checking Admin Access
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Please wait...
          </p>
        </div>
      </div>
    );
  }

  /*
   * =====================================================
   * ADMIN DASHBOARD
   * =====================================================
   */

  return (
    <main
      className="min-h-screen bg-slate-50"
      onClick={() => setMenuOpen(null)}
    >

      {/* HEADER */}

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-200">
              <Zap className="h-6 w-6 fill-white text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900">
                ZorPDF Admin
              </h1>

              <p className="text-xs text-slate-500">
                Admin Panel • admin9415
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                refresh();
              }}
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:border-blue-300 hover:text-blue-600"
            >
              <RefreshCw
                className={
                  loadingUsers
                    ? 'h-4 w-4 animate-spin'
                    : 'h-4 w-4'
                }
              />

              <span className="hidden sm:block">
                Refresh
              </span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleLogout();
              }}
              className="flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              {actionLoading ===
              'logout' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              <span className="hidden sm:block">
                Logout
              </span>
            </button>

          </div>

        </div>

      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* WELCOME */}

        <div className="mb-8">

          <div className="flex items-center gap-2">

            <ShieldCheck className="h-6 w-6 text-blue-600" />

            <h2 className="text-2xl font-bold text-slate-900">
              Welcome,{' '}
              {profile.full_name ||
                'Irshad Ansari'}
            </h2>

          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage your ZorPDF customers
            and administrator accounts.
          </p>

        </div>

        {/* VISITOR ANALYTICS */}

        <div className="mb-8">
          <h3 className="mb-3 text-lg font-bold text-slate-900">
            Visitor Analytics
          </h3>

          {loadingVisits ? (
            <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Today
                    </span>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {todayVisits}
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
                    {totalVisits}
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
        </div>

        {/* STATISTICS */}

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
            value={activeCount}
            icon={
              <UserCheck className="h-5 w-5" />
            }
          />

          <StatCard
            title="Banned Users"
            value={bannedCount}
            icon={
              <UserX className="h-5 w-5" />
            }
          />

          <StatCard
            title="Admins"
            value={adminCount}
            icon={
              <Shield className="h-5 w-5" />
            }
          />

        </div>

        {/* USERS */}

        <section className="mt-8">

          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Customer Accounts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Manage all registered
                customers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative w-full sm:w-80">

                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }
                  placeholder="Search customer..."
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />

              </div>

              <button
                onClick={() => {
                  setAddUserError('');
                  setShowAddModal(true);
                }}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                <Users className="h-4 w-4" />
                Add Customer
              </button>
            </div>

          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {loadingUsers ? (
              <div className="flex min-h-[300px] items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
              </div>
            ) : filteredUsers.length ===
              0 ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center">

                <Users className="h-12 w-12 text-slate-300" />

                <p className="mt-3 font-medium text-slate-600">
                  No customers found
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[850px]">

                  <thead>

                    <tr className="border-b border-slate-100 bg-slate-50">

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Customer
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Mobile
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Email
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Status
                      </th>

                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-400">
                        Role
                      </th>

                      <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-slate-400">
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

                          {/* CUSTOMER */}

                          <td className="px-5 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">

                                {(
                                  item.full_name ||
                                  item.email ||
                                  'U'
                                )
                                  .charAt(0)
                                  .toUpperCase()}

                              </div>

                              <div>

                                <p className="font-semibold text-slate-900">
                                  {item.full_name ||
                                    'Customer'}
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

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.mobile ||
                              item.phone ||
                              '—'}
                          </td>

                          {/* EMAIL */}

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {item.email ||
                              '—'}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-4">

                            {item.is_banned ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                                <Ban className="h-3.5 w-3.5" />
                                Banned
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-600">
                                <CheckCircle className="h-3.5 w-3.5" />
                                Active
                              </span>
                            )}

                          </td>

                          {/* ROLE */}

                          <td className="px-5 py-4">

                            {item.is_admin ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
                                <Shield className="h-3.5 w-3.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                Customer
                              </span>
                            )}

                          </td>

                          {/* ACTION */}

                          <td className="px-5 py-4 text-right">

                            {item.id ===
                            user.id ? (
                              <span className="text-xs font-semibold text-slate-400">
                                You
                              </span>
                            ) : (
                              <div
                                className="relative inline-block"
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
                              >

                                <button
                                  type="button"
                                  disabled={
                                    actionLoading ===
                                    item.id
                                  }
                                  onClick={() =>
                                    setMenuOpen(
                                      menuOpen ===
                                        item.id
                                        ? null
                                        : item.id
                                    )
                                  }
                                  className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600"
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

                                {menuOpen ===
                                  item.id && (
                                  <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-left shadow-xl">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleAdmin(
                                          item
                                        )
                                      }
                                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50"
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
                                      className={`flex w-full items-center gap-2 px-4 py-3 text-sm ${
                                        item.is_banned
                                          ? 'text-green-600 hover:bg-green-50'
                                          : 'text-red-600 hover:bg-red-50'
                                      }`}
                                    >
                                      {item.is_banned ? (
                                        <>
                                          <CheckCircle className="h-4 w-4" />
                                          Unban Customer
                                        </>
                                      ) : (
                                        <>
                                          <Ban className="h-4 w-4" />
                                          Ban Customer
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

        {/* SECURITY */}

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">

          <div className="flex gap-3">

            <ShieldCheck className="h-5 w-5 shrink-0 text-blue-600" />

            <div>

              <h3 className="font-bold text-blue-900">
                Admin Security Enabled
              </h3>

              <p className="mt-1 text-sm leading-6 text-blue-700">
                Only a logged-in account with
                <strong>
                  {' '}is_admin = true
                </strong>
                {' '}can access this panel.
                Normal customers are automatically
                redirected away from the admin area.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ADD CUSTOMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">
              Add New Customer
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Creates a login without affecting your admin session.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="Customer name"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Mobile Number
                </label>
                <input
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Email
                </label>
                <input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="customer@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Password
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="At least 6 characters"
                />
              </div>

              {addUserError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
                  {addUserError}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={addingUser}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                disabled={addingUser}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {addingUser && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

/*
 * =====================================================
 * STAT CARD
 * =====================================================
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
