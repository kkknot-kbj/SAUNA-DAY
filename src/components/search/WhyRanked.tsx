'use client';

import { useState } from 'react';

import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { Tag } from '@/components/ui/Tag';
import { WEIGHT_LABELS } from '@/lib/search';
import { iconOf, labelOf } from '@/lib/taxonomy/terms';

import type { ScoreBreakdown, TagRef, WeightKey } from '@/lib/types';

/** 各要素の 0..1 を横棒で見せる。数値だけより比較しやすい */
function Bar({ label, value }: { label: string; value: number }) {
  const percent = Math.round(value * 100);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink-muted">{label}</span>
        <span className="nums text-[13px] text-ink">{percent}</span>
      </div>
      <div className="h-1 w-full bg-line">
        <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

/**
 * ランキング理由の開示（要件8）。
 *
 * IMPORTANT: AIへの言及を含めない。
 * スコアは決定的な計算なので、その内訳をそのまま見せる。
 *
 * 必須条件は「全件が満たしている前提」なので順位には効かない。
 * 何で絞られているかを伝えるため、内訳とは分けて先に示す。
 */
export function WhyRanked({
  score,
  mustTags = [],
}: {
  score: ScoreBreakdown;
  mustTags?: TagRef[];
}) {
  const [open, setOpen] = useState(false);

  const rows: { key: WeightKey; value: number }[] = [
    { key: 'condition_match', value: score.conditionMatch.ratio },
    { key: 'distance', value: score.distance.normalized },
    { key: 'price', value: score.price.normalized },
    { key: 'popularity', value: score.popularity.normalized },
    { key: 'preference', value: score.preference.normalized },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-1.5 text-[13px] text-accent hover:text-accent-hover"
      >
        <Icon name="Info" size={16} />
        <span>なぜこの順番？</span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="なぜこの順番？">
        <div className="flex flex-col gap-8">
          {mustTags.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="flex items-center gap-1.5 text-[14px] text-ink">
                <Icon name="Lock" size={16} className="text-accent" />
                必須にした条件
              </h3>
              <p className="text-[12px] text-ink-muted">
                これを満たす施設だけを表示しています。順位には影響しません。
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {mustTags.map((ref) => (
                  <Tag key={`${ref.category}:${ref.key}`} label={labelOf(ref)} icon={iconOf(ref)} />
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-4">
            <p className="text-[13px] text-ink-muted">
              次の5つを組み合わせて並べています。数値は100点満点の目安です。
            </p>
            <div className="flex flex-col gap-4">
              {rows.map((row) => (
                <Bar key={row.key} label={WEIGHT_LABELS[row.key]} value={row.value} />
              ))}
            </div>
          </div>

          {score.conditionMatch.matched.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[14px] text-ink">満たしている条件</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {score.conditionMatch.matched.map((ref) => (
                  <Tag key={`${ref.category}:${ref.key}`} label={labelOf(ref)} icon={iconOf(ref)} />
                ))}
              </div>
            </div>
          ) : null}

          {score.conditionMatch.unmatched.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <h3 className="text-[14px] text-ink">満たしていない条件</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {score.conditionMatch.unmatched.map((ref) => (
                  <Tag key={`${ref.category}:${ref.key}`} label={labelOf(ref)} icon="Minus" />
                ))}
              </div>
            </div>
          ) : null}

          {score.preference.normalized === 0 ? (
            <p className="text-[12px] text-ink-faint">
              「過去の選択」は、行きたいに保存したサウナが増えると反映されます。
            </p>
          ) : null}
        </div>
      </Sheet>
    </>
  );
}
