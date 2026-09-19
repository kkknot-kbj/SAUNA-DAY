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

        {/* サウナ室温度・水風呂温度をバーで一目に。参考: SaunaTrip のカード */}
        <div className="flex flex-col gap-2">
          <CardTempBar
            icon="Flame"
            label="サウナ"
            min={sauna.saunaTempMin}
            max={sauna.saunaTempMax}
            scaleMin={60}
            scaleMax={120}
            tone="hot"
          />
          <CardTempBar
            icon="Droplet"
            label="水風呂"
            min={sauna.coolTempMin}
            max={sauna.coolTempMax}
            scaleMin={0}
            scaleMax={30}
            tone="cold"
          />
        </div>

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

type CardTempBarProps = {
  icon: string;
  label: string;
  min: number | null;
  max: number | null;
  scaleMin: number;
  scaleMax: number;
  tone: 'hot' | 'cold';
};

/** カード用のコンパクトな温度バー。ラベル + 帯 + 数値を1行に収める */
function CardTempBar({ icon, label, min, max, scaleMin, scaleMax, tone }: CardTempBarProps) {
  const known = min !== null || max !== null;
  const clamp = (v: number) =>
    Math.max(0, Math.min(100, ((v - scaleMin) / (scaleMax - scaleMin)) * 100));
  const lo = min ?? max ?? 0;
  const hi = max ?? min ?? 0;
  const left = clamp(lo);
  const width = Math.max(clamp(hi) - left, 3);

  const rangeText =
    !known
      ? UNKNOWN
      : min !== null && max !== null
        ? min === max
          ? `${min}℃`
          : `${min}〜${max}℃`
        : min !== null
          ? `${min}℃〜`
          : `〜${max}℃`;

  const barColor = tone === 'hot' ? 'bg-accent' : 'bg-ink';

  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} size={16} className="shrink-0 text-ink-faint" />
      <span className="w-10 shrink-0 text-[12px] text-ink-muted">{label}</span>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line">
        {known ? (
          <span
            className={`absolute inset-y-0 rounded-full ${barColor}`}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        ) : null}
      </span>
      <span
        className={
          known ? 'nums w-16 shrink-0 text-right text-[12px] text-ink' : 'w-16 shrink-0 text-right text-[12px] text-ink-faint'
        }
      >
        {rangeText}
      </span>
    </div>
  );
}
