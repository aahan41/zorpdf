'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordDailyVisit } from '@/lib/visitTracking';

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    recordDailyVisit(pathname || '/');
  }, [pathname]);

  return null;
}
