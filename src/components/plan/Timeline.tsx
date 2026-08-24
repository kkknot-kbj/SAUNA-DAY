import { Icon } from '@/components/ui/Icon';
import { UNKNOWN } from '@/lib/utils/format';

import type { ResolvedPlanItem } from '@/lib/types';

const REF_ICONS: Record<ResolvedPlanItem['refType'], string> = {
  sauna: 'Flame',
  restaurant: 'UtensilsCrossed',
  spot: 'MapPin',
  hotel: 'BedDouble',
};

type TimelineRow = {
  time: string | null;
  title: string;
  meta: string | null;
  icon: string;
  /** プランの中心（サウナ）を視覚的に際立たせる */
  emphasis?: boolean;
  /** 参照先が失われている場合 */
  missing?: boolean;
};

/** 解決済みのプラン項目を表示行に変換する */
export function toTimelineRow(item: ResolvedPlanItem): TimelineRow {
  if (item.place === null) {
    // 推測で補完しない（要件14-7）
    return {
      time: item.startTime,
      title: '情報が取得できません',
      meta: null,
      icon: 'CircleHelp',
      missing: true,
    };
  }

  const icon = REF_ICONS[item.refType];

  switch (item.place.kind) {
    case 'sauna':
      return {
        time: item.startTime,
        title: item.place.value.name,
        meta: item.note,
        icon,
        emphasis: true,
      };
    case 'restaurant':
      return {
        time: item.startTime,
        title: item.place.value.name,
        meta: item.place.value.genre,
        icon,
      };
    case 'spot':
      return { time: item.startTime, title: item.place.value.name, meta: item.note, icon };
    case 'hotel':
      return { time: item.startTime, title: item.place.value.name, meta: item.note, icon };
  }
}

/**
 * 休日プランの時系列（要件12-4）。
 *
 * IMPORTANT: プランの中心がサウナであることが視覚的に明確であること（要件12-8）。
 * サウナの行だけアクセント色と太い罫線で強調する。
 */
export function Timeline({ rows }: { rows: TimelineRow[] }) {
  return (
    <ol className="flex flex-col">
      {rows.map((row, index) => (
        <li key={`${row.title}-${index}`} className="flex gap-4">
          {/* 縦線とアイコン */}
          <div className="flex flex-col items-center">
            <div
              className={[
                'flex size-9 shrink-0 items-center justify-center rounded-full border',
                row.emphasis
                  ? 'border-accent bg-accent-weak text-accent'
                  : 'border-line bg-base text-ink-faint',
              ].join(' ')}
            >
              <Icon name={row.icon} size={16} />
            </div>
            {index < rows.length - 1 ? <div className="w-px flex-1 bg-line" /> : null}
          </div>

          <div className="flex flex-1 flex-col gap-0.5 pb-8">
            <span className={row.time === null ? 'text-[13px] text-ink-faint' : 'nums text-[13px] text-ink-muted'}>
              {row.time ?? UNKNOWN}
            </span>
            <span
              className={[
                row.emphasis ? 'font-serif text-[19px] text-ink' : 'text-[15px] text-ink',
                row.missing === true ? 'text-ink-faint' : '',
              ].join(' ')}
            >
              {row.title}
            </span>
            {row.meta !== null ? (
              <span className="text-[13px] text-ink-muted">{row.meta}</span>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

export type { TimelineRow };
