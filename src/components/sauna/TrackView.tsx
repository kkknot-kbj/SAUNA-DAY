'use client';

import { useEffect } from 'react';

import { pushRecentlyViewed } from '@/lib/state/guest-storage';

/**
 * 閲覧を端末側に記録する（要件1-6）。
 * ゲストのまま使えるようにするため、サーバーには送らない。
 */
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    pushRecentlyViewed(slug);
  }, [slug]);

  return null;
}
