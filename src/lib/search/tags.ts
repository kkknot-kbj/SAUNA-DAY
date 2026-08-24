import { tagId } from '@/lib/types';

import type { SaunaDetail, TagRef } from '@/lib/types';

/**
 * 施設が持つ全タグの集合。
 *
 * IMPORTANT: environments（近くにある・見える）と cooldowns（実際に入れる）は
 * 別カテゴリのタグとして扱う。ここで混ぜると
 * 「川に入れる」検索に「川が近いだけ」の施設が混ざる。
 */
export function collectTagIds(sauna: SaunaDetail): Set<string> {
  const ids = new Set<string>();

  for (const ref of sauna.features) ids.add(tagId(ref));
  for (const ref of sauna.experiences) ids.add(tagId(ref));
  for (const e of sauna.environments) ids.add(tagId({ category: 'environment', key: e.key }));
  for (const c of sauna.cooldowns) ids.add(tagId({ category: 'cooldown', key: c.key }));

  return ids;
}

/** 施設が指定タグを持つか */
export function hasTag(sauna: SaunaDetail, ref: TagRef): boolean {
  return collectTagIds(sauna).has(tagId(ref));
}

/** 施設が指定タグをすべて持つか */
export function hasAllTags(sauna: SaunaDetail, refs: TagRef[]): boolean {
  if (refs.length === 0) return true;
  const ids = collectTagIds(sauna);
  return refs.every((ref) => ids.has(tagId(ref)));
}

/** 施設が満たしたタグの数 */
export function countMatchedTags(sauna: SaunaDetail, refs: readonly TagRef[]): number {
  if (refs.length === 0) return 0;
  const ids = collectTagIds(sauna);
  return refs.reduce((count, ref) => (ids.has(tagId(ref)) ? count + 1 : count), 0);
}
