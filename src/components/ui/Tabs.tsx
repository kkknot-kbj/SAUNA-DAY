'use client';

import { useId, useState } from 'react';

import type { ReactNode } from 'react';

export type TabItem = {
  /** 一意キー */
  key: string;
  label: string;
  content: ReactNode;
};

type TabsProps = {
  tabs: TabItem[];
  /** 初期表示のタブキー。省略時は先頭 */
  defaultKey?: string;
};

/**
 * タブ切り替え。
 *
 * 情報量が多い詳細画面で、サウナ / BBQ・設備 / 宿泊情報 を切り替える。
 * 選択状態は色だけでなく下線でも示す（a11y）。
 * タブは横スクロール可能にし、はみ出しても操作できるようにする。
 */
export function Tabs({ tabs, defaultKey }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);
  const baseId = useId();

  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-6">
      {/* タブヘッダー。下線で区切る */}
      <div
        role="tablist"
        aria-label="詳細の切り替え"
        className="flex gap-1 overflow-x-auto border-b border-line"
      >
        {tabs.map((tab) => {
          const selected = tab.key === activeTab?.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={[
                'relative min-h-[44px] shrink-0 px-4 text-[14px] transition-colors',
                selected ? 'text-accent' : 'text-ink-muted hover:text-ink',
              ].join(' ')}
            >
              {tab.label}
              {selected ? (
                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-accent" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* パネル */}
      {activeTab !== undefined ? (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeTab.key}`}
          aria-labelledby={`${baseId}-tab-${activeTab.key}`}
        >
          {activeTab.content}
        </div>
      ) : null}
    </div>
  );
}
