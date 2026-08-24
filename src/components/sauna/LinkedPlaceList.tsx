import { UNKNOWN, formatDuration, formatPriceRange } from '@/lib/utils/format';

import type { LinkedPlaces, SpotCategory } from '@/lib/types';

const SPOT_CATEGORY_LABELS: Record<SpotCategory, string> = {
  sightseeing: '観光',
  activity: 'アクティビティ',
  onsen: '温泉',
};

/** 距離と移動時間の1行表示。どちらも不明なら「不明」 */
function AccessLine({
  distanceKm,
  travelMinutes,
}: {
  distanceKm: number | null;
  travelMinutes: number | null;
}) {
  if (distanceKm === null && travelMinutes === null) {
    return <span className="text-[12px] text-ink-faint">{UNKNOWN}</span>;
  }

  return (
    <span className="nums text-[12px] text-ink-faint">
      {distanceKm !== null ? `${distanceKm}km` : ''}
      {distanceKm !== null && travelMinutes !== null ? ' / ' : ''}
      {travelMinutes !== null ? formatDuration(travelMinutes) : ''}
    </span>
  );
}

function Row({
  name,
  meta,
  distanceKm,
  travelMinutes,
  note,
}: {
  name: string;
  meta: string | null;
  distanceKm: number | null;
  travelMinutes: number | null;
  note?: string | null;
}) {
  return (
    <li className="flex flex-col gap-1 border-b border-line py-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] text-ink">{name}</span>
        <AccessLine distanceKm={distanceKm} travelMinutes={travelMinutes} />
      </div>
      {meta !== null ? <span className="text-[12px] text-ink-muted">{meta}</span> : null}
      {note !== undefined && note !== null ? (
        <span className="text-[12px] text-ink-muted">{note}</span>
      ) : null}
    </li>
  );
}

/**
 * 周辺のサ飯・観光・宿泊（要件11）。
 *
 * IMPORTANT: サウナ本体の情報より下位の扱いにする（要件11-6）。
 * 見出しを控えめにし、詳細画面の末尾に置く。
 * 候補はDBに登録済みのものだけ。その場で検索・生成しない。
 */
export function LinkedPlaceList({ places }: { places: LinkedPlaces }) {
  const hasAny =
    places.restaurants.length > 0 || places.spots.length > 0 || places.hotels.length > 0;

  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-8">
      {places.restaurants.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] text-ink-faint">周辺のサ飯</h3>
          <ul className="flex flex-col">
            {places.restaurants.map((linked) => (
              <Row
                key={linked.restaurant.id}
                name={linked.restaurant.name}
                meta={`${linked.restaurant.genre} / ${formatPriceRange(
                  linked.restaurant.priceMin,
                  linked.restaurant.priceMax,
                )}`}
                distanceKm={linked.distanceKm}
                travelMinutes={linked.travelMinutes}
                note={linked.recommendReason}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {places.spots.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] text-ink-faint">周辺の立ち寄り先</h3>
          <ul className="flex flex-col">
            {places.spots.map((linked) => (
              <Row
                key={linked.spot.id}
                name={linked.spot.name}
                meta={SPOT_CATEGORY_LABELS[linked.spot.category]}
                distanceKm={linked.distanceKm}
                travelMinutes={linked.travelMinutes}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {places.hotels.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] text-ink-faint">周辺の宿</h3>
          <ul className="flex flex-col">
            {places.hotels.map((linked) => (
              <Row
                key={linked.hotel.id}
                name={linked.hotel.name}
                meta={formatPriceRange(linked.hotel.priceMin, linked.hotel.priceMax)}
                distanceKm={linked.distanceKm}
                travelMinutes={linked.travelMinutes}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
