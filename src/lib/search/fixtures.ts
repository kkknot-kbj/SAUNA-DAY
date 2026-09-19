import { EMPTY_CONDITIONS } from '@/lib/types';

import type {
  Cooldown,
  SaunaDetail,
  SaunaEnvironment,
  SearchConditions,
  TagRef,
} from '@/lib/types';

/** テスト専用の施設ビルダー。省略した項目は null（不明）になる */
export function makeSauna(overrides: Partial<SaunaDetail> & { id: string }): SaunaDetail {
  // slug を省略したら id を使う。overrides が後に来るので指定があればそちらが勝つ
  const base: SaunaDetail = {
    id: overrides.id,
    slug: overrides.id,
    name: `施設${overrides.id}`,
    prefecture: '東京都',
    area: null,
    address: null,
    lat: null,
    lng: null,
    description: null,
    heroImage: null,
    images: [],
    primaryTags: [],
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
    supportsDayTrip: true,
    supportsLodging: false,
    lodging: null,
    bbq: null,
    features: [],
    environments: [],
    cooldowns: [],
    experiences: [],
    popularityScore: 0,
    travelMinutes: null,
    featuredUntil: null,
    featuredCopy: null,
    saunaTempMin: null,
    saunaTempMax: null,
    coolTempMin: null,
    coolTempMax: null,
  };

  return { ...base, ...overrides };
}

export function conditions(overrides: {
  required?: Partial<SearchConditions['required']>;
  wish?: TagRef[];
}): SearchConditions {
  return {
    required: { ...EMPTY_CONDITIONS.required, ...overrides.required },
    wish: { tags: overrides.wish ?? [] },
  };
}

export function envOf(key: string, proximity: SaunaEnvironment['proximity']): SaunaEnvironment {
  return { key, proximity };
}

export function coolOf(key: string, overrides: Partial<Cooldown> = {}): Cooldown {
  return {
    key,
    waterTempMin: null,
    waterTempMax: null,
    depthCm: null,
    canDive: null,
    isNatural: null,
    hasFlow: null,
    note: null,
    ...overrides,
  };
}
