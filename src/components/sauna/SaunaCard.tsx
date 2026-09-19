import Link from 'next/link';

import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { TagRow } from '@/components/ui/Tag';
import { iconOf, labelOf } from '@/lib/taxonomy/terms';
import { UNKNOWN, formatDuration, formatMatchRatio, formatPriceFrom } from '@/lib/utils/format';

import type { SaunaSummary, ScoreBreakdown } from '@/lib/types';

type SaunaCardProps = {
  sauna: SaunaSummary;
  /** 検索結果では条件一致率を出す。一覧表示では省略する */
  score?: ScoreBreakdown;
  /** 「東京から」の出発地名 */
  originLabel?: string | null;
  priority?: boolean;
};

/**
 * 施設カード（要件7）。
 *
 * 写真を最も大きな要素として扱う。
 * 料金・所要時間が不明なら「不明」と表示し、推測値を出さない。
 */
export function SaunaCard({ sauna, score, originLabel, priority = false }: SaunaCardProps) {
  const tags = sauna.primaryTags.slice(0, 4).map((ref) => ({
    label: labelOf(ref),
    icon: iconOf(ref),
  }));

  const matchRatio =
    score === undefined
      ? null
      : formatMatchRatio(
          score.conditionMatch.matched.length,
          score.conditionMatch.matched.length + score.conditionMatch.unmatched.length,
        );

  const travel =
    sauna.travelMinutes === null ? null : formatDuration(sauna.travelMinutes);

  return (
    <Link href={`/saunas/${sauna.slug}`} className="group flex flex-col gap-3">
      <Photo
        url={sauna.heroImage?.url ?? null}
        alt={sauna.heroImage?.alt ?? `${sauna.name}の写真`}
        ratio="3/2"
        priority={priority}
      />

      <div className="flex flex-col gap-2">
        <h3 className="font-serif text-[19px] leading-snug text-ink group-hover:text-accent">
          {sauna.name}
        </h3>

        <p className="text-[13px] text-ink-faint">
          {sauna.prefecture}{sauna.area !== null ? ` ${sauna.area}` : ''}
        </p>

        {/* サウナ室温度・水風呂温度を一目で。参考: SaunaTrip のカード */}
        {sauna.saunaTempMax !== null || sauna.coolTempMin !== null ? (
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Icon name="Flame" size={16} className="text-ink-faint" />
              サウナ
              <span className="nums text-ink">
                {sauna.saunaTempMax !== null ? `${sauna.saunaTempMax}℃` : UNKNOWN}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
              <Icon name="Droplet" size={16} className="text-ink-faint" />
              水風呂
              <span className="nums text-ink">
                {sauna.coolTempMin !== null ? `${sauna.coolTempMin}℃` : UNKNOWN}
              </span>
            </span>
          </div>
        ) : null}

        <TagRow items={tags} />

        <div className="flex flex-col gap-1 pt-1">
          {matchRatio !== null ? (
            <p className="text-[13px] text-ink-muted">
              あなたの条件 <span className="nums text-ink">{matchRatio}</span>
            </p>
          ) : null}

          <p className="text-[13px] text-ink-muted">
            {travel === null ? (
              <>所要時間{UNKNOWN}</>
            ) : (
              <>
                {originLabel !== null && originLabel !== undefined ? `${originLabel}から` : ''}
                <span className="nums">{travel}</span>
                <span className="ml-1 text-ink-faint">目安</span>
              </>
            )}
          </p>

          <p className="nums text-[15px] text-ink">{formatPriceFrom(sauna.priceMin)}</p>
        </div>
      </div>
    </Link>
  );
}
