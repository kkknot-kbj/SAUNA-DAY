import { UNKNOWN } from '@/lib/utils/format';

import type { ReactNode } from 'react';

type StatProps = {
  label: string;
  /**
   * 表示する値。
   * null を渡すと「不明」と表示する。
   */
  value: string | null;
  /** 値の下に添える補足（「目安」など） */
  note?: string | null;
};

/**
 * ラベルと値の組。
 *
 * IMPORTANT: 「不明」の表示をここに集約する。
 * 各画面で `?? '不明'` を書かないこと。
 * 事実情報が欠けているときに推測値で埋めるのを構造的に防ぐ。
 */
export function Stat({ label, value, note }: StatProps) {
  const isUnknown = value === null;

  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3">
      <dt className="shrink-0 text-[13px] text-ink-muted">{label}</dt>
      <dd className="text-right">
        <span className={isUnknown ? 'text-[15px] text-ink-faint' : 'nums text-[15px] text-ink'}>
          {isUnknown ? UNKNOWN : value}
        </span>
        {note !== undefined && note !== null && !isUnknown ? (
          <span className="ml-1.5 text-[12px] text-ink-faint">{note}</span>
        ) : null}
      </dd>
    </div>
  );
}

/** Stat を並べる定義リスト */
export function StatList({ children }: { children: ReactNode }) {
  return <dl className="border-t border-line">{children}</dl>;
}
