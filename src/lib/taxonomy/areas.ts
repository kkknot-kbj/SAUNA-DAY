/**
 * エリア定義。
 *
 * ホーム画面の「エリアから探す」と検索条件で使う。
 * DB ではなくコードで管理する（追加/変更はデプロイで反映）。
 */

export type AreaDef = {
  /** URL パラメータに使う一意キー */
  key: string;
  /** 表示ラベル */
  label: string;
  /** saunas.area に入る値のリスト。1エリアに複数の area 値を紐付ける */
  areaValues: string[];
};

/** エリア一覧。表示順に並べる */
export const AREAS: readonly AreaDef[] = [
  { key: 'okutama', label: '奥多摩・檜原', areaValues: ['奥多摩町', '檜原村'] },
  { key: 'hakone', label: '箱根・湘南', areaValues: ['箱根町'] },
  { key: 'miura', label: '三浦', areaValues: ['三浦市'] },
  { key: 'sagamiko', label: '相模湖', areaValues: ['相模原市'] },
  { key: 'chichibu', label: '秩父・長瀞', areaValues: ['秩父市', '長瀞町'] },
  { key: 'hanno', label: '飯能', areaValues: ['飯能市'] },
  { key: 'minamiboso', label: '南房総', areaValues: ['南房総市'] },
  { key: 'boso', label: '養老渓谷・九十九里', areaValues: ['大多喜町', '山武市'] },
  { key: 'ibaraki-north', label: '茨城北部', areaValues: ['大子町', '北茨城市'] },
  { key: 'ibaraki-central', label: '霞ヶ浦', areaValues: ['土浦市'] },
  { key: 'nasu-nikko', label: '那須・日光', areaValues: ['那須町', '日光市', '那須塩原市'] },
  { key: 'minakami', label: 'みなかみ・嬬恋', areaValues: ['みなかみ町', '嬬恋村'] },
  { key: 'akagi', label: '赤城', areaValues: ['前橋市'] },
];

/** key → AreaDef のルックアップ */
const AREA_MAP = new Map(AREAS.map((a) => [a.key, a]));

/** key からエリア定義を取得。見つからなければ null */
export function getArea(key: string): AreaDef | null {
  return AREA_MAP.get(key) ?? null;
}

/**
 * エリアキーの配列から、該当する area 値のセットを返す。
 * フィルタで使う。
 */
export function areaValuesFromKeys(keys: string[]): Set<string> {
  const values = new Set<string>();
  for (const key of keys) {
    const area = AREA_MAP.get(key);
    if (area) {
      for (const v of area.areaValues) values.add(v);
    }
  }
  return values;
}
