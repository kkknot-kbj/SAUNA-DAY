import { generatePlan } from './generate';
import { validatePlan } from './validate';

import type { PlanCandidates } from './candidates';
import type { PlanUserContext } from './prompt';
import type { HolidayPlan, PlanItem } from '@/lib/types';

/**
 * 決定的なプラン組み立て（AIなし）。
 *
 * 候補の中から recommend_score の高い順に1件ずつ選び、
 * 移動時間を加味して時刻を割り当てる。
 *
 * AI 生成が失敗した場合のフォールバックとして使う。
 */

/** デフォルトの出発時刻 */
const DEFAULT_DEPARTURE = '09:00';

/** サウナの滞在時間目安（分） */
const SAUNA_DURATION_MINUTES = 120;

/** 食事の滞在時間目安（分） */
const RESTAURANT_DURATION_MINUTES = 60;

/** 時刻文字列 (HH:mm) を分に変換 */
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** 分を時刻文字列に変換 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 決定的にプランを組み立てる。
 *
 * 構成:
 * 1. サウナ（中心。必ず含む）
 * 2. サ飯（recommend_score 最上位1件）
 * 3. 観光/アクティビティ（recommend_score 最上位1件）
 * 4. 宿泊（isLodging の場合のみ。最上位1件）
 *
 * 時刻割り当て:
 * - 出発時刻 + 施設までの移動時間 = サウナ到着
 * - サウナ + 滞在 + 移動 = サ飯
 * - サ飯 + 滞在 + 移動 = 観光
 * - 最後に宿泊
 */
export function buildPlan(
  candidates: PlanCandidates,
  options: { departureTime?: string; originKey?: string; date?: string } = {},
): HolidayPlan {
  const departure = options.departureTime ?? DEFAULT_DEPARTURE;
  let currentMinutes = timeToMinutes(departure);

  const items: PlanItem[] = [];

  // 1. サウナ（中心。プランの主役）
  // 出発地 → サウナの移動時間
  const travelToSauna = candidates.sauna.travelMinutes ?? 60;
  currentMinutes += travelToSauna;

  items.push({
    startTime: minutesToTime(currentMinutes),
    refType: 'sauna',
    refId: candidates.sauna.id,
    note: null,
  });

  currentMinutes += SAUNA_DURATION_MINUTES;

  // 2. サ飯
  const topRestaurant = [...candidates.places.restaurants].sort(
    (a, b) => b.recommendScore - a.recommendScore,
  )[0];

  if (topRestaurant) {
    const travelMin = topRestaurant.travelMinutes ?? 10;
    currentMinutes += travelMin;

    items.push({
      startTime: minutesToTime(currentMinutes),
      refType: 'restaurant',
      refId: topRestaurant.restaurant.id,
      note: topRestaurant.recommendReason,
    });

    currentMinutes += RESTAURANT_DURATION_MINUTES;
  }

  // 3. 観光/アクティビティ
  const topSpot = [...candidates.places.spots].sort(
    (a, b) => b.recommendScore - a.recommendScore,
  )[0];

  if (topSpot) {
    const travelMin = topSpot.travelMinutes ?? 10;
    currentMinutes += travelMin;

    items.push({
      startTime: minutesToTime(currentMinutes),
      refType: 'spot',
      refId: topSpot.spot.id,
      note: null,
    });

    currentMinutes += topSpot.durationMinutes ?? 60;
  }

  // 4. 宿泊（日帰りでなければ）
  if (candidates.isLodging) {
    const topHotel = [...candidates.places.hotels].sort(
      (a, b) => b.recommendScore - a.recommendScore,
    )[0];

    if (topHotel) {
      const travelMin = topHotel.travelMinutes ?? 10;
      currentMinutes += travelMin;

      items.push({
        startTime: minutesToTime(currentMinutes),
        refType: 'hotel',
        refId: topHotel.hotel.id,
        note: null,
      });
    }
  }

  // タイトル組み立て
  const title = `${candidates.sauna.name}の休日`;

  return {
    id: null,
    title,
    date: options.date ?? null,
    saunaId: candidates.sauna.id,
    originKey: options.originKey ?? null,
    departureTime: departure,
    isLodging: candidates.isLodging,
    items,
  };
}

/**
 * 休日プランを生成する（AI優先、フォールバック付き）。
 *
 * 1. Gemini API でプランを生成
 * 2. 生成結果を validatePlan で検証
 * 3. 失敗時は決定的な buildPlan にフォールバック
 *
 * IMPORTANT: AI が返した結果は必ず検証する。
 * 候補外の refId が含まれていたら破棄してフォールバックする。
 */
export async function createHolidayPlan(
  candidates: PlanCandidates,
  context: PlanUserContext,
): Promise<HolidayPlan> {
  const options = {
    departureTime: context.departureTime ?? undefined,
    date: context.date ?? undefined,
  };

  // AI 生成を試行
  const aiOutput = await generatePlan(candidates, context);

  if (aiOutput !== null) {
    // AI 出力を HolidayPlan に変換
    const aiTitle = aiOutput.title || `${candidates.sauna.name}の休日`;
    const aiPlan: HolidayPlan = {
      id: null,
      title: aiTitle,
      date: context.date ?? null,
      saunaId: candidates.sauna.id,
      originKey: null,
      departureTime: context.departureTime ?? '09:00',
      isLodging: candidates.isLodging,
      items: aiOutput.items,
    };

    // 検証
    const { validItems, rejectedItems } = validatePlan(aiPlan, candidates);

    if (rejectedItems.length > 0) {
      console.warn(
        `[plan/build] AI出力から${rejectedItems.length}件を破棄:`,
        rejectedItems.map((r) => `${r.item.refId}: ${r.reason}`),
      );
    }

    // 有効な項目が2つ以上あれば（サウナ + 最低1件）AI結果を採用
    if (validItems.length >= 2) {
      return { ...aiPlan, items: validItems };
    }

    console.warn('[plan/build] AI結果が不十分。決定的プランにフォールバック');
  }

  // フォールバック: 決定的プラン
  return buildPlan(candidates, options);
}
