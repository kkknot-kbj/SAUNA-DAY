'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { fetchSummariesBySlugs } from '@/app/actions';
import { loadGuestState } from '@/lib/state/guest-storage';

import type { SaunaSummary } from '@/lib/types';

/**
 * 直近閲覧した施設。
 *
 * 控えめに表示する（要件1-6）。主役はメインコピーと5問。
 * 何を見たかは端末側（localStorage）が持ち、名前はサーバーで解決する。
 */
export function RecentlyViewed() {
  const [items, setItems] = useState<SaunaSummary[]>([]);

  useEffect(() => {
    const slugs = loadGuestState().recentlyViewed.slice(0, 5);
    if (slugs.length === 0) return;

    let active = true;
    fetchSummariesBySlugs(slugs)
      .then((summaries) => {
        if (active) setItems(summaries);
      })
      .catch(() => {
        // 取得に失敗しても画面を壊さない。控えめな補助表示なので黙って隠す
      });

    return () => {
      active = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[13px] text-ink-faint">最近見たサウナ</h2>
      <ul className="flex flex-col">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              href={`/saunas/${item.slug}`}
              className="flex min-h-[44px] items-center justify-between gap-3 border-b border-line text-[14px] text-ink-muted hover:text-ink"
            >
              <span>{item.name}</span>
              <span className="shrink-0 text-[12px] text-ink-faint">{item.prefecture}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
