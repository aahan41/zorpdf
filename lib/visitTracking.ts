'use client';

import { supabase } from '@/lib/supabase';

const VISITOR_ID_KEY = 'zp_visitor_id';
const LAST_VISIT_KEY = 'zp_last_visit_date';

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(VISITOR_ID_KEY);

  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    localStorage.setItem(VISITOR_ID_KEY, id);
  }

  return id;
}

/**
 * Records one visit per unique visitor per calendar day.
 * Safe to call on every page load — it no-ops if today's
 * visit was already recorded on this browser.
 */
export async function recordDailyVisit(path: string) {
  try {
    const today = getTodayKey();
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);

    if (lastVisit === today) {
      return; // already counted today
    }

    const visitorId = getOrCreateVisitorId();

    const { error } = await supabase
      .from('page_visits')
      .insert({ visitor_id: visitorId, path });

    if (!error) {
      localStorage.setItem(LAST_VISIT_KEY, today);
    }
  } catch {
    // Tracking should never break the app.
  }
}
