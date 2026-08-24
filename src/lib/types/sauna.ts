import type { Proximity, TagRef } from './taxonomy';

/**
 * 営業時間。
 * 不明な曜日は null を入れる。空文字や「未定」で埋めない。
 */
export type DayHours = { open: string; close: string } | null;

export type BusinessHours = {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
  note: string | null;
};

export type SaunaImage = {
  url: string | null;
  /** a11y のため必須。空文字にしない */
  alt: string;
};

/**
 * クールダウン体験。
 * 「水風呂」に限定せず、川・湖・海・雪などを同じ構造で扱う。
 * boolean 属性は null（不明）と false（不可）を区別する。
 */
export type Cooldown = {
  key: string;
  waterTempMin: number | null;
  waterTempMax: number | null;
  depthCm: number | null;
  canDive: boolean | null;
  isNatural: boolean | null;
  hasFlow: boolean | null;
  note: string | null;
};

/**
 * 施設の周囲にある自然。
 * 「近くにある / 見える」を表す。実際に入れるかは Cooldown 側。
 */
export type SaunaEnvironment = {
  key: string;
  proximity: Proximity;
};

/** 検索結果カードに必要な最小の情報 */
export type SaunaSummary = {
  id: string;
  slug: string;
  name: string;
  prefecture: string;
  area: string | null;
  heroImage: SaunaImage | null;
  /** 表示は3〜4件に絞る */
  primaryTags: TagRef[];
  /** null は「不明」と表示する */
  priceMin: number | null;
  /** 出発地からの導出値。null は「不明」 */
  travelMinutes: number | null;
};

/** 詳細画面で表示する全項目 */
export type SaunaDetail = SaunaSummary & {
  description: string | null;
  priceMax: number | null;
  priceNote: string | null;
  capacityMin: number | null;
  capacityMax: number | null;
  /** サウナ室の温度 */
  tempMin: number | null;
  tempMax: number | null;
  businessHours: BusinessHours | null;
  closedNote: string | null;
  parkingNote: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  /** null なら予約導線を表示しない。推測URLを作らない */
  reservationUrl: string | null;
  officialUrl: string | null;
  phone: string | null;
  supportsDayTrip: boolean;
  supportsLodging: boolean;
  images: SaunaImage[];
  /** タイプ / 熱源 / 設備 / 外気浴 / 貸切 / 利用条件 / アクセス */
  features: TagRef[];
  environments: SaunaEnvironment[];
  cooldowns: Cooldown[];
  experiences: TagRef[];
  /** 0..1 に正規化済み */
  popularityScore: number;
};
