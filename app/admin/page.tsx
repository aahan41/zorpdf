'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, TrendingUp, Loader2 } from 'lucide-react';
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

  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [last7Days, setLast7Days] = useState<DayCount[]>([]);

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
  }, [user]);

  if (authLoading || !user || checkingAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-slate-900">
          Visitor Analytics
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Unique visitors, tracked once per day per browser.
        </p>

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
      </div>
    </div>
  );
}
