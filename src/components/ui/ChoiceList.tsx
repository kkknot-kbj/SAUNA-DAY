'use client';

import { Icon } from './Icon';

type Choice<T> = {
  value: T;
  label: string;
  /** 右側に添える補足（「¥3,000まで」など） */
  meta?: string;
  icon?: string;
};

type ChoiceListProps<T> = {
  label: string;
  choices: readonly Choice<T>[];
  value: T | null;
  onSelect: (value: T) => void;
};

/**
 * 縦積みの単一選択。
 *
 * 1問1画面のステップで使う。横並びのチップより押し間違いが少なく、
 * 選択肢のラベルが長くても読みやすい。
 * 選択状態は色だけでなく罫線とチェックでも示す。
 */
export function ChoiceList<T extends string | number>({
  label,
  choices,
  value,
  onSelect,
}: ChoiceListProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {choices.map((choice) => {
        const selected = value === choice.value;
        return (
          <button
            key={String(choice.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(choice.value)}
            className={[
              'flex min-h-[56px] items-center gap-3 rounded-md px-4 py-3 text-left transition-colors',
              selected
                ? 'border-2 border-accent bg-accent-weak'
                : 'border border-line bg-base hover:border-ink-faint',
            ].join(' ')}
          >
            {choice.icon !== undefined ? (
              <Icon
                name={choice.icon}
                size={20}
                className={selected ? 'text-accent' : 'text-ink-faint'}
              />
            ) : null}

            <span className={`flex-1 text-[16px] ${selected ? 'text-accent' : 'text-ink'}`}>
              {choice.label}
            </span>

            {choice.meta !== undefined ? (
              <span className="nums text-[13px] text-ink-faint">{choice.meta}</span>
            ) : null}

            {selected ? <Icon name="Check" size={20} className="text-accent" /> : null}
          </button>
        );
      })}
    </div>
  );
}
