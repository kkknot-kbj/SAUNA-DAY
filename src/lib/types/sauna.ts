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
  /** 今月のおすすめ表示期限。null = 非掲載 */
  featuredUntil: string | null;
  /** おすすめカード内のキャッチコピー */
  featuredCopy: string | null;
  /** サウナ室温度（カードの一目表示用）。null は「不明」 */
  saunaTempMax: number | null;
  /** 主要なクールダウンの水温（カードの一目表示用）。null は「不明」 */
  coolTempMin: number | null;
};

/**
 * 宿泊情報。一棟貸し・貸別荘としての情報。
 * 日帰り専用施設では null。
 */
export type LodgingInfo = {
  /** チェックイン時刻 HH:mm。不明は null */
  checkIn: string | null;
  /** チェックアウト時刻 HH:mm。不明は null */
  checkOut: string | null;
  /** セルフチェックインか。不明は null */
  selfCheckIn: boolean | null;
  /** 宿泊できる最大人数。不明は null */
  maxGuests: number | null;
  /** 最低宿泊数の補足（例「1泊〜」）。不明は null */
  stayNote: string | null;
  /** Airbnb 的な設備。key は lucide アイコンに対応させる */
  amenities: Amenity[];
};

/** 宿の設備。絵文字は使わず lucide アイコンで表す */
export type Amenity = {
  /** 'wifi' | 'kitchen' | 'fridge' | 'parking' | 'pets' 等 */
  key: string;
  label: string;
  /** lucide-react のアイコン名 */
  icon: string;
};

/**
 * BBQ スペースの情報。
 * BBQ 設備がない施設では null。
 */
export type BbqInfo = {
  /** 屋根付きか。不明は null */
  roofed: boolean | null;
  /** 器材レンタルの有無。不明は null */
  equipmentRental: boolean | null;
  /** 食材持ち込み可か。不明は null */
  ingredientsByoOk: boolean | null;
  /** 補足の一言。事実情報のみ */
  note: string | null;
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
  /** 宿泊情報。日帰り専用施設は null */
  lodging: LodgingInfo | null;
  /** BBQ スペースの情報。BBQ 不可の施設は null */
  bbq: BbqInfo | null;
  images: SaunaImage[];
  /** タイプ / 熱源 / 設備 / 外気浴 / 貸切 / 利用条件 / アクセス */
  features: TagRef[];
  environments: SaunaEnvironment[];
  cooldowns: Cooldown[];
  experiences: TagRef[];
  /** 0..1 に正規化済み */
  popularityScore: number;
};
