import type { LinkedPlaces, SaunaDetail } from '@/lib/types';

/**
 * プラン生成の候補一式。
 *
 * DB から取得した正確なデータのみで構成する。
 * AI に渡すのもこの構造体。候補外の施設を生成させない。
 */
export type PlanCandidates = {
  sauna: SaunaDetail;
  places: LinkedPlaces;
  /** 日帰り指定なら hotels を除外する */
  isLodging: boolean;
};

/**
 * 候補を収集する。
 *
 * 日帰り指定時は hotels を除外し、宿泊候補を提示しない（要件12-7）。
 */
export function collectCandidates(
  sauna: SaunaDetail,
  places: LinkedPlaces,
  isLodging: boolean,
): PlanCandidates {
  const filteredPlaces: LinkedPlaces = {
    restaurants: places.restaurants,
    spots: places.spots,
    hotels: isLodging ? places.hotels : [],
  };

  return {
    sauna,
    places: filteredPlaces,
    isLodging,
  };
}

/**
 * 候補に含まれる全 ID のセットを返す。
 * validate.ts で refId の検証に使う。
 */
export function candidateIdSet(candidates: PlanCandidates): Set<string> {
  const ids = new Set<string>();
  ids.add(candidates.sauna.id);
  for (const r of candidates.places.restaurants) ids.add(r.restaurant.id);
  for (const s of candidates.places.spots) ids.add(s.spot.id);
  for (const h of candidates.places.hotels) ids.add(h.hotel.id);
  return ids;
}
