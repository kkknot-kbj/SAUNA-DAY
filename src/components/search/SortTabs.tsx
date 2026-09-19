'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { SORT_LABELS } from '@/lib/search';

import type { SortKey } from '@/lib/search';

/** 表示するソートの順序 */
const SORT_ORDER: SortKey[] = [
  'recommended',
  'price_asc',
  'price_desc',
  'sauna_temp',
  'cool_temp',
];

/**
 * 検索結果の並び替えタブ。
 *
 * 選択中のソートを URL の ?sort= に反映する（リロード・共有で保たれる）。
 * 選択状態は色と下線で示す。横スクロール可能。
 */
export function SortTabs({ active }: { active: SortKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (key: SortKey) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'recommended') {
      params.delete('sort');
    } else {
      params.set('sort', key);
    }
    const query = params.toString();
    router.push(query === '' ? pathname : `${pathname}?${query}`);
  };

  return (
    <div
      role="tablist"
      aria-label="並び替え"
      className="flex gap-1 overflow-x-auto border-b border-line"
    >
      {SORT_ORDER.map((key) => {
        const selected = key === active;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => select(key)}
            className={[
              'relative min-h-[44px] shrink-0 whitespace-nowrap px-3 text-[13px] transition-colors',
              selected ? 'text-accent' : 'text-ink-muted hover:text-ink',
            ].join(' ')}
          >
            {SORT_LABELS[key]}
            {selected ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
