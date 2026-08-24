import { tagId } from '@/lib/types';

import { collectTagIds } from './tags';

import type { RequiredConditions, SaunaDetail } from '@/lib/types';

/** 必須条件のうち、どれで落ちたか */
export type ExclusionReason =
  | 'travel_time'
  | 'budget'
  | 'party_size'
  | 'stay_type'
  | 'absolute_tag';

/**
 * 施設が必須条件を満たすか判定する。
 * 満たさない場合は落ちた理由を返す。
 *
 * IMPORTANT: 値が null（不明）の項目では除外判定を行わない（要件5-9）。
 * 不明を理由に落とすと、情報が揃っていない良い施設が消えてしまう。
 */
export function findExclusionReason(
  sauna: SaunaDetail,
  required: RequiredConditions,
): ExclusionReason | null {
  // 移動時間：導出できていない（null）なら判定しない
  if (
    required.maxTravelMinutes !== null &&
    sauna.travelMinutes !== null &&
    sauna.travelMinutes > required.maxTravelMinutes
  ) {
    return 'travel_time';
  }

  // 予算：最低料金が不明なら判定しない
  if (
    required.budgetMax !== null &&
    sauna.priceMin !== null &&
    sauna.priceMin > required.budgetMax
  ) {
    return 'budget';
  }

  // 人数：受け入れ可能人数が不明な側は判定しない
  if (required.partySize !== null) {
    if (sauna.capacityMin !== null && required.partySize < sauna.capacityMin) {
      return 'party_size';
    }
    if (sauna.capacityMax !== null && required.partySize > sauna.capacityMax) {
      return 'party_size';
    }
  }

  // 日帰り / 宿泊：boolean なので常に判定できる
  if (required.stayType === 'lodging' && !sauna.supportsLodging) return 'stay_type';
  if (required.stayType === 'day_trip' && !sauna.supportsDayTrip) return 'stay_type';

  // 絶対条件：1つでも欠けたら除外
  if (required.absoluteTags.length > 0) {
    const ids = collectTagIds(sauna);
    const missing = required.absoluteTags.some((ref) => !ids.has(tagId(ref)));
    if (missing) return 'absolute_tag';
  }

  return null;
}

/** 必須条件を満たす施設だけを残す */
export function applyRequiredConditions(
  saunas: readonly SaunaDetail[],
  required: RequiredConditions,
): SaunaDetail[] {
  return saunas.filter((sauna) => findExclusionReason(sauna, required) === null);
}
