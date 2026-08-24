'use client';

import { Icon } from '@/components/ui/Icon';

import type { ReactNode } from 'react';

type StepShellProps = {
  /** 1 から始まる現在位置 */
  step: number;
  total: number;
  question: string;
  /** 補足。1行に収める */
  hint?: string;
  children: ReactNode;
  onBack: (() => void) | null;
  onSkip: (() => void) | null;
  /** 「次へ」が必要なステップだけ渡す。単一選択のステップは自動で進む */
  onNext?: (() => void) | null;
};

/**
 * 1問1画面の枠。
 *
 * 進捗・戻る・スキップの置き方をここに統一する。
 * 情報量を絞るため、1画面に問いは1つだけ置く。
 */
export function StepShell({
  step,
  total,
  question,
  hint,
  children,
  onBack,
  onSkip,
  onNext = null,
}: StepShellProps) {
  return (
    <div className="flex min-h-[70vh] flex-col">
      {/* 進捗。細い線と数字だけに留める */}
      <div className="flex flex-col gap-2">
        <div className="h-px w-full bg-line">
          <div
            className="h-px bg-accent transition-[width] duration-300 ease-out motion-reduce:transition-none"
            style={{ width: `${(step / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="nums text-[12px] text-ink-faint">
            {step} / {total}
          </span>
          {onBack !== null ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex min-h-[44px] items-center gap-1 text-[13px] text-ink-muted hover:text-ink"
            >
              <Icon name="ChevronLeft" size={16} />
              戻る
            </button>
          ) : (
            <span />
          )}
        </div>
      </div>

      {/* 問い。ステップの主役 */}
      <div className="flex flex-1 flex-col gap-8 pt-8">
        <div className="flex flex-col gap-2">
          <h2 className="font-serif text-[26px] leading-snug text-ink">{question}</h2>
          {hint !== undefined ? (
            <p className="text-[13px] text-ink-faint">{hint}</p>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">{children}</div>
      </div>

      {/* 送り。すべて任意なのでスキップを常に出す */}
      <div className="flex items-center justify-between gap-4 pt-10">
        {onSkip !== null ? (
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex min-h-[44px] items-center text-[13px] text-ink-muted hover:text-ink"
          >
            指定せず進む
          </button>
        ) : (
          <span />
        )}

        {onNext !== null ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-md bg-accent px-5 text-[15px] text-base hover:bg-accent-hover"
          >
            次へ
            <Icon name="ChevronRight" size={16} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
