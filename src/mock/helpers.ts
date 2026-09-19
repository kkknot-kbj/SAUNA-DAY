import type {
  BusinessHours,
  Cooldown,
  DayHours,
  SaunaDetail,
  SaunaEnvironment,
  TagRef,
  TaxonomyCategory,
} from '@/lib/types';

/** モックが保持する施設データ。travelMinutes は出発地から導出するので持たない */
export type MockSauna = Omit<SaunaDetail, 'travelMinutes'>;

/** タグ参照の短縮 */
export function tag(category: TaxonomyCategory, key: string): TagRef {
  return { category, key };
}

/** 全曜日同じ営業時間 */
export function everyday(open: string, close: string, note: string | null = null): BusinessHours {
  const h: DayHours = { open, close };
  return { mon: h, tue: h, wed: h, thu: h, fri: h, sat: h, sun: h, note };
}

/** 定休日を指定した営業時間 */
export function withClosed(
  open: string,
  close: string,
  closedDays: (keyof Omit<BusinessHours, 'note'>)[],
  note: string | null = null,
): BusinessHours {
  const base = everyday(open, close, note);
  for (const day of closedDays) {
    base[day] = null;
  }
  return base;
}

/** 環境（近くにある・見える） */
export function env(key: string, proximity: SaunaEnvironment['proximity']): SaunaEnvironment {
  return { key, proximity };
}

type CooldownInput = {
  key: string;
  tempMin?: number | null;
  tempMax?: number | null;
  depthCm?: number | null;
  canDive?: boolean | null;
  isNatural?: boolean | null;
  hasFlow?: boolean | null;
  note?: string | null;
};

/** クールダウン。省略した属性は null（不明）になる */
export function cool(input: CooldownInput): Cooldown {
  return {
    key: input.key,
    waterTempMin: input.tempMin ?? null,
    waterTempMax: input.tempMax ?? null,
    depthCm: input.depthCm ?? null,
    canDive: input.canDive ?? null,
    isNatural: input.isNatural ?? null,
    hasFlow: input.hasFlow ?? null,
    note: input.note ?? null,
  };
}

type SaunaInput = Pick<
  MockSauna,
  | 'id'
  | 'slug'
  | 'name'
  | 'prefecture'
  | 'lat'
  | 'lng'
  | 'primaryTags'
  | 'features'
  | 'environments'
  | 'cooldowns'
  | 'experiences'
  | 'popularityScore'
> &
  Partial<MockSauna>;

/**
 * 省略した項目を null（不明）で埋める。
 * 0 や空文字で埋めないこと。
 */
export function defineSauna(input: SaunaInput): MockSauna {
  const alt = `${input.name}のサウナ棟と外気浴スペース`;
  return {
    description: null,
    area: null,
    address: null,
    priceMin: null,
    priceMax: null,
    priceNote: null,
    capacityMin: null,
    capacityMax: null,
    tempMin: null,
    tempMax: null,
    businessHours: null,
    closedNote: null,
    parkingNote: null,
    reservationUrl: null,
    officialUrl: null,
    phone: null,
    supportsDayTrip: false,
    supportsLodging: true,
    heroImage: { url: null, alt },
    images: [{ url: null, alt }],
    featuredUntil: null,
    featuredCopy: null,
    ...input,
  };
}
