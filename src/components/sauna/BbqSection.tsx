import { Icon } from '@/components/ui/Icon';

import type { BbqInfo } from '@/lib/types';

/** boolean|null を「あり/なし/不明」に */
function yesNo(value: boolean | null): string {
  if (value === null) return '不明';
  return value ? 'あり' : 'なし';
}

/**
 * BBQ スペースの情報カード。
 *
 * サウナ好きの一棟貸しでは BBQ が重要な体験なので、
 * 設備の一項目に埋めず、独立したカードで見せる。
 * BBQ 不可（null）の場合は「BBQ設備なし」と控えめに示す。
 */
export function BbqSection({ bbq }: { bbq: BbqInfo | null }) {
  if (bbq === null) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-line bg-base px-4 py-4">
        <Icon name="Flame" size={20} className="text-ink-faint" />
        <p className="text-[14px] text-ink-faint">BBQ設備の情報はありません</p>
      </div>
    );
  }

  const rows: { label: string; value: string }[] = [
    { label: '屋根', value: yesNo(bbq.roofed) },
    { label: '器材レンタル', value: yesNo(bbq.equipmentRental) },
    { label: '食材持ち込み', value: yesNo(bbq.ingredientsByoOk) },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-md border border-line bg-base p-4">
      <div className="flex items-center gap-2">
        <Icon name="Flame" size={20} className="text-accent" />
        <h3 className="text-[15px] text-ink">BBQスペース</h3>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex flex-col items-center gap-1 rounded-md bg-surface px-2 py-3 text-center"
          >
            <span className="text-[12px] text-ink-muted">{row.label}</span>
            <span
              className={
                row.value === '不明'
                  ? 'text-[14px] text-ink-faint'
                  : 'text-[14px] text-ink'
              }
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {bbq.note !== null ? (
        <p className="text-[13px] leading-relaxed text-ink-muted">{bbq.note}</p>
      ) : null}
    </div>
  );
}
