import { describe, expect, it } from 'vitest';

import { nextTagLevel } from '@/lib/types';

import { applyRequiredConditions } from './filter';
import { conditions, coolOf, envOf, makeSauna } from './fixtures';
import { suggestRelaxations } from './relax';
import { buildScoringContext, calculateScore } from './score';
import { DEFAULT_WEIGHTS } from './weights';

import type { SaunaDetail, TagRef } from '@/lib/types';

const RIVER_COOLDOWN: TagRef = { category: 'cooldown', key: 'river' };
const WOOD: TagRef = { category: 'heat_source', key: 'wood' };

/** 川に入れる施設 / 川が近いだけの施設 / 川と無関係の施設 */
function saunas(): SaunaDetail[] {
  return [
    makeSauna({
      id: 'river-enterable',
      cooldowns: [coolOf('river', { canDive: true })],
      environments: [envOf('river', 'on_site')],
      features: [WOOD],
    }),
    makeSauna({
      id: 'river-nearby-only',
      cooldowns: [coolOf('cold_bath')],
      environments: [envOf('river', 'nearby')],
      features: [WOOD],
    }),
    makeSauna({
      id: 'no-river',
      cooldowns: [coolOf('cold_bath')],
      environments: [envOf('forest', 'on_site')],
      features: [WOOD],
    }),
  ];
}

describe('TagLevel の循環', () => {
  it('未選択 → 希望 → 必須 → 未選択 と進む', () => {
    expect(nextTagLevel('none')).toBe('wish');
    expect(nextTagLevel('wish')).toBe('must');
    expect(nextTagLevel('must')).toBe('none');
  });
});

describe('必須指定（絶対条件）の効き方', () => {
  it('必須にすると満たさない施設が除外される', () => {
    const c = conditions({ required: { absoluteTags: [RIVER_COOLDOWN] } });
    const result = applyRequiredConditions(saunas(), c.required);
    expect(result.map((s) => s.id)).toEqual(['river-enterable']);
  });

  it('希望のままなら除外されない', () => {
    const c = conditions({ wish: [RIVER_COOLDOWN] });
    const result = applyRequiredConditions(saunas(), c.required);
    expect(result).toHaveLength(3);
  });

  it('希望のままだと満たす施設のスコアが高くなる', () => {
    const list = saunas();
    const c = conditions({ wish: [RIVER_COOLDOWN] });
    const context = buildScoringContext(list, c, DEFAULT_WEIGHTS);

    const enterable = calculateScore(list[0]!, c, context);
    const nearbyOnly = calculateScore(list[1]!, c, context);

    expect(enterable.conditionMatch.ratio).toBe(1);
    expect(nearbyOnly.conditionMatch.ratio).toBe(0);
    expect(enterable.total).toBeGreaterThan(nearbyOnly.total);
  });

  it('必須と希望を併用できる（川は必須・薪は希望）', () => {
    const list = [
      ...saunas(),
      makeSauna({
        id: 'river-electric',
        cooldowns: [coolOf('river')],
        environments: [envOf('river', 'on_site')],
        features: [{ category: 'heat_source', key: 'electric' }],
      }),
    ];

    const c = conditions({ required: { absoluteTags: [RIVER_COOLDOWN] }, wish: [WOOD] });
    const passing = applyRequiredConditions(list, c.required);

    // 川に入れる2件が残る
    expect(passing.map((s) => s.id).sort()).toEqual(['river-electric', 'river-enterable']);

    const context = buildScoringContext(passing, c, DEFAULT_WEIGHTS);
    const wood = calculateScore(
      passing.find((s) => s.id === 'river-enterable')!,
      c,
      context,
    );
    const electric = calculateScore(
      passing.find((s) => s.id === 'river-electric')!,
      c,
      context,
    );

    // 薪の方が希望を満たすので上に来る
    expect(wood.total).toBeGreaterThan(electric.total);
  });

  it('必須にしたタグは条件一致率に数えない（全件が満たすため）', () => {
    const list = saunas();
    const c = conditions({ required: { absoluteTags: [RIVER_COOLDOWN] } });
    const passing = applyRequiredConditions(list, c.required);
    const context = buildScoringContext(passing, c, DEFAULT_WEIGHTS);
    const score = calculateScore(passing[0]!, c, context);

    expect(score.conditionMatch.matched).toEqual([]);
    expect(score.conditionMatch.unmatched).toEqual([]);
  });

  it('IMPORTANT: 「川に入れる」を必須にしても「川が近いだけ」は通らない', () => {
    const c = conditions({ required: { absoluteTags: [RIVER_COOLDOWN] } });
    const result = applyRequiredConditions(saunas(), c.required);
    expect(result.map((s) => s.id)).not.toContain('river-nearby-only');
  });

  it('「川が近い」を必須にすると入水できない施設も通る', () => {
    const c = conditions({
      required: { absoluteTags: [{ category: 'environment', key: 'river' }] },
    });
    const result = applyRequiredConditions(saunas(), c.required);
    expect(result.map((s) => s.id).sort()).toEqual(['river-enterable', 'river-nearby-only']);
  });
});

describe('必須で絞りすぎたときの緩和提示', () => {
  it('必須を外す提案が返る', () => {
    const list = saunas();
    const c = conditions({
      required: { absoluteTags: [{ category: 'experience', key: 'snow_dive' }] },
    });

    // 誰も満たさないので0件
    expect(applyRequiredConditions(list, c.required)).toHaveLength(0);

    const suggestions = suggestRelaxations(list, c);
    const dropMust = suggestions.find((s) => s.kind === 'drop_must_tag');

    expect(dropMust).toBeDefined();
    expect(dropMust?.droppedTag).toEqual({ category: 'experience', key: 'snow_dive' });
    expect(dropMust?.additionalCount).toBeGreaterThan(0);
    expect(dropMust?.label).toContain('必須にしなければ');
  });

  it('必須を1つ外しても足りないときは、すべて希望に変える案を出す', () => {
    const list = saunas();
    // どちらも誰も満たさないので、片方を外しても0件のまま
    const c = conditions({
      required: {
        absoluteTags: [
          { category: 'experience', key: 'snow_dive' },
          { category: 'cooldown', key: 'sea' },
        ],
      },
    });

    const suggestions = suggestRelaxations(list, c);

    // 片方だけ外す案は効果がないので出さない
    expect(suggestions.some((s) => s.kind === 'drop_must_tag')).toBe(false);
    // 代わりに全部外す案が出る
    const dropAll = suggestions.find((s) => s.kind === 'drop_all_must_tags');
    expect(dropAll).toBeDefined();
    expect(dropAll?.additionalCount).toBeGreaterThan(0);
    expect(dropAll?.label).toContain('すべて希望に変えれば');
  });

  it('必須が1つだけなら「すべて外す」案は出さない（重複するため）', () => {
    const list = saunas();
    const c = conditions({
      required: { absoluteTags: [{ category: 'cooldown', key: 'snow' }] },
    });
    const suggestions = suggestRelaxations(list, c);
    expect(suggestions.some((s) => s.kind === 'drop_all_must_tags')).toBe(false);
    expect(suggestions.some((s) => s.kind === 'drop_must_tag')).toBe(true);
  });

  it('必須で0件になった場合も必ず提案が返る（要件9-5）', () => {
    const list = saunas();
    const c = conditions({
      required: { absoluteTags: [{ category: 'cooldown', key: 'snow' }] },
    });
    expect(applyRequiredConditions(list, c.required)).toHaveLength(0);
    expect(suggestRelaxations(list, c).length).toBeGreaterThan(0);
  });
});
