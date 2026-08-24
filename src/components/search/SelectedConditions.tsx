'use client';

import { Icon } from '@/components/ui/Icon';
import { CATEGORY_LABELS, labelOf } from '@/lib/taxonomy/terms';

import type { TagRef } from '@/lib/types';

type SelectedConditionsProps = {
  mustTags: TagRef[];
  wishTags: TagRef[];
  /** 必須 → 希望 に落とす */
  onDowngrade: (tag: TagRef) => void;
  /** 希望 → 必須 に上げる */
  onUpgrade: (tag: TagRef) => void;
  /** 選択を外す */
  onClear: (tag: TagRef) => void;
};

function Row({
  tag,
  actionLabel,
  actionIcon,
  onAction,
  onClear,
}: {
  tag: TagRef;
  actionLabel: string;
  actionIcon: string;
  onAction: () => void;
  onClear: () => void;
}) {
  return (
    <li className="flex items-center gap-2 border-b border-line py-2">
      <span className="flex-1 text-[14px] text-ink">
        {labelOf(tag)}
        <span className="ml-2 text-[12px] text-ink-faint">{CATEGORY_LABELS[tag.category]}</span>
      </span>

      <button
        type="button"
        onClick={onAction}
        className="inline-flex min-h-[44px] items-center gap-1 px-2 text-[12px] text-accent hover:text-accent-hover"
      >
        <Icon name={actionIcon} size={16} />
        {actionLabel}
      </button>

      <button
        type="button"
        onClick={onClear}
        aria-label={`${labelOf(tag)}を外す`}
        className="flex size-11 items-center justify-center text-ink-faint hover:text-ink"
      >
        <Icon name="X" size={16} />
      </button>
    </li>
  );
}

/**
 * 選択中の条件の一覧。
 *
 * チップを見れば選択状態は分かるが、カテゴリを跨いで
 * 「いま何を必須にしているか」を確認したいので、ここにまとめて出す。
 * 必須と希望の入れ替えもここでできる。
 */
export function SelectedConditions({
  mustTags,
  wishTags,
  onDowngrade,
  onUpgrade,
  onClear,
}: SelectedConditionsProps) {
  if (mustTags.length === 0 && wishTags.length === 0) return null;

  return (
    <div className="flex flex-col gap-6 rounded-md border border-line bg-base p-4">
      {mustTags.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="flex items-center gap-1.5 text-[14px] text-ink">
              <Icon name="Lock" size={16} className="text-accent" />
              必須にしている条件
            </h3>
            <span className="nums text-[12px] text-ink-faint">{mustTags.length}</span>
          </div>
          <p className="text-[12px] text-ink-muted">
            これを満たさない施設は結果に出ません。
          </p>
          <ul className="flex flex-col">
            {mustTags.map((tag) => (
              <Row
                key={`${tag.category}:${tag.key}`}
                tag={tag}
                actionLabel="希望にする"
                actionIcon="ArrowDown"
                onAction={() => onDowngrade(tag)}
                onClear={() => onClear(tag)}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {wishTags.length > 0 ? (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="flex items-center gap-1.5 text-[14px] text-ink">
              <Icon name="Check" size={16} className="text-ink-muted" />
              希望している条件
            </h3>
            <span className="nums text-[12px] text-ink-faint">{wishTags.length}</span>
          </div>
          <p className="text-[12px] text-ink-muted">
            満たす数が多い施設を上に並べます。
          </p>
          <ul className="flex flex-col">
            {wishTags.map((tag) => (
              <Row
                key={`${tag.category}:${tag.key}`}
                tag={tag}
                actionLabel="必須にする"
                actionIcon="ArrowUp"
                onAction={() => onUpgrade(tag)}
                onClear={() => onClear(tag)}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
