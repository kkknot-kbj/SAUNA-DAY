import type { TagRef, TaxonomyCategory, TaxonomyTerm } from '@/lib/types';

/**
 * 全タグ語彙の単一定義。
 *
 * IMPORTANT: 日本語表示名とアイコンを持つのはこのファイルだけ。
 * 画面やコンポーネントに日本語ラベルをハードコードしない。
 * 選択肢の追加はここ1箇所（と Phase 2 以降は seed）で完結させる。
 *
 * icon は lucide-react のアイコン名。絵文字は使わない。
 */
const t = (
  category: TaxonomyCategory,
  key: string,
  labelJa: string,
  icon: string,
  sortOrder: number,
  isAdvanced = false,
): TaxonomyTerm => ({ category, key, labelJa, icon, sortOrder, isAdvanced });

export const TAXONOMY: readonly TaxonomyTerm[] = [
  // ── サウナタイプ（希望条件）
  t('sauna_type', 'hut', '小屋', 'Home', 1),
  t('sauna_type', 'tent', 'テント', 'Tent', 2),
  t('sauna_type', 'barrel', 'バレル', 'Cylinder', 3),
  t('sauna_type', 'container', 'コンテナ', 'Container', 4),
  t('sauna_type', 'open_air', '露天', 'CloudSun', 5),

  // ── 熱源（詳細条件）
  t('heat_source', 'wood', '薪', 'Flame', 1, true),
  t('heat_source', 'electric', '電気', 'Zap', 2, true),
  t('heat_source', 'gas', 'ガス', 'Wind', 3, true),

  // ── サウナ設備（詳細条件）
  t('equipment', 'loyly', 'ロウリュ', 'Droplet', 1, true),
  t('equipment', 'self_loyly', 'セルフロウリュ', 'Droplets', 2, true),
  t('equipment', 'auto_loyly', 'オートロウリュ', 'Timer', 3, true),
  t('equipment', 'aufguss', 'アウフグース', 'Fan', 4, true),
  t('equipment', 'window', '窓', 'RectangleHorizontal', 5, true),
  t('equipment', 'scenic_view', '景色', 'Mountain', 6, true),

  // ── 自然環境（希望条件）「近くにある / 見える」
  t('environment', 'forest', '森', 'Trees', 1),
  t('environment', 'mountain', '山', 'Mountain', 2),
  t('environment', 'river', '川', 'Waves', 3),
  t('environment', 'lake', '湖', 'Waves', 4),
  t('environment', 'sea', '海', 'Sailboat', 5),
  t('environment', 'gorge', '渓谷', 'MountainSnow', 6),
  t('environment', 'panorama', '絶景', 'Binoculars', 7),

  // ── クールダウン体験（希望条件）「実際に入れる」
  t('cooldown', 'river', '川', 'Waves', 1),
  t('cooldown', 'lake', '湖', 'Waves', 2),
  t('cooldown', 'sea', '海', 'Sailboat', 3),
  t('cooldown', 'snow', '雪', 'Snowflake', 4),
  t('cooldown', 'spring_water', '天然水', 'Droplet', 5),
  t('cooldown', 'ground_water', '地下水', 'ArrowDownToLine', 6),
  t('cooldown', 'barrel', '樽', 'Cylinder', 7),
  t('cooldown', 'pool', 'プール', 'Waves', 8),
  t('cooldown', 'cold_bath', '水風呂', 'Bath', 9),
  t('cooldown', 'shower', 'シャワー', 'ShowerHead', 10),
  t('cooldown', 'none', 'なし', 'Ban', 11),

  // ── 外気浴（希望条件）
  t('outdoor_bath', 'forest', '森', 'Trees', 1),
  t('outdoor_bath', 'riverside', '川沿い', 'Waves', 2),
  t('outdoor_bath', 'lakeside', '湖畔', 'Waves', 3),
  t('outdoor_bath', 'seaside', '海辺', 'Sailboat', 4),
  t('outdoor_bath', 'mountain', '山', 'Mountain', 5),
  t('outdoor_bath', 'starry_sky', '星空', 'Stars', 6),
  t('outdoor_bath', 'panorama', '絶景', 'Binoculars', 7),
  t('outdoor_bath', 'roofed', '屋根あり', 'Umbrella', 8, true),
  t('outdoor_bath', 'rain_ok', '雨天利用可', 'CloudRain', 9, true),
  t('outdoor_bath', 'reclining', 'リクライニング', 'BedSingle', 10, true),
  t('outdoor_bath', 'infinity_chair', 'インフィニティチェア', 'Armchair', 11, true),
  t('outdoor_bath', 'hammock', 'ハンモック', 'RockingChair', 12, true),
  t('outdoor_bath', 'lie_down', '寝転び可能', 'BedDouble', 13, true),

  // ── 体験（希望条件）
  t('experience', 'river_dive', '川ダイブ', 'Waves', 1),
  t('experience', 'lake_dive', '湖ダイブ', 'Waves', 2),
  t('experience', 'snow_dive', '雪ダイブ', 'Snowflake', 3),
  t('experience', 'sea_swim', '海に入る', 'Sailboat', 4),
  t('experience', 'wood_firing', '薪焚き', 'Flame', 5),
  t('experience', 'self_loyly', 'セルフロウリュ', 'Droplets', 6),
  t('experience', 'bonfire', '焚き火', 'Flame', 7),
  t('experience', 'starry_outdoor_bath', '星空外気浴', 'Stars', 8),
  t('experience', 'morning_sauna', '朝サウナ', 'Sunrise', 9),
  t('experience', 'sunset', 'サンセット', 'Sunset', 10),
  t('experience', 'sunrise', 'サンライズ', 'Sunrise', 11),

  // ── プライベート性（必須条件の絶対条件として指定できる）
  t('privacy', 'full_private', '完全貸切', 'Lock', 1),
  t('privacy', 'time_private', '時間貸切', 'Clock', 2),
  t('privacy', 'semi_private', '半個室', 'DoorClosed', 3),
  t('privacy', 'mixed_gender', '男女共用', 'Users', 4),
  t('privacy', 'separated_gender', '男女別', 'UserRound', 5),
  t('privacy', 'shared_with_others', '他グループと共有', 'UsersRound', 6),
  t('privacy', 'single_group_only', '1組限定', 'UserRoundCheck', 7),

  // ── 利用条件（詳細条件）
  t('usage', 'swimwear_required', '水着必須', 'Shirt', 1, true),
  t('usage', 'swimwear_rental', '水着レンタル', 'ShoppingBag', 2, true),
  t('usage', 'nude_ok', '裸OK', 'UserRound', 3, true),
  t('usage', 'towel', 'タオル', 'Layers', 4, true),
  t('usage', 'food_ok', '飲食', 'UtensilsCrossed', 5, true),
  t('usage', 'alcohol_ok', '飲酒', 'Wine', 6, true),
  t('usage', 'children_ok', '子ども', 'Baby', 7, true),
  t('usage', 'pets_ok', 'ペット', 'PawPrint', 8, true),
  t('usage', 'photography_ok', '撮影', 'Camera', 9, true),

  // ── アクセス（詳細条件）
  t('access', 'by_car', '車', 'Car', 1, true),
  t('access', 'by_train', '電車', 'TrainFront', 2, true),
  t('access', 'on_foot', '徒歩', 'Footprints', 3, true),
  t('access', 'shuttle', '送迎', 'Bus', 4, true),
  t('access', 'parking', '駐車場', 'ParkingSquare', 5, true),
  t('access', 'unpaved_road', '未舗装道路', 'Milestone', 6, true),
  t('access', 'forest_road', '林道', 'TreePine', 7, true),
  t('access', 'winter_access', '冬季アクセス', 'Snowflake', 8, true),
  t('access', 'awd_recommended', '4WD推奨', 'Truck', 9, true),
];

const BY_ID = new Map<string, TaxonomyTerm>(
  TAXONOMY.map((term) => [`${term.category}:${term.key}`, term]),
);

/** 指定カテゴリの語彙を表示順で返す */
export function termsOf(category: TaxonomyCategory): TaxonomyTerm[] {
  return TAXONOMY.filter((term) => term.category === category).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

/** 語彙を1件引く。未登録なら null */
export function findTerm(ref: TagRef): TaxonomyTerm | null {
  return BY_ID.get(`${ref.category}:${ref.key}`) ?? null;
}

/** 日本語表示名。未登録の key はそのまま返す（画面を壊さない） */
export function labelOf(ref: TagRef): string {
  return findTerm(ref)?.labelJa ?? ref.key;
}

/** lucide-react のアイコン名。未登録なら汎用アイコン */
export function iconOf(ref: TagRef): string {
  return findTerm(ref)?.icon ?? 'Tag';
}

/**
 * サウナ条件として初期表示するカテゴリ。
 *
 * IMPORTANT: 必須 / 希望はカテゴリではなくタグ単位で決まる（TagLevel）。
 * 「川は必須、薪は希望」のような指定ができるよう、
 * カテゴリごとに必須・希望を分けない。
 */
export const WISH_CATEGORIES: readonly TaxonomyCategory[] = [
  'environment',
  'cooldown',
  'sauna_type',
  'outdoor_bath',
  'experience',
  'privacy',
];

/** 詳細条件として「条件を追加」で提示するカテゴリ */
export const ADVANCED_CATEGORIES: readonly TaxonomyCategory[] = [
  'heat_source',
  'equipment',
  'usage',
  'access',
];

/** カテゴリの見出し */
export const CATEGORY_LABELS: Record<TaxonomyCategory, string> = {
  sauna_type: 'サウナタイプ',
  heat_source: '熱源',
  equipment: 'サウナ設備',
  environment: '自然環境',
  outdoor_bath: '外気浴',
  experience: '体験',
  privacy: 'プライベート性',
  usage: '利用条件',
  access: 'アクセス',
  cooldown: 'クールダウン',
};

/**
 * カテゴリごとの補足。
 * 「近くにある」と「入れる」の違いをユーザーに伝えるために使う。
 */
export const CATEGORY_HINTS: Partial<Record<TaxonomyCategory, string>> = {
  environment: '近くにある・見える自然',
  cooldown: '実際に入れるもの',
};
