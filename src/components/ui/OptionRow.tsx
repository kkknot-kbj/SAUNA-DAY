'use client';

import { Icon } from './Icon';

type Option<T> = {
  value: T;
  label: string;
  icon?: string;
};

type OptionRowProps<T> = {
  options: readonly Option<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** グループのラベル（スクリーンリーダー用） */
  label: string;
  /** 同じ値を再選択したら未指定に戻す */
  clearable?: boolean;
};

/**
 * 単一選択の並び。
 *
 * 選択状態を色だけで表さない（罫線とチェックを併用）。
 * ドロップダウンにせず並べて見せることで、選択肢の全体像が分かるようにする。
 */
export function OptionRow<T extends string | number>({
  options,
  value,
  onChange,
  label,
  clearable = true,
}: OptionRowProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected && clearable ? null : option.value)}
            className={[
              'inline-flex min-h-[44px] items-center gap-1.5 rounded-sm px-3.5 py-2 text-[14px] transition-colors',
              selected
                ? 'border-2 border-accent bg-accent-weak text-accent'
                : 'border border-line bg-base text-ink-muted hover:border-ink-faint hover:text-ink',
            ].join(' ')}
          >
            {selected ? (
              <Icon name="Check" size={16} />
            ) : option.icon !== undefined ? (
              <Icon name={option.icon} size={16} />
            ) : null}
            <span className={typeof option.value === 'number' ? 'nums' : undefined}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
