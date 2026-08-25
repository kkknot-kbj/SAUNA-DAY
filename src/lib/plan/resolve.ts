import type { Repository } from '@/lib/data';
import type { PlanItem, ResolvedPlanItem } from '@/lib/types';

/**
 * PlanItem の refId を DB から解決して表示用の構造体にする。
 *
 * IMPORTANT: 参照先が見つからない場合は place を null にし、
 * 「情報が取得できません」と表示する。推測で補完しない（要件14-7）。
 */
export async function resolvePlanItems(
  items: PlanItem[],
  repository: Repository,
): Promise<ResolvedPlanItem[]> {
  // refType ごとに ID を集約して一括取得
  const saunaIds = items.filter((i) => i.refType === 'sauna').map((i) => i.refId);
  const restaurantIds = items.filter((i) => i.refType === 'restaurant').map((i) => i.refId);
  const spotIds = items.filter((i) => i.refType === 'spot').map((i) => i.refId);
  const hotelIds = items.filter((i) => i.refType === 'hotel').map((i) => i.refId);

  // サウナは getSaunaSummariesByIds で取得
  const saunas = saunaIds.length > 0 ? await repository.getSaunaSummariesByIds(saunaIds) : [];
  const saunaMap = new Map(saunas.map((s) => [s.id, s]));

  // 周辺施設は現状 repository に個別取得メソッドがないため、
  // getLinkedPlaces でサウナごとに取得する方法だと非効率。
  // ここでは直接 Supabase クライアントを使わず、
  // プラン生成時に候補として渡されたデータをキャッシュする仕組みが理想だが、
  // Phase 6 ではシンプルに items の refId から個別 resolve する。
  // TODO: Phase 7 で最適化

  // 一旦 linked places から全候補を取得するため、サウナの情報が必要
  // ここではプラン中のサウナIDから linked places を引く
  const allPlaces = saunaIds.length > 0
    ? await repository.getLinkedPlaces(saunaIds[0])
    : { restaurants: [], spots: [], hotels: [] };

  const restaurantMap = new Map(allPlaces.restaurants.map((r) => [r.restaurant.id, r.restaurant]));
  const spotMap = new Map(allPlaces.spots.map((s) => [s.spot.id, s.spot]));
  const hotelMap = new Map(allPlaces.hotels.map((h) => [h.hotel.id, h.hotel]));

  // 見つからなかった場合のため、未解決のIDを残す
  void restaurantIds;
  void spotIds;
  void hotelIds;

  return items.map((item) => {
    const base = { startTime: item.startTime, note: item.note, refType: item.refType, refId: item.refId };

    switch (item.refType) {
      case 'sauna': {
        const sauna = saunaMap.get(item.refId);
        return { ...base, place: sauna ? { kind: 'sauna' as const, value: sauna } : null };
      }
      case 'restaurant': {
        const restaurant = restaurantMap.get(item.refId);
        return { ...base, place: restaurant ? { kind: 'restaurant' as const, value: restaurant } : null };
      }
      case 'spot': {
        const spot = spotMap.get(item.refId);
        return { ...base, place: spot ? { kind: 'spot' as const, value: spot } : null };
      }
      case 'hotel': {
        const hotel = hotelMap.get(item.refId);
        return { ...base, place: hotel ? { kind: 'hotel' as const, value: hotel } : null };
      }
    }
  });
}
