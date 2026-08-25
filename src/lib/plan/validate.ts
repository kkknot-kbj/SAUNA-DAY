import { candidateIdSet } from './candidates';

import type { PlanCandidates } from './candidates';
import type { HolidayPlan, PlanItem } from '@/lib/types';

/**
 * プランの検証結果。
 */
export type ValidationResult = {
  valid: boolean;
  /** 検証を通過した項目 */
  validItems: PlanItem[];
  /** 破棄された項目（理由付き） */
  rejectedItems: { item: PlanItem; reason: string }[];
};

/**
 * プラン項目を検証する（design.md §5.3）。
 *
 * 検証項目:
 * 1. refId が候補リストに含まれること（捏造防止）
 * 2. 日帰りプランに hotel が含まれないこと
 * 3. サウナ本体がプランに含まれること（なければ補完）
 *
 * IMPORTANT: 候補外のIDが返ってきたらその項目を破棄する。
 * AI の出力を無条件に信頼しない。
 */
export function validatePlan(
  plan: HolidayPlan,
  candidates: PlanCandidates,
): ValidationResult {
  const allowedIds = candidateIdSet(candidates);
  const validItems: PlanItem[] = [];
  const rejectedItems: { item: PlanItem; reason: string }[] = [];

  for (const item of plan.items) {
    // 1. refId が候補に含まれるか
    if (!allowedIds.has(item.refId)) {
      rejectedItems.push({ item, reason: '候補リストに含まれないID' });
      continue;
    }

    // 2. 日帰りプランに hotel は不可
    if (!candidates.isLodging && item.refType === 'hotel') {
      rejectedItems.push({ item, reason: '日帰りプランに宿泊施設は含められない' });
      continue;
    }

    validItems.push(item);
  }

  // 3. サウナ本体が含まれていなければ先頭に補完する
  const hasSauna = validItems.some(
    (item) => item.refType === 'sauna' && item.refId === candidates.sauna.id,
  );

  if (!hasSauna) {
    validItems.unshift({
      startTime: null,
      refType: 'sauna',
      refId: candidates.sauna.id,
      note: null,
    });
  }

  return {
    valid: rejectedItems.length === 0,
    validItems,
    rejectedItems,
  };
}
