import type {
  Amenity,
  BbqInfo,
  BusinessHours,
  Cooldown,
  DayHours,
  LodgingInfo,
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

  const base: MockSauna = {
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
    lodging: null,
    bbq: null,
    heroImage: { url: null, alt },
    images: [{ url: null, alt }],
    featuredUntil: null,
    featuredCopy: null,
    saunaTempMin: input.tempMin ?? null,
    saunaTempMax: input.tempMax ?? null,
    coolTempMin: null,
    coolTempMax: null,
    ...input,
  };

  // カード表示用の導出値。最も冷たいクールダウンの水温レンジ
  const withTemp = base.cooldowns.filter((c) => c.waterTempMin !== null);
  const coldest =
    withTemp.length === 0
      ? null
      : withTemp.reduce((a, b) =>
          (a.waterTempMin ?? Infinity) <= (b.waterTempMin ?? Infinity) ? a : b,
        );
  base.coolTempMin = coldest?.waterTempMin ?? null;
  base.coolTempMax = coldest?.waterTempMax ?? null;

  // 宿泊対応で lodging 未指定なら、汎用の宿泊情報を補完する。
  // 個別に詳しい lodging を持つ施設はそのまま尊重する。
  if (base.supportsLodging && base.lodging === null) {
    base.lodging = lodging({
      checkIn: '15:00',
      checkOut: '10:00',
      selfCheckIn: true,
      maxGuests: base.capacityMax,
      stayNote: '1泊〜',
      amenityKeys: ['wifi', 'kitchen', 'fridge', 'aircon', 'parking', 'towel'],
    });
  }

  return base;
}

/** よく使うアメニティの定義。key と lucide アイコンを対応させる */
const AMENITY_DEFS: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'Wi-Fi', icon: 'Wifi' },
  kitchen: { label: 'キッチン', icon: 'CookingPot' },
  fridge: { label: '冷蔵庫', icon: 'Refrigerator' },
  aircon: { label: '冷暖房', icon: 'AirVent' },
  parking: { label: '駐車場', icon: 'CircleParking' },
  pets: { label: 'ペット可', icon: 'PawPrint' },
  washer: { label: '洗濯機', icon: 'WashingMachine' },
  tv: { label: 'テレビ', icon: 'Tv' },
  bath: { label: '内風呂', icon: 'Bath' },
  towel: { label: 'タオル', icon: 'Shirt' },
  bbq: { label: 'BBQ', icon: 'Flame' },
  projector: { label: 'プロジェクター', icon: 'Projector' },
};

/** アメニティの key 配列から Amenity[] を組み立てる。未定義キーは無視 */
export function amenities(keys: string[]): Amenity[] {
  return keys.flatMap((key): Amenity[] => {
    const def = AMENITY_DEFS[key];
    return def === undefined ? [] : [{ key, label: def.label, icon: def.icon }];
  });
}

type LodgingInput = {
  checkIn?: string | null;
  checkOut?: string | null;
  selfCheckIn?: boolean | null;
  maxGuests?: number | null;
  stayNote?: string | null;
  amenityKeys?: string[];
};

/** 宿泊情報。省略した属性は null（不明）になる */
export function lodging(input: LodgingInput): LodgingInfo {
  return {
    checkIn: input.checkIn ?? null,
    checkOut: input.checkOut ?? null,
    selfCheckIn: input.selfCheckIn ?? null,
    maxGuests: input.maxGuests ?? null,
    stayNote: input.stayNote ?? null,
    amenities: amenities(input.amenityKeys ?? []),
  };
}

type BbqInput = {
  roofed?: boolean | null;
  equipmentRental?: boolean | null;
  ingredientsByoOk?: boolean | null;
  note?: string | null;
};

/** BBQ 情報。省略した属性は null（不明）になる */
export function bbq(input: BbqInput): BbqInfo {
  return {
    roofed: input.roofed ?? null,
    equipmentRental: input.equipmentRental ?? null,
    ingredientsByoOk: input.ingredientsByoOk ?? null,
    note: input.note ?? null,
  };
}
