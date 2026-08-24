/**
 * 出発地からの所要時間の導出。
 *
 * IMPORTANT: 所要時間は施設の「事実情報」ではなく計算による目安。
 * UIでは「目安」と分かる表記にすること。
 * 精度が必要になった段階でルーティングAPIに差し替えるが、
 * そのときもこのモジュールの内部だけを変更すれば済むようにしておく。
 */

const EARTH_RADIUS_KM = 6371;

/** 直線距離 → 実走行距離の補正係数 */
export const ROAD_FACTOR = 1.3;

/** 平均走行速度（km/h） */
export const AVG_SPEED_KMH = 55;

/** 移動可能時間が未指定のときに距離スコアの基準にする分数 */
export const DEFAULT_TRAVEL_BASELINE_MINUTES = 240;

type Coord = { lat: number; lng: number };

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** 2点間の大円距離（km） */
export function haversineKm(a: Coord, b: Coord): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * 出発地から施設までの所要時間の目安（分）。
 * どちらかの座標が欠けていれば null（→ UIでは「不明」）。
 */
export function estimateTravelMinutes(
  origin: Coord | null,
  destination: { lat: number | null; lng: number | null } | null,
): number | null {
  if (origin === null || destination === null) return null;
  if (destination.lat === null || destination.lng === null) return null;

  const km = haversineKm(origin, { lat: destination.lat, lng: destination.lng });
  return Math.round((km * ROAD_FACTOR) / AVG_SPEED_KMH * 60);
}
