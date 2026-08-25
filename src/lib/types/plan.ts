import type { Restaurant, Spot, Hotel } from './linked';
import type { SaunaSummary } from './sauna';

export type PlanRefType = 'sauna' | 'restaurant' | 'spot' | 'hotel';

/**
 * プランの1項目。
 *
 * IMPORTANT: 施設名・料金・営業時間のフィールドを持たせない。
 * DBレコードへの参照だけを保持し、表示時に解決する。
 * この型が AI の出力スキーマそのものなので、事実情報を返す余地を与えない。
 */
export type PlanItem = {
  /** HH:mm。決められない場合は null */
  startTime: string | null;
  refType: PlanRefType;
  /** 候補リストに含まれる ID のみ許可（保存前に検証する） */
  refId: string;
  /** 短い一言コメント。事実情報を書かせない */
  note: string | null;
};

/** 生成された、または保存された休日プラン */
export type HolidayPlan = {
  id: string | null;
  title: string;
  /** ISO 8601 の日付 */
  date: string | null;
  /** プランの中心となるサウナ */
  saunaId: string;
  /** 出発地。項目ではなくプランのメタ情報として持つ */
  originKey: string | null;
  /** HH:mm */
  departureTime: string | null;
  isLodging: boolean;
  items: PlanItem[];
};

/** AI に返させる出力。これ以外のフィールドを受け付けない */
export type PlanOutput = {
  /** プランの概要を表す一言（20文字以内）。例: 「渓流サウナと山の幸を味わう休日」 */
  title: string;
  items: PlanItem[];
};

/**
 * 表示用に参照を解決した項目。
 * 参照先が失われている場合は place を null にし、
 * 「情報が取得できません」と表示する（推測で補完しない）。
 */
export type ResolvedPlanItem = {
  startTime: string | null;
  note: string | null;
  refType: PlanRefType;
  refId: string;
  place:
    | { kind: 'sauna'; value: SaunaSummary }
    | { kind: 'restaurant'; value: Restaurant }
    | { kind: 'spot'; value: Spot }
    | { kind: 'hotel'; value: Hotel }
    | null;
};

export type ResolvedPlan = Omit<HolidayPlan, 'items'> & {
  items: ResolvedPlanItem[];
  originLabel: string | null;
};
