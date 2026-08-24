'use client';

import { Icon } from './Icon';

import type { TagLevel } from '@/lib/types';

type ChipProps = {
  label: string;
  level: TagLevel;
  /** タップで 未選択 → 希望 → 必須 → 未選択 と進める */
  onCycle: () => void;
  /** lucide-react のアイコン名 */
  icon?: string;
};

const STYLES: Record<TagLevel, string> = {
  none: 'border border-line bg-base text-ink-muted hover:border-ink-faint hover:text-ink',
  // 希望：枠で示す
  wish: 'border-2 border-accent bg-accent-weak text-accent',
  // 必須：塗りで示す。希望より強い指定であることが一目で分かるようにする
  must: 'border-2 border-accent bg-accent text-base',
};

const LEVEL_LABELS: Record<TagLevel, string> = {
  none: '未選択',
  wish: '希望',
  must: '必須',
};

/**
 * 条件の選択肢。3段階の強さを持つ。
 *
 * IMPORTANT: 状態を色だけで表さない（a11y）。
 * 罫線の太さとアイコン（チェック / 鍵）、および必須では文字ラベルも併用する。
 */
export function Chip({ label, level, onCycle, icon }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onCycle}
      // 3状態なので checkbox ではなく、状態を aria-label で明示する
      aria-label={`${label}（${LEVEL_LABELS[level]}）`}
      className={[
        'inline-flex min-h-[44px] items-center gap-1.5 rounded-sm px-3 py-2 text-[14px] transition-colors',
        STYLES[level],
      ].join(' ')}
    >
      {level === 'must' ? (
        <Icon name="Lock" size={16} />
      ) : level === 'wish' ? (
        <Icon name="Check" size={16} />
      ) : icon !== undefined ? (
        <Icon name={icon} size={16} />
      ) : null}

      <span>{label}</span>

      {/* 必須は色とアイコンに加えて文字でも示す */}
      {level === 'must' ? <span className="text-[11px] opacity-80">必須</span> : null}
    </button>
  );
}
