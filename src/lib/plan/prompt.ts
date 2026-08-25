import type { PlanCandidates } from './candidates';

/**
 * プラン生成に渡すユーザー条件。
 * ページの searchParams から組み立てる。
 */
export type PlanUserContext = {
  /** 日帰り / 宿泊 */
  isLodging: boolean;
  /** HH:mm。出発時刻 */
  departureTime: string | null;
  /** ISO 8601 日付 */
  date: string | null;
  /** 人数 */
  partySize: number | null;
  /** 食べたいごはんのジャンル（例: '海鮮', '和食'）。null はおまかせ */
  mealPreference: string | null;
  /** どんな体験をしたいか（例: 'activity', 'sightseeing'）。null はおまかせ */
  experiencePreference: string | null;
};

/**
 * PlanCandidates + ユーザー条件から Gemini に渡すプロンプト文字列を組み立てる。
 *
 * IMPORTANT:
 * - 事実情報（施設名・料金・営業時間）は候補データとしてそのまま渡す
 * - AI に施設を「検索」させない。候補の中から選ばせるだけ
 * - 出力は PlanItem[] の JSON のみ。説明文や施設情報を返させない
 */
export function buildPrompt(
  candidates: PlanCandidates,
  context: PlanUserContext,
): { system: string; user: string } {
  const { sauna, places } = candidates;

  // サウナ情報（中心。必ずプランに含める）
  const saunaInfo = {
    id: sauna.id,
    name: sauna.name,
    area: sauna.area ?? sauna.prefecture,
    travelMinutes: sauna.travelMinutes ?? null,
  };

  // レストラン候補
  const restaurantCandidates = places.restaurants.map((r) => ({
    id: r.restaurant.id,
    name: r.restaurant.name,
    genre: r.restaurant.genre,
    priceRange: formatPriceRange(r.restaurant.priceMin, r.restaurant.priceMax),
    travelMinutes: r.travelMinutes,
    recommendedTiming: r.recommendedTiming,
    recommendReason: r.recommendReason,
    recommendScore: r.recommendScore,
  }));

  // 観光・アクティビティ候補
  const spotCandidates = places.spots.map((s) => ({
    id: s.spot.id,
    name: s.spot.name,
    category: s.spot.category,
    description: s.spot.description,
    durationMinutes: s.durationMinutes,
    travelMinutes: s.travelMinutes,
    recommendScore: s.recommendScore,
  }));

  // 宿泊候補（日帰りの場合は空）
  const hotelCandidates = places.hotels.map((h) => ({
    id: h.hotel.id,
    name: h.hotel.name,
    lodgingType: h.hotel.lodgingType,
    priceRange: formatPriceRange(h.hotel.priceMin, h.hotel.priceMax),
    travelMinutes: h.travelMinutes,
    recommendScore: h.recommendScore,
  }));

  const system = buildSystemPrompt();

  const userContent = buildUserPrompt({
    sauna: saunaInfo,
    restaurants: restaurantCandidates,
    spots: spotCandidates,
    hotels: hotelCandidates,
    context,
  });

  return { system, user: userContent };
}

/**
 * システムプロンプト。AIの役割と制約を定義する。
 */
function buildSystemPrompt(): string {
  return `あなたはサウナを中心とした休日プランの組み立て担当です。

## 役割
ユーザーが選んだサウナを中心に、提供された候補リストの中から施設を選び、
訪問順序と時刻を決めて休日プランを組み立ててください。

## 絶対に守るルール
1. 候補リストに含まれる施設のIDのみ使用すること。リストにない施設を作らない
2. サウナは必ずプランに含める
3. 出力は指定されたJSON形式のみ。説明文や施設の詳細情報を含めない
4. noteフィールドは体験の流れを伝える一言（15文字以内）。不要なら空文字にする
5. noteに施設名・料金・営業時間・住所・アクセス情報を絶対に書かない
6. 日帰りプランの場合、hotelを含めない
7. startTimeはHH:mm形式（秒を付けない）

## 時間配分のルール
- サウナの滞在: 90〜150分（施設の規模による。目安120分）
- 食事の滞在: 45〜75分
- 観光・アクティビティ: durationMinutes の値を使う。なければ60分
- 移動: travelMinutes の値を必ず加算する。省略しない
- 各項目の startTime = 前の項目の終了時刻 + 移動時間
- 1日の活動は 8:00〜21:00 に収める。深夜にならないようにする
- 項目数は日帰りなら3〜4件、宿泊なら4〜5件が自然

## 組み立ての方針
- サウナ後のサ飯は最も満足度が高い。recommendedTiming が after_sauna の候補を優先する
- 移動時間が短い候補同士を組み合わせると1日の密度が上がる
- recommendScore が高い候補を優先するが、流れの自然さも考慮する
- 体力を考慮し、アクティビティ → サウナ → 食事 or サウナ → 食事 → 軽い観光 が自然
- 宿泊は必ず最後に配置する

## 温泉に関する制約（厳守）
- 温泉（category: onsen）をサウナの後に配置してはいけない
- 理由: サウナ施設で温浴体験は完結している。その後に別の温泉に行く流れは不自然
- 温泉を入れるなら「サウナの前に体を温める」用途でプランの冒頭に配置する
- 迷ったら温泉は省き、観光かアクティビティを優先する

## note の書き方
良い例: 「整いの後の一杯に」「汗を流した後に」「帰り道に寄れる」
悪い例: 「箱根の名物料理」「徒歩5分」「¥2,000のランチ」「11時開店」
事実情報はnoteに書かない。体験の気持ちを短く伝える

## title の書き方
プラン全体の魅力を20文字以内で表す一言。
良い例: 「渓流サウナと山の幸を味わう休日」「整いと湖畔散歩の一日」
悪い例: 「箱根天空露天サウナの休日」（施設名そのままはNG）
施設名を入れず、体験の組み合わせで表現する`;
}

/**
 * ユーザープロンプト。候補データと条件を構造化して渡す。
 */
function buildUserPrompt(data: {
  sauna: { id: string; name: string; area: string | null; travelMinutes: number | null };
  restaurants: readonly Record<string, unknown>[];
  spots: readonly Record<string, unknown>[];
  hotels: readonly Record<string, unknown>[];
  context: PlanUserContext;
}): string {
  const lines: string[] = [];

  lines.push('## サウナ（プランの中心）');
  lines.push(JSON.stringify(data.sauna, null, 2));
  lines.push('');

  lines.push('## サ飯の候補');
  if (data.restaurants.length > 0) {
    lines.push(JSON.stringify(data.restaurants, null, 2));
  } else {
    lines.push('候補なし');
  }
  lines.push('');

  lines.push('## 観光・アクティビティの候補');
  if (data.spots.length > 0) {
    lines.push(JSON.stringify(data.spots, null, 2));
  } else {
    lines.push('候補なし');
  }
  lines.push('');

  if (data.context.isLodging) {
    lines.push('## 宿泊の候補');
    if (data.hotels.length > 0) {
      lines.push(JSON.stringify(data.hotels, null, 2));
    } else {
      lines.push('候補なし');
    }
    lines.push('');
  }

  lines.push('## 条件');
  lines.push(`- タイプ: ${data.context.isLodging ? '宿泊' : '日帰り'}`);
  lines.push(`- 出発時刻: ${data.context.departureTime ?? '09:00（目安）'}`);
  if (data.context.date) {
    lines.push(`- 日付: ${data.context.date}`);
  }
  if (data.context.partySize) {
    lines.push(`- 人数: ${data.context.partySize}人`);
  }
  lines.push('');

  lines.push('## ユーザーの希望');
  if (data.context.mealPreference) {
    lines.push(`- 食事: 「${data.context.mealPreference}」系を食べたい。該当ジャンルの候補を優先して選ぶこと`);
  } else {
    lines.push('- 食事: おまかせ（recommendScore が高い候補を選ぶ）');
  }
  if (data.context.experiencePreference) {
    const expLabels: Record<string, string> = {
      activity: 'アクティブに体を動かしたい',
      sightseeing: '景色を楽しみたい・のんびり観光',
      onsen: 'サウナの前に温泉にも入りたい',
      none: '食事だけでいい。観光は不要',
    };
    const label = expLabels[data.context.experiencePreference] ?? data.context.experiencePreference;
    lines.push(`- 体験: ${label}`);
  } else {
    lines.push('- 体験: おまかせ');
  }
  lines.push('');

  lines.push('上記の候補と希望をもとに休日プランを組み立ててください。');

  return lines.join('\n');
}

/** 料金レンジを表示用文字列に。null は「不明」 */
function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return '不明';
  if (min !== null && max !== null) return `¥${min.toLocaleString()}〜¥${max.toLocaleString()}`;
  if (min !== null) return `¥${min.toLocaleString()}〜`;
  return `〜¥${max!.toLocaleString()}`;
}
