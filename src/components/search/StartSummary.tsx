'use client';

import { useEffect, useState } from 'react';

import { countMatching } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Stepper } from '@/components/ui/Stepper';
import { formatDateLabel, formatDuration, formatPrice } from '@/lib/utils/format';

import { COMPANION_OPTIONS, STAY_OPTIONS } from './options';

import type { Origin, SearchConditions } from '@/lib/types';

type StartSummaryProps = {
  conditions: SearchConditions;
  origins: Origin[];
  /** 項目をタップしたら該当ステップへ戻る */
  onEdit: (step: number) => void;
  onPartySizeChange: (size: number | null) => void;
  onProceed: () => void;
};

/** 未指定は「指定なし」と出す。事実情報ではないので「不明」は使わない */
const NOT_SET = '指定なし';

function Row({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  const isSet = value !== NOT_SET;
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex min-h-[52px] items-center justify-between gap-4 border-b border-line py-3 text-left hover:bg-base"
    >
      <span className="shrink-0 text-[13px] text-ink-muted">{label}</span>
      <span className="flex items-center gap-2">
        <span className={isSet ? 'nums text-[15px] text-ink' : 'text-[15px] text-ink-faint'}>
          {value}
        </span>
        <Icon name="Pencil" size={16} className="text-ink-faint" />
      </span>
    </button>
  );
}

/**
 * 入力内容の確認。
 *
 * 1問1画面で流したあと、ここで全体を一覧して直せるようにする。
 * 件数を出して手応えを返す（要件2-8）。
 */
export function StartSummary({
  conditions,
  origins,
  onEdit,
  onPartySizeChange,
  onProceed,
}: StartSummaryProps) {
  const { required } = conditions;
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    countMatching(conditions)
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => {
        if (active) setCount(null);
      });
    return () => {
      active = false;
    };
  }, [conditions]);

  const originLabel =
    origins.find((origin) => origin.key === required.originKey)?.labelJa ?? NOT_SET;

  const companionLabel =
    COMPANION_OPTIONS.find((option) => option.value === required.companion)?.label ?? NOT_SET;

  const stayLabel =
    STAY_OPTIONS.find((option) => option.value === required.stayType)?.label ?? NOT_SET;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-[26px] leading-snug text-ink">この条件で探します</h2>
        <p aria-live="polite" className="text-[13px] text-ink-muted">
          {count === null ? (
            '探しています'
          ) : (
            <>
              いま <span className="nums text-ink">{count}</span> 件のサウナが該当します
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col">
        <Row
          label="日付"
          value={required.date === null ? NOT_SET : formatDateLabel(required.date)}
          onEdit={() => onEdit(1)}
        />
        <Row label="誰と" value={companionLabel} onEdit={() => onEdit(2)} />
        <Row label="出発地" value={originLabel} onEdit={() => onEdit(3)} />
        <Row label="日帰り / 宿泊" value={stayLabel} onEdit={() => onEdit(4)} />
        <Row
          label="移動時間"
          value={
            required.maxTravelMinutes === null
              ? NOT_SET
              : `${formatDuration(required.maxTravelMinutes)}以内`
          }
          onEdit={() => onEdit(5)}
        />
        <Row
          label="予算"
          value={required.budgetMax === null ? NOT_SET : `${formatPrice(required.budgetMax)}まで`}
          onEdit={() => onEdit(6)}
        />
      </div>

      {/* 人数はここで微調整する。ステップでは同行者タイプから自動で入る */}
      <div className="flex flex-col gap-2">
        <span className="text-[13px] text-ink-muted">人数</span>
        <Stepper
          label="人数"
          value={required.partySize}
          onChange={onPartySizeChange}
          unit="人"
          min={1}
          max={20}
        />
      </div>

      <Button block onClick={onProceed}>
        サウナの条件を選ぶ
      </Button>

      {count === 0 ? (
        <p className="text-[13px] text-ink-muted">
          該当が0件です。条件をゆるめると候補が見つかります。
        </p>
      ) : null}
    </div>
  );
}

export { NOT_SET };
