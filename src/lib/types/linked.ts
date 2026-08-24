import type { BusinessHours } from './sauna';

/** 観光 / アクティビティ / 温泉 */
export type SpotCategory = 'sightseeing' | 'activity' | 'onsen';

export type LodgingType = 'hotel' | 'ryokan' | 'guesthouse' | 'glamping' | 'campsite';

/** サ飯をいつ食べるか */
export type RecommendedTiming = 'before_sauna' | 'after_sauna' | 'lunch' | 'dinner';

export type Restaurant = {
  id: string;
  name: string;
  genre: string;
  priceMin: number | null;
  priceMax: number | null;
  businessHours: BusinessHours | null;
  address: string | null;
  officialUrl: string | null;
};

export type Spot = {
  id: string;
  name: string;
  category: SpotCategory;
  description: string | null;
  priceMin: number | null;
  businessHours: BusinessHours | null;
  address: string | null;
  officialUrl: string | null;
};

export type Hotel = {
  id: string;
  name: string;
  lodgingType: LodgingType;
  priceMin: number | null;
  priceMax: number | null;
  address: string | null;
  officialUrl: string | null;
  reservationUrl: string | null;
};

/** サウナと周辺施設の関係が持つ情報 */
export type LinkInfo = {
  distanceKm: number | null;
  travelMinutes: number | null;
  /** 0..1 */
  recommendScore: number;
};

export type LinkedRestaurant = LinkInfo & {
  restaurant: Restaurant;
  recommendedTiming: RecommendedTiming | null;
  recommendReason: string | null;
};

export type LinkedSpot = LinkInfo & {
  spot: Spot;
  /** 滞在の所要時間 */
  durationMinutes: number | null;
};

export type LinkedHotel = LinkInfo & {
  hotel: Hotel;
};

/** サウナに紐付く周辺施設の候補一式 */
export type LinkedPlaces = {
  restaurants: LinkedRestaurant[];
  spots: LinkedSpot[];
  hotels: LinkedHotel[];
};
