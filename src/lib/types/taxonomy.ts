/**
 * タグ語彙のカテゴリ。
 * 日本語表示名は src/lib/taxonomy/terms.ts だけが持つ。
 */
export type TaxonomyCategory =
  | 'sauna_type'
  | 'heat_source'
  | 'equipment'
  | 'environment'
  | 'outdoor_bath'
  | 'experience'
  | 'privacy'
  | 'usage'
  | 'access'
  | 'cooldown';

/** カテゴリと key の組でタグを一意に指す */
export type TagRef = {
  category: TaxonomyCategory;
  key: string;
};

/**
 * タグをどの強さで指定しているか。
 *
 * - none: 未選択
 * - wish: 希望条件。一致数をスコアに加算する（除外しない）
 * - must: 絶対条件。満たさない施設を検索結果から除外する
 *
 * 同じタグが wish と must の両方に入ることはない。
 */
export type TagLevel = 'none' | 'wish' | 'must';

/** 次の状態。未選択 → 希望 → 必須 → 未選択 で循環する */
export function nextTagLevel(level: TagLevel): TagLevel {
  switch (level) {
    case 'none':
      return 'wish';
    case 'wish':
      return 'must';
    case 'must':
      return 'none';
  }
}

/**
 * 環境が「どれだけ近いか」。
 * 敷地内 / 徒歩圏 / 眺めるだけ を区別する。
 * 「入れる」かどうかは Cooldown 側で表す。
 */
export type Proximity = 'on_site' | 'nearby' | 'view_only';

/** 語彙の1項目 */
export type TaxonomyTerm = {
  category: TaxonomyCategory;
  /** snake_case 英語 */
  key: string;
  /** 日本語表示名 */
  labelJa: string;
  /** lucide-react のアイコン名 */
  icon: string;
  sortOrder: number;
  /** true なら「条件を追加」で初めて表示する */
  isAdvanced: boolean;
};

/** 2つの TagRef が同一のタグを指すか */
export function isSameTag(a: TagRef, b: TagRef): boolean {
  return a.category === b.category && a.key === b.key;
}

/** Set / Map のキーに使える文字列表現 */
export function tagId(ref: TagRef): string {
  return `${ref.category}:${ref.key}`;
}
