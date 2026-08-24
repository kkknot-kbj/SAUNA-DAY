'use client';

import { Icon } from './Icon';

type StepperProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  /** 値の後ろに付ける単位（「人」など） */
  unit?: string;
  /** 未指定であることを示すラベル */
  placeholder?: string;
  label: string;
};

/** 人数などの増減。未指定（null）を保持できる */
export function Stepper({
  value,
  onChange,
  min = 1,
  max = 20,
  unit = '',
  placeholder = '指定なし',
  label,
}: StepperProps) {
  const current = value ?? min;
  const canDecrease = value !== null && value > min;
  const canIncrease = value === null || value < max;

  return (
    <div className="inline-flex items-center gap-1 rounded-sm border border-line bg-base">
      <button
        type="button"
        aria-label={`${label}を減らす`}
        disabled={!canDecrease}
        onClick={() => onChange(current - 1)}
        className="flex size-11 items-center justify-center text-ink-muted disabled:opacity-30"
      >
        <Icon name="Minus" size={16} />
      </button>

      <span
        aria-live="polite"
        className={[
          'min-w-[5rem] text-center text-[15px]',
          value === null ? 'text-ink-faint' : 'nums text-ink',
        ].join(' ')}
      >
        {value === null ? placeholder : `${value}${unit}`}
      </span>

      <button
        type="button"
        aria-label={`${label}を増やす`}
        disabled={!canIncrease}
        onClick={() => onChange(value === null ? min : current + 1)}
        className="flex size-11 items-center justify-center text-ink-muted disabled:opacity-30"
      >
        <Icon name="Plus" size={16} />
      </button>
    </div>
  );
}
