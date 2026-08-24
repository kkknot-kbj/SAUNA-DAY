import { labelOf } from '@/lib/taxonomy/terms';
import { formatDuration } from '@/lib/utils/format';

import { applyRequiredConditions, findExclusionReason } from './filter';
import { countMatchedTags } from './tags';

import { isSameTag } from '@/lib/types';

import type { RelaxSuggestion, SaunaDetail, SearchConditions, TagRef } from '@/lib/types';

/**
 * 条件緩和の提示（要件9）。
 *
 * `additionalCount` の意味：
 * 「緩和によって新たに得られる候補のうち、最良の一致率に達しているものの件数」。
 * 例：「あと30分移動できれば、条件一致10/10が3件あります」
 *   → bestMatchRatio = "10/10"、additionalCount = 3
 *
 * 必須条件（移動時間・予算）の緩和は結果集合を広げる。
 * 希望条件を外す緩和は集合を変えず、一致率を上げる。
 */

/**
 * まず試す緩和幅。「あと30分」のような切りのよい数字を優先する。
 * これで候補が増えない場合は、必要な最小量をデータから逆算する（要件9-5）。
 */
const TRAVEL_DELTAS = [30, 60];
const BUDGET_DELTAS = [1000, 3000];

/** 逆算した緩和量を丸める単位 */
const TRAVEL_STEP = 10;
const BUDGET_STEP = 500;

/** これ以下の件数なら緩和提示を出す */
export const SCARCE_RESULT_THRESHOLD = 3;

/** 提示する最大件数。画面を説明で埋めないため絞る */
const MAX_SUGGESTIONS = 2;

type Ratio = { matched: number; total: number };

function ratioOf(sauna: SaunaDetail, wishTags: readonly TagRef[]): Ratio {
  return { matched: countMatchedTags(sauna, wishTags), total: wishTags.length };
}

function formatRatio(ratio: Ratio): string {
  return `${ratio.matched}/${ratio.total}`;
}

/** 候補のうち最良の一致率と、それに達している件数 */
function bestOf(
  saunas: readonly SaunaDetail[],
  wishTags: readonly TagRef[],
): { ratio: Ratio; count: number } | null {
  if (saunas.length === 0) return null;

  // 希望条件が未指定なら一致率で語れないので、件数だけを扱う
  if (wishTags.length === 0) {
    return { ratio: { matched: 0, total: 0 }, count: saunas.length };
  }

  let best = -1;
  for (const sauna of saunas) {
    const matched = countMatchedTags(sauna, wishTags);
    if (matched > best) best = matched;
  }

  const count = saunas.filter((s) => countMatchedTags(s, wishTags) === best).length;
  return { ratio: { matched: best, total: wishTags.length }, count };
}

/** 緩和後に新しく結果に入る施設 */
function newcomers(
  all: readonly SaunaDetail[],
  currentIds: Set<string>,
  conditions: SearchConditions,
): SaunaDetail[] {
  return applyRequiredConditions(all, conditions.required).filter(
    (sauna) => !currentIds.has(sauna.id),
  );
}

/**
 * 候補を1件でも増やすのに必要な最小の緩和量を逆算する。
 * 固定の緩和幅では届かない場合に使う（要件9-5）。
 *
 * `valueOf` はその条件で判定に使う値、`step` は丸める単位。
 */
function minimalDelta(
  all: readonly SaunaDetail[],
  currentIds: Set<string>,
  conditions: SearchConditions,
  base: number,
  valueOf: (sauna: SaunaDetail) => number | null,
  relaxFully: (required: SearchConditions['required']) => SearchConditions['required'],
  step: number,
): number | null {
  const unbounded = relaxFully(conditions.required);

  // その条件だけが原因で落ちている施設を集める
  const blocked = all.filter((sauna) => {
    if (currentIds.has(sauna.id)) return false;
    const value = valueOf(sauna);
    if (value === null || value <= base) return false;
    // 他の必須条件は満たしているか
    return findExclusionReason(sauna, unbounded) === null;
  });

  if (blocked.length === 0) return null;

  const values = blocked
    .map(valueOf)
    .filter((value): value is number => value !== null);
  const needed = Math.min(...values) - base;

  return Math.max(step, Math.ceil(needed / step) * step);
}

function travelSuggestions(
  all: readonly SaunaDetail[],
  currentIds: Set<string>,
  conditions: SearchConditions,
  deltas: readonly number[],
): RelaxSuggestion[] {
  const base = conditions.required.maxTravelMinutes;
  // 移動時間を指定していないなら緩和する対象がない
  if (base === null) return [];

  const results: RelaxSuggestion[] = [];
  for (const delta of deltas) {
    const relaxed: SearchConditions = {
      ...conditions,
      required: { ...conditions.required, maxTravelMinutes: base + delta },
    };
    const added = newcomers(all, currentIds, relaxed);
    const best = bestOf(added, conditions.wish.tags);
    if (best === null) continue;

    results.push({
      kind: 'travel_time',
      label: `あと${formatDuration(delta)}移動できれば`,
      delta,
      droppedTag: null,
      additionalCount: best.count,
      bestMatchRatio: formatRatio(best.ratio),
    });
  }

  // 切りのよい緩和幅で届かないなら、必要な最小量を逆算する
  if (results.length === 0) {
    const delta = minimalDelta(
      all,
      currentIds,
      conditions,
      base,
      (sauna) => sauna.travelMinutes,
      (required) => ({ ...required, maxTravelMinutes: null }),
      TRAVEL_STEP,
    );
    if (delta !== null) {
      const relaxed: SearchConditions = {
        ...conditions,
        required: { ...conditions.required, maxTravelMinutes: base + delta },
      };
      const added = newcomers(all, currentIds, relaxed);
      const best = bestOf(added, conditions.wish.tags);
      if (best !== null) {
        results.push({
          kind: 'travel_time',
          label: `あと${formatDuration(delta)}移動できれば`,
          delta,
          droppedTag: null,
          additionalCount: best.count,
          bestMatchRatio: formatRatio(best.ratio),
        });
      }
    }
  }

  return results;
}

function budgetSuggestions(
  all: readonly SaunaDetail[],
  currentIds: Set<string>,
  conditions: SearchConditions,
  deltas: readonly number[],
): RelaxSuggestion[] {
  const base = conditions.required.budgetMax;
  if (base === null) return [];

  const results: RelaxSuggestion[] = [];
  for (const delta of deltas) {
    const relaxed: SearchConditions = {
      ...conditions,
      required: { ...conditions.required, budgetMax: base + delta },
    };
    const added = newcomers(all, currentIds, relaxed);
    const best = bestOf(added, conditions.wish.tags);
    if (best === null) continue;

    results.push({
      kind: 'budget',
      label: `予算をあと¥${delta.toLocaleString('ja-JP')}上げれば`,
      delta,
      droppedTag: null,
      additionalCount: best.count,
      bestMatchRatio: formatRatio(best.ratio),
    });
  }

  if (results.length === 0) {
    const delta = minimalDelta(
      all,
      currentIds,
      conditions,
      base,
      (sauna) => sauna.priceMin,
      (required) => ({ ...required, budgetMax: null }),
      BUDGET_STEP,
    );
    if (delta !== null) {
      const relaxed: SearchConditions = {
        ...conditions,
        required: { ...conditions.required, budgetMax: base + delta },
      };
      const added = newcomers(all, currentIds, relaxed);
      const best = bestOf(added, conditions.wish.tags);
      if (best !== null) {
        results.push({
          kind: 'budget',
          label: `予算をあと¥${delta.toLocaleString('ja-JP')}上げれば`,
          delta,
          droppedTag: null,
          additionalCount: best.count,
          bestMatchRatio: formatRatio(best.ratio),
        });
      }
    }
  }

  return results;
}

/**
 * 必須にしたタグを希望に落とす提案。
 *
 * 必須は施設を除外するので、絞りすぎの原因として最も効きやすい。
 * 「川に入れる」を必須にして0件になった、という状況を救う。
 */
function dropMustSuggestions(
  all: readonly SaunaDetail[],
  currentIds: Set<string>,
  conditions: SearchConditions,
): RelaxSuggestion[] {
  const mustTags = conditions.required.absoluteTags;
  if (mustTags.length === 0) return [];

  const results: RelaxSuggestion[] = [];

  for (const dropped of mustTags) {
    const relaxed: SearchConditions = {
      ...conditions,
      required: {
        ...conditions.required,
        absoluteTags: mustTags.filter((ref) => !isSameTag(ref, dropped)),
      },
      // 必須を外したら希望として扱う。一致率には引き続き反映される
      wish: { tags: [...conditions.wish.tags, dropped] },
    };

    const added = newcomers(all, currentIds, relaxed);
    const best = bestOf(added, relaxed.wish.tags);
    if (best === null) continue;

    results.push({
      kind: 'drop_must_tag',
      label: `「${labelOf(dropped)}」を必須にしなければ`,
      delta: null,
      droppedTag: dropped,
      additionalCount: best.count,
      bestMatchRatio: formatRatio(best.ratio),
    });
  }

  // 1つ外しただけでは足りない場合（必須が複数あって全部満たせない等）、
  // すべて希望に落とす案を出す。0件のまま何も提示しない事態を避ける（要件9-5）
  if (results.length === 0 && mustTags.length > 1) {
    const relaxed: SearchConditions = {
      ...conditions,
      required: { ...conditions.required, absoluteTags: [] },
      wish: { tags: [...conditions.wish.tags, ...mustTags] },
    };

    const added = newcomers(all, currentIds, relaxed);
    const best = bestOf(added, relaxed.wish.tags);
    if (best !== null) {
      results.push({
        kind: 'drop_all_must_tags',
        label: '必須の条件をすべて希望に変えれば',
        delta: null,
        droppedTag: null,
        additionalCount: best.count,
        bestMatchRatio: formatRatio(best.ratio),
      });
    }
  }

  return results;
}

/**
 * 希望条件を1つ外す提案。
 * 結果集合は変わらないが、完全一致に届く施設が増える。
 */
function dropWishSuggestions(
  current: readonly SaunaDetail[],
  conditions: SearchConditions,
): RelaxSuggestion[] {
  const wishTags = conditions.wish.tags;
  if (wishTags.length <= 1) return [];

  const results: RelaxSuggestion[] = [];

  for (const dropped of wishTags) {
    const remaining = wishTags.filter(
      (ref) => !(ref.category === dropped.category && ref.key === dropped.key),
    );

    const newlyFull = current.filter((sauna) => {
      const before = ratioOf(sauna, wishTags);
      const after = countMatchedTags(sauna, remaining);
      return after === remaining.length && before.matched !== before.total;
    });

    if (newlyFull.length === 0) continue;

    results.push({
      kind: 'drop_wish_tag',
      label: `「${labelOf(dropped)}」を外せば`,
      delta: null,
      droppedTag: dropped,
      additionalCount: newlyFull.length,
      bestMatchRatio: `${remaining.length}/${remaining.length}`,
    });
  }

  return results;
}

/**
 * 緩和案を件数の多い順に返す。
 * 結果が0件のときは必ず1件以上返そうとする（要件9-5）。
 */
export function suggestRelaxations(
  all: readonly SaunaDetail[],
  conditions: SearchConditions,
): RelaxSuggestion[] {
  const current = applyRequiredConditions(all, conditions.required);

  // 結果が十分あるなら提示しない
  if (current.length > SCARCE_RESULT_THRESHOLD) {
    const hasFullMatch =
      conditions.wish.tags.length > 0 &&
      current.some((s) => countMatchedTags(s, conditions.wish.tags) === conditions.wish.tags.length);
    // 完全一致が既にあるなら緩和を勧める理由がない
    if (hasFullMatch) return [];
  }

  const currentIds = new Set(current.map((sauna) => sauna.id));

  const suggestions = [
    // 必須の解除は候補を最も増やしやすいので先に評価する
    ...dropMustSuggestions(all, currentIds, conditions),
    ...travelSuggestions(all, currentIds, conditions, TRAVEL_DELTAS),
    ...budgetSuggestions(all, currentIds, conditions, BUDGET_DELTAS),
    ...dropWishSuggestions(current, conditions),
  ];

  // 同じ kind では最も効果の大きいものだけを残す
  const bestByKind = new Map<string, RelaxSuggestion>();
  for (const suggestion of suggestions) {
    const key =
      suggestion.droppedTag === null
        ? suggestion.kind
        : `${suggestion.kind}:${suggestion.droppedTag.category}:${suggestion.droppedTag.key}`;
    const existing = bestByKind.get(key);
    if (existing === undefined || suggestion.additionalCount > existing.additionalCount) {
      bestByKind.set(key, suggestion);
    }
  }

  return [...bestByKind.values()]
    .sort((a, b) => {
      const diff = b.additionalCount - a.additionalCount;
      if (diff !== 0) return diff;
      // 決定的にするため kind とラベルで決着させる
      return a.kind.localeCompare(b.kind) || a.label.localeCompare(b.label, 'ja');
    })
    .slice(0, MAX_SUGGESTIONS);
}
