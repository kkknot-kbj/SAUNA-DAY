import { Icon } from '@/components/ui/Icon';
import { UNKNOWN } from '@/lib/utils/format';

type TempGaugeProps = {
  /** 見出し（「サウナ室」「水風呂」など） */
  label: string;
  /** アイコン名（lucide） */
  icon: string;
  /** 温度の下限。null は不明 */
  min: number | null;
  /** 温度の上限。null は不明 */
  max: number | null;
  /** ゲージの表示範囲（この幅の中で min〜max を帯にする） */
  scaleMin: number;
  scaleMax: number;
  /** 帯の色。'hot'（サウナ）か 'cold'（水風呂） */
  tone: 'hot' | 'cold';
};

/** min/max を「XX℃〜YY℃」に。片方だけなら片側表記。両方 null は「不明」 */
function formatRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return UNKNOWN;
  if (min !== null && max !== null) return min === max ? `${min}℃` : `${min}℃〜${max}℃`;
  if (min !== null) return `${min}℃〜`;
  return `〜${max}℃`;
}

/** 値をスケール内の 0..100% に変換（範囲外はクランプ） */
function toPct(value: number, scaleMin: number, scaleMax: number): number {
  const p = ((value - scaleMin) / (scaleMax - scaleMin)) * 100;
  return Math.max(0, Math.min(100, p));
}

/**
 * 温度帯のゲージ。
 *
 * 数値だけでは伝わりにくい「熱さ・冷たさの度合い」を帯で視覚化する。
 * 温度が不明なゲージは帯を出さず「不明」とだけ示す（推測で帯を描かない）。
 */
export function TempGauge({ label, icon, min, max, scaleMin, scaleMax, tone }: TempGaugeProps) {
  const known = min !== null || max !== null;
  // 帯の左端・幅。片側不明ならもう片方を点として少し幅を持たせる
  const lo = min ?? max ?? 0;
  const hi = max ?? min ?? 0;
  const left = toPct(lo, scaleMin, scaleMax);
  const width = Math.max(toPct(hi, scaleMin, scaleMax) - left, 2);

  const barColor = tone === 'hot' ? 'bg-accent' : 'bg-ink';

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[13px] text-ink-muted">
          <Icon name={icon} size={16} className="text-ink-faint" />
          {label}
        </span>
        <span className={known ? 'nums text-[15px] text-ink' : 'text-[15px] text-ink-faint'}>
          {formatRange(min, max)}
        </span>
      </div>

      {/* ゲージトラック */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-line">
        {known ? (
          <div
            className={`absolute inset-y-0 rounded-full ${barColor}`}
            style={{ left: `${left}%`, width: `${width}%` }}
          />
        ) : null}
      </div>

      {/* スケールの目盛り */}
      <div className="flex justify-between text-[11px] text-ink-faint">
        <span className="nums">{scaleMin}℃</span>
        <span className="nums">{scaleMax}℃</span>
      </div>
    </div>
  );
}
