'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Icon } from '@/components/ui/Icon';

/**
 * 下部ナビゲーション。
 *
 * IMPORTANT: 探す / 行きたい / プラン の3項目のみ。増やさない（要件16-2）。
 */
const ITEMS = [
  { href: '/', label: '探す', icon: 'Search' },
  { href: '/favorites', label: '行きたい', icon: 'Bookmark' },
  { href: '/plans', label: 'プラン', icon: 'Route' },
] as const;

function isCurrent(pathname: string, href: string): boolean {
  if (href === '/') {
    // ホームと条件設定・検索結果を「探す」として扱う
    return pathname === '/' || pathname.startsWith('/search') || pathname.startsWith('/saunas');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="メインナビゲーション"
      className="sticky bottom-0 z-40 border-t border-line bg-base"
    >
      <ul className="mx-auto flex max-w-screen-sm">
        {ITEMS.map((item) => {
          const current = isCurrent(pathname, item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={[
                  // タップ領域 44px 以上
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 py-2 text-[11px]',
                  // 現在位置を色以外（上罫線）でも示す
                  current
                    ? 'border-t-2 border-accent text-accent'
                    : 'border-t-2 border-transparent text-ink-faint hover:text-ink-muted',
                ].join(' ')}
              >
                <Icon name={item.icon} size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
