import type { BusinessHours, DayHours } from '@/lib/types';

/**
 * 事実情報が欠けているときの表示。
 * 推測や平均値で埋めない（.kiro/steering/data-integrity.md）。
 */
export const UNKNOWN = '不明';

/** 料金。null は「不明」 */
export function formatPrice(value: number | null): string {
  if (value === null) return UNKNOWN;
  return `¥${value.toLocaleString('ja-JP')}`;
}

/** 「¥4,800〜」の形。下限が不明なら「不明」 */
export function formatPriceFrom(min: number | null): string {
  if (min === null) return UNKNOWN;
  return `${formatPrice(min)}〜`;
}

/** 「¥4,800〜¥7,000」。上限が不明なら「〜」で止める */
export function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return UNKNOWN;
  if (min === null) return `〜${formatPrice(max)}`;
  if (max === null) return formatPriceFrom(min);
  if (min === max) return formatPrice(min);
  return `${formatPrice(min)}〜${formatPrice(max)}`;
}

/** 分 → 「1時間40分」。null は「不明」 */
export function formatDuration(minutes: number | null): string {
  if (minutes === null) return UNKNOWN;
  if (minutes < 60) return `${minutes}分`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}時間` : `${hours}時間${rest}分`;
}

/**
 * 「東京から1時間40分」。
 * 導出値なので、呼び出し側で「目安」と分かる文脈に置くこと。
 */
export function formatTravel(originLabel: string | null, minutes: number | null): string {
  if (minutes === null) return `所要時間${UNKNOWN}`;
  const from = originLabel === null ? '' : `${originLabel}から`;
  return `${from}${formatDuration(minutes)}`;
}

/** 温度。「80〜95℃」。両方 null なら「不明」 */
export function formatTempRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return UNKNOWN;
  if (min === null) return `〜${max}℃`;
  if (max === null) return `${min}℃〜`;
  if (min === max) return `${min}℃`;
  return `${min}〜${max}℃`;
}

/** 人数。「2〜6人」 */
export function formatCapacity(min: number | null, max: number | null): string {
  if (min === null && max === null) return UNKNOWN;
  if (min === null) return `〜${max}人`;
  if (max === null) return `${min}人〜`;
  if (min === max) return `${min}人`;
  return `${min}〜${max}人`;
}

/** 水深。「120cm」 */
export function formatDepth(cm: number | null): string {
  return cm === null ? UNKNOWN : `${cm}cm`;
}

/**
 * 可否。
 * null（不明）と false（不可）を区別する。
 */
export function formatBoolean(
  value: boolean | null,
  labels: { yes: string; no: string } = { yes: '可', no: '不可' },
): string {
  if (value === null) return UNKNOWN;
  return value ? labels.yes : labels.no;
}

const DAY_ORDER: readonly (keyof Omit<BusinessHours, 'note'>)[] = [
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'sun',
];

const DAY_LABELS: Record<keyof Omit<BusinessHours, 'note'>, string> = {
  mon: '月',
  tue: '火',
  wed: '水',
  thu: '木',
  fri: '金',
  sat: '土',
  sun: '日',
};

function formatDayHours(hours: DayHours): string {
  return hours === null ? '休' : `${hours.open}〜${hours.close}`;
}

/** 曜日ごとの営業時間を1行ずつ返す。null は「不明」1行 */
export function formatBusinessHours(
  hours: BusinessHours | null,
): { label: string; value: string }[] {
  if (hours === null) return [{ label: '営業時間', value: UNKNOWN }];

  return DAY_ORDER.map((day) => ({
    label: DAY_LABELS[day],
    value: formatDayHours(hours[day]),
  }));
}

/** 「9 / 10」。希望条件が0件なら null（表示しない） */
export function formatMatchRatio(matched: number, total: number): string | null {
  if (total === 0) return null;
  return `${matched} / ${total}`;
}

/** ISO日付 → 「8月24日(月)」 */
export function formatDateLabel(iso: string | null): string {
  if (iso === null) return UNKNOWN;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return UNKNOWN;
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}
