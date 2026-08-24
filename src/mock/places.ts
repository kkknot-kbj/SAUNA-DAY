import { everyday, withClosed } from './helpers';

import type {
  Hotel,
  LinkedHotel,
  LinkedRestaurant,
  LinkedSpot,
  Restaurant,
  Spot,
} from '@/lib/types';

/**
 * サ飯・観光・アクティビティ・温泉・宿泊のモックデータ。
 *
 * 休日プラン生成では、この登録済みデータだけを候補として使う。
 * AI にその場で施設を検索・生成させない。
 */

export const MOCK_RESTAURANTS: readonly Restaurant[] = [
  { id: 'r01', name: '奥多摩 山女魚食堂', genre: '定食', priceMin: 1200, priceMax: 2200, businessHours: withClosed('11:00', '15:00', ['tue']), address: '東京都西多摩郡奥多摩町（架空）', officialUrl: 'https://example.com/yamame' },
  { id: 'r02', name: '檜原 蕎麦処 山の井', genre: '蕎麦', priceMin: 1000, priceMax: 1800, businessHours: withClosed('11:00', '16:00', ['wed', 'thu']), address: '東京都西多摩郡檜原村（架空）', officialUrl: null },
  { id: 'r03', name: '稲城 river burger', genre: 'ハンバーガー', priceMin: 1100, priceMax: 1900, businessHours: everyday('11:00', '20:00'), address: '東京都稲城市（架空）', officialUrl: 'https://example.com/river-burger' },
  { id: 'r04', name: '箱根 豆腐料理 白雲', genre: '和食', priceMin: 2400, priceMax: 4800, businessHours: everyday('11:30', '21:00'), address: '神奈川県足柄下郡箱根町（架空）', officialUrl: 'https://example.com/hakuun' },
  { id: 'r05', name: '三浦 まぐろ丼 岬', genre: '海鮮', priceMin: 1600, priceMax: 3200, businessHours: withClosed('10:30', '19:00', ['wed']), address: '神奈川県三浦市（架空）', officialUrl: 'https://example.com/misaki-don' },
  { id: 'r06', name: '相模湖 湖畔カフェ nagi', genre: 'カフェ', priceMin: 900, priceMax: 1800, businessHours: everyday('09:00', '18:00'), address: '神奈川県相模原市緑区（架空）', officialUrl: null },
  { id: 'r07', name: '秩父 わらじ亭', genre: '定食', priceMin: 1300, priceMax: 2400, businessHours: withClosed('11:00', '18:00', ['thu']), address: '埼玉県秩父市（架空）', officialUrl: 'https://example.com/waraji' },
  // 営業時間が公開されていない店。推測で埋めない
  { id: 'r08', name: '長瀞 かき氷 天然氷店', genre: 'スイーツ', priceMin: 700, priceMax: 1400, businessHours: null, address: '埼玉県秩父郡長瀞町（架空）', officialUrl: null },
  { id: 'r09', name: '飯能 森のパン工房', genre: 'ベーカリー', priceMin: 600, priceMax: 1600, businessHours: withClosed('08:00', '17:00', ['mon']), address: '埼玉県飯能市（架空）', officialUrl: 'https://example.com/mori-pan' },
  { id: 'r10', name: '南房総 漁協食堂 汐風', genre: '海鮮', priceMin: 1500, priceMax: 3000, businessHours: withClosed('11:00', '15:00', ['tue']), address: '千葉県南房総市（架空）', officialUrl: 'https://example.com/shiokaze' },
  { id: 'r11', name: '養老渓谷 猪鍋 山彦', genre: '鍋', priceMin: 2200, priceMax: 4200, businessHours: withClosed('11:30', '20:00', ['mon']), address: '千葉県夷隅郡大多喜町（架空）', officialUrl: null },
  { id: 'r12', name: '九十九里 蛤焼 浜小屋', genre: '海鮮', priceMin: 1400, priceMax: 2800, businessHours: everyday('10:00', '17:00'), address: '千葉県山武市（架空）', officialUrl: 'https://example.com/hamagoya' },
  { id: 'r13', name: '大子 奥久慈しゃも処', genre: '鶏料理', priceMin: 1800, priceMax: 3400, businessHours: withClosed('11:00', '19:00', ['wed']), address: '茨城県久慈郡大子町（架空）', officialUrl: 'https://example.com/shamo' },
  { id: 'r14', name: '土浦 れんこん食堂', genre: '定食', priceMin: 1000, priceMax: 2000, businessHours: everyday('11:00', '21:00'), address: '茨城県土浦市（架空）', officialUrl: null },
  { id: 'r15', name: '北茨城 磯料理 波音', genre: '海鮮', priceMin: 1700, priceMax: 3600, businessHours: withClosed('11:00', '20:00', ['tue']), address: '茨城県北茨城市（架空）', officialUrl: null },
  { id: 'r16', name: '那須 高原チーズ工房', genre: 'カフェ', priceMin: 1200, priceMax: 2600, businessHours: everyday('10:00', '17:00'), address: '栃木県那須郡那須町（架空）', officialUrl: 'https://example.com/nasu-cheese' },
  { id: 'r17', name: '日光 湯波御膳 松風', genre: '和食', priceMin: 2000, priceMax: 4000, businessHours: withClosed('11:00', '19:00', ['thu']), address: '栃木県日光市（架空）', officialUrl: 'https://example.com/matsukaze' },
  { id: 'r18', name: '塩原 手打ちうどん 渓', genre: 'うどん', priceMin: 900, priceMax: 1700, businessHours: everyday('11:00', '18:00'), address: '栃木県那須塩原市（架空）', officialUrl: null },
  { id: 'r19', name: 'みなかみ 山賊焼 谷川', genre: '定食', priceMin: 1400, priceMax: 2600, businessHours: everyday('11:00', '21:00'), address: '群馬県利根郡みなかみ町（架空）', officialUrl: 'https://example.com/tanigawa' },
  { id: 'r20', name: '嬬恋 キャベツ食堂', genre: '洋食', priceMin: 1300, priceMax: 2400, businessHours: withClosed('11:00', '20:00', ['wed']), address: '群馬県吾妻郡嬬恋村（架空）', officialUrl: null },
  { id: 'r21', name: '赤城 うどん処 まる井', genre: 'うどん', priceMin: 800, priceMax: 1600, businessHours: withClosed('11:00', '19:00', ['mon']), address: '群馬県前橋市（架空）', officialUrl: null },
];

export const MOCK_SPOTS: readonly Spot[] = [
  { id: 'p01', name: '奥多摩湖 展望デッキ', category: 'sightseeing', description: 'ダム湖を見下ろす展望台', priceMin: 0, businessHours: everyday('08:00', '17:00'), address: '東京都西多摩郡奥多摩町（架空）', officialUrl: null },
  { id: 'p02', name: '奥多摩 日帰り温泉 river spa', category: 'onsen', description: '露天から渓谷を眺める日帰り温泉', priceMin: 900, businessHours: withClosed('10:00', '20:00', ['tue']), address: '東京都西多摩郡奥多摩町（架空）', officialUrl: 'https://example.com/river-spa' },
  { id: 'p03', name: '多摩川 カヤック体験', category: 'activity', description: '初心者向けの2時間コース', priceMin: 5500, businessHours: everyday('09:00', '16:00'), address: '東京都稲城市（架空）', officialUrl: 'https://example.com/tama-kayak' },
  { id: 'p04', name: '箱根 芦ノ湖遊覧', category: 'sightseeing', description: '湖を一周する遊覧船', priceMin: 1200, businessHours: everyday('09:30', '17:00'), address: '神奈川県足柄下郡箱根町（架空）', officialUrl: 'https://example.com/ashinoko' },
  { id: 'p05', name: '箱根 大湯温泉', category: 'onsen', description: '硫黄泉の日帰り湯', priceMin: 1400, businessHours: everyday('10:00', '21:00'), address: '神奈川県足柄下郡箱根町（架空）', officialUrl: null },
  { id: 'p06', name: '三浦 城ヶ崎ダイビング', category: 'activity', description: '体験ダイビング', priceMin: 12000, businessHours: withClosed('08:00', '16:00', ['wed']), address: '神奈川県三浦市（架空）', officialUrl: null },
  { id: 'p07', name: '相模湖 ボート', category: 'activity', description: '手漕ぎ・足漕ぎボート', priceMin: 1000, businessHours: everyday('09:00', '17:00'), address: '神奈川県相模原市緑区（架空）', officialUrl: null },
  { id: 'p08', name: '秩父 三峯神社', category: 'sightseeing', description: '標高1100mの山岳信仰の社', priceMin: 0, businessHours: everyday('09:00', '16:00'), address: '埼玉県秩父市（架空）', officialUrl: null },
  { id: 'p09', name: '長瀞 ライン下り', category: 'activity', description: '岩畳の渓谷を舟で下る', priceMin: 2000, businessHours: everyday('09:00', '16:00'), address: '埼玉県秩父郡長瀞町（架空）', officialUrl: 'https://example.com/nagatoro-line' },
  { id: 'p10', name: '秩父 武甲温泉', category: 'onsen', description: '露天付きの日帰り温泉', priceMin: 800, businessHours: everyday('10:00', '21:00'), address: '埼玉県秩父市（架空）', officialUrl: null },
  { id: 'p11', name: '飯能 天覧山ハイク', category: 'activity', description: '往復1時間の低山ハイク', priceMin: 0, businessHours: null, address: '埼玉県飯能市（架空）', officialUrl: null },
  { id: 'p12', name: '南房総 野島埼灯台', category: 'sightseeing', description: '房総最南端の灯台', priceMin: 300, businessHours: everyday('08:30', '16:00'), address: '千葉県南房総市（架空）', officialUrl: null },
  { id: 'p13', name: '南房総 岩風呂の湯', category: 'onsen', description: '海を見ながら入る日帰り湯', priceMin: 1100, businessHours: everyday('11:00', '20:00'), address: '千葉県南房総市（架空）', officialUrl: null },
  { id: 'p14', name: '養老渓谷 粟又の滝遊歩道', category: 'sightseeing', description: '滝沿いの遊歩道', priceMin: 0, businessHours: everyday('07:00', '17:00'), address: '千葉県夷隅郡大多喜町（架空）', officialUrl: null },
  { id: 'p15', name: '九十九里 サーフィン体験', category: 'activity', description: '初心者スクール', priceMin: 7000, businessHours: everyday('08:00', '17:00'), address: '千葉県山武市（架空）', officialUrl: null },
  { id: 'p16', name: '大子 袋田の滝', category: 'sightseeing', description: '四段に落ちる大滝', priceMin: 300, businessHours: everyday('08:00', '18:00'), address: '茨城県久慈郡大子町（架空）', officialUrl: null },
  { id: 'p17', name: '大子 森林の湯', category: 'onsen', description: '山間の日帰り温泉', priceMin: 700, businessHours: withClosed('10:00', '20:00', ['wed']), address: '茨城県久慈郡大子町（架空）', officialUrl: null },
  { id: 'p18', name: '霞ヶ浦 サイクリングロード', category: 'activity', description: '湖岸を走る自転車道', priceMin: 0, businessHours: null, address: '茨城県土浦市（架空）', officialUrl: null },
  { id: 'p19', name: '北茨城 五浦海岸', category: 'sightseeing', description: '断崖と入江の景勝地', priceMin: 0, businessHours: everyday('08:00', '17:00'), address: '茨城県北茨城市（架空）', officialUrl: null },
  { id: 'p20', name: '那須 ロープウェイ', category: 'activity', description: '茶臼岳の山頂駅へ', priceMin: 1800, businessHours: everyday('08:30', '16:30'), address: '栃木県那須郡那須町（架空）', officialUrl: null },
  { id: 'p21', name: '那須 鹿の湯', category: 'onsen', description: '硫黄泉の共同浴場', priceMin: 600, businessHours: everyday('08:00', '18:00'), address: '栃木県那須郡那須町（架空）', officialUrl: null },
  { id: 'p22', name: '日光 華厳ノ滝', category: 'sightseeing', description: '落差97mの滝', priceMin: 600, businessHours: everyday('08:00', '17:00'), address: '栃木県日光市（架空）', officialUrl: null },
  { id: 'p23', name: '奥日光 湯元温泉', category: 'onsen', description: '白濁の硫黄泉', priceMin: 800, businessHours: everyday('10:00', '20:00'), address: '栃木県日光市（架空）', officialUrl: null },
  { id: 'p24', name: '塩原 もみじ吊橋', category: 'sightseeing', description: '渓谷に架かる吊橋', priceMin: 0, businessHours: everyday('08:00', '17:00'), address: '栃木県那須塩原市（架空）', officialUrl: null },
  { id: 'p25', name: 'みなかみ ラフティング', category: 'activity', description: '利根川の激流を下る', priceMin: 8000, businessHours: everyday('08:00', '16:00'), address: '群馬県利根郡みなかみ町（架空）', officialUrl: 'https://example.com/minakami-raft' },
  { id: 'p26', name: 'みなかみ 谷川の湯', category: 'onsen', description: '渓流沿いの日帰り湯', priceMin: 900, businessHours: everyday('11:00', '20:00'), address: '群馬県利根郡みなかみ町（架空）', officialUrl: null },
  { id: 'p27', name: '嬬恋 天空の展望台', category: 'sightseeing', description: 'キャベツ畑と山並みを望む', priceMin: 0, businessHours: null, address: '群馬県吾妻郡嬬恋村（架空）', officialUrl: null },
  { id: 'p28', name: '嬬恋 湯尻川温泉', category: 'onsen', description: '源泉かけ流しの小さな湯', priceMin: 600, businessHours: withClosed('12:00', '20:00', ['thu']), address: '群馬県吾妻郡嬬恋村（架空）', officialUrl: null },
  { id: 'p29', name: '赤城 大沼カヌー', category: 'activity', description: 'カルデラ湖でのカヌー体験', priceMin: 4500, businessHours: everyday('09:00', '16:00'), address: '群馬県前橋市（架空）', officialUrl: null },
  { id: 'p30', name: '赤城 白樺の湯', category: 'onsen', description: '山腹の日帰り温泉', priceMin: 700, businessHours: everyday('10:00', '20:00'), address: '群馬県前橋市（架空）', officialUrl: null },
];

export const MOCK_HOTELS: readonly Hotel[] = [
  { id: 'h01', name: '奥多摩 渓流の宿', lodgingType: 'ryokan', priceMin: 14000, priceMax: 24000, address: '東京都西多摩郡奥多摩町（架空）', officialUrl: 'https://example.com/keiryu-yado', reservationUrl: 'https://example.com/keiryu-yado/reserve' },
  { id: 'h02', name: '檜原 グランピング森音', lodgingType: 'glamping', priceMin: 22000, priceMax: 38000, address: '東京都西多摩郡檜原村（架空）', officialUrl: 'https://example.com/morine', reservationUrl: 'https://example.com/morine/reserve' },
  { id: 'h03', name: '箱根 山景ホテル', lodgingType: 'hotel', priceMin: 26000, priceMax: 52000, address: '神奈川県足柄下郡箱根町（架空）', officialUrl: 'https://example.com/sankei', reservationUrl: 'https://example.com/sankei/reserve' },
  { id: 'h04', name: '三浦 海辺のゲストハウス', lodgingType: 'guesthouse', priceMin: 6500, priceMax: 11000, address: '神奈川県三浦市（架空）', officialUrl: null, reservationUrl: null },
  { id: 'h05', name: '相模湖 キャンプ場 みずべ', lodgingType: 'campsite', priceMin: 3500, priceMax: 6000, address: '神奈川県相模原市緑区（架空）', officialUrl: null, reservationUrl: 'https://example.com/mizube/reserve' },
  { id: 'h06', name: '秩父 山懐の宿', lodgingType: 'ryokan', priceMin: 15000, priceMax: 27000, address: '埼玉県秩父市（架空）', officialUrl: 'https://example.com/yamafutokoro', reservationUrl: 'https://example.com/yamafutokoro/reserve' },
  { id: 'h07', name: '長瀞 川沿いロッジ', lodgingType: 'guesthouse', priceMin: 7000, priceMax: 12000, address: '埼玉県秩父郡長瀞町（架空）', officialUrl: null, reservationUrl: null },
  { id: 'h08', name: '南房総 岬のオーベルジュ', lodgingType: 'hotel', priceMin: 24000, priceMax: 42000, address: '千葉県南房総市（架空）', officialUrl: 'https://example.com/misaki-auberge', reservationUrl: 'https://example.com/misaki-auberge/reserve' },
  { id: 'h09', name: '養老渓谷 離れの宿 山彦', lodgingType: 'ryokan', priceMin: 19000, priceMax: 34000, address: '千葉県夷隅郡大多喜町（架空）', officialUrl: 'https://example.com/yamabiko-yado', reservationUrl: 'https://example.com/yamabiko-yado/reserve' },
  { id: 'h10', name: '九十九里 浜のホステル', lodgingType: 'guesthouse', priceMin: 5500, priceMax: 9500, address: '千葉県山武市（架空）', officialUrl: null, reservationUrl: null },
  { id: 'h11', name: '大子 山あいの一軒宿', lodgingType: 'ryokan', priceMin: 13000, priceMax: 22000, address: '茨城県久慈郡大子町（架空）', officialUrl: null, reservationUrl: 'https://example.com/yamaai/reserve' },
  { id: 'h12', name: '霞ヶ浦 レイクサイドホテル', lodgingType: 'hotel', priceMin: 11000, priceMax: 19000, address: '茨城県土浦市（架空）', officialUrl: 'https://example.com/lakeside', reservationUrl: 'https://example.com/lakeside/reserve' },
  { id: 'h13', name: '那須 高原のコテージ', lodgingType: 'glamping', priceMin: 20000, priceMax: 36000, address: '栃木県那須郡那須町（架空）', officialUrl: 'https://example.com/nasu-cottage', reservationUrl: 'https://example.com/nasu-cottage/reserve' },
  { id: 'h14', name: '中禅寺 湖畔の宿', lodgingType: 'ryokan', priceMin: 23000, priceMax: 45000, address: '栃木県日光市（架空）', officialUrl: 'https://example.com/kohan-yado', reservationUrl: 'https://example.com/kohan-yado/reserve' },
  { id: 'h15', name: '塩原 湯泉旅館', lodgingType: 'ryokan', priceMin: 16000, priceMax: 28000, address: '栃木県那須塩原市（架空）', officialUrl: 'https://example.com/yusen-ryokan', reservationUrl: null },
  { id: 'h16', name: 'みなかみ 谷川ロッジ', lodgingType: 'guesthouse', priceMin: 8000, priceMax: 14000, address: '群馬県利根郡みなかみ町（架空）', officialUrl: 'https://example.com/tanigawa-lodge', reservationUrl: 'https://example.com/tanigawa-lodge/reserve' },
  { id: 'h17', name: '嬬恋 星見のヴィラ', lodgingType: 'glamping', priceMin: 25000, priceMax: 44000, address: '群馬県吾妻郡嬬恋村（架空）', officialUrl: 'https://example.com/hoshimi-villa', reservationUrl: 'https://example.com/hoshimi-villa/reserve' },
  { id: 'h18', name: '赤城 大沼キャンプ場', lodgingType: 'campsite', priceMin: 3000, priceMax: 5500, address: '群馬県前橋市（架空）', officialUrl: null, reservationUrl: null },
];

const restaurantById = new Map(MOCK_RESTAURANTS.map((r) => [r.id, r]));
const spotById = new Map(MOCK_SPOTS.map((s) => [s.id, s]));
const hotelById = new Map(MOCK_HOTELS.map((h) => [h.id, h]));

type RestaurantLink = {
  id: string;
  km: number | null;
  min: number | null;
  timing: LinkedRestaurant['recommendedTiming'];
  reason: string | null;
  score: number;
};

type SpotLink = {
  id: string;
  km: number | null;
  min: number | null;
  duration: number | null;
  score: number;
};

type HotelLink = { id: string; km: number | null; min: number | null; score: number };

/**
 * サウナ → 周辺施設の中間データ。
 * 距離・移動時間・おすすめ度は関係側が持つ（要件11）。
 */
const LINKS: Record<
  string,
  { restaurants: RestaurantLink[]; spots: SpotLink[]; hotels: HotelLink[] }
> = {
  s01: {
    restaurants: [
      { id: 'r01', km: 2.4, min: 6, timing: 'after_sauna', reason: '川魚の塩焼きが名物。サウナの後に歩いて行ける', score: 0.9 },
      { id: 'r02', km: 14.0, min: 28, timing: 'lunch', reason: '手打ち蕎麦', score: 0.6 },
    ],
    spots: [
      { id: 'p01', km: 6.2, min: 14, duration: 40, score: 0.7 },
      { id: 'p02', km: 3.1, min: 8, duration: 60, score: 0.85 },
    ],
    hotels: [{ id: 'h01', km: 4.5, min: 11, score: 0.8 }],
  },
  s02: {
    restaurants: [{ id: 'r02', km: 3.2, min: 9, timing: 'after_sauna', reason: '村内の蕎麦処', score: 0.85 }],
    spots: [{ id: 'p02', km: 12.0, min: 25, duration: 60, score: 0.6 }],
    hotels: [{ id: 'h02', km: 1.2, min: 4, score: 0.9 }],
  },
  s21: {
    restaurants: [{ id: 'r03', km: 1.1, min: 4, timing: 'after_sauna', reason: '河川敷から徒歩圏', score: 0.85 }],
    spots: [{ id: 'p03', km: 0.6, min: 2, duration: 120, score: 0.8 }],
    hotels: [],
  },
  s03: {
    restaurants: [
      { id: 'r04', km: 2.0, min: 6, timing: 'dinner', reason: '湯葉と豆腐のコース', score: 0.85 },
    ],
    spots: [
      { id: 'p04', km: 4.4, min: 12, duration: 70, score: 0.75 },
      { id: 'p05', km: 2.8, min: 8, duration: 60, score: 0.8 },
    ],
    hotels: [{ id: 'h03', km: 1.5, min: 5, score: 0.9 }],
  },
  s04: {
    restaurants: [{ id: 'r05', km: 1.8, min: 5, timing: 'after_sauna', reason: '漁港直送のまぐろ丼', score: 0.9 }],
    spots: [{ id: 'p06', km: 8.0, min: 18, duration: 180, score: 0.6 }],
    hotels: [{ id: 'h04', km: 2.2, min: 7, score: 0.7 }],
  },
  s05: {
    restaurants: [{ id: 'r06', km: 0.8, min: 3, timing: 'after_sauna', reason: '湖畔のカフェ', score: 0.8 }],
    spots: [{ id: 'p07', km: 1.0, min: 3, duration: 60, score: 0.7 }],
    hotels: [{ id: 'h05', km: 2.5, min: 7, score: 0.65 }],
  },
  s06: {
    restaurants: [{ id: 'r07', km: 5.5, min: 13, timing: 'after_sauna', reason: '秩父名物のわらじカツ', score: 0.85 }],
    spots: [
      { id: 'p08', km: 18.0, min: 40, duration: 90, score: 0.7 },
      { id: 'p10', km: 6.0, min: 14, duration: 60, score: 0.75 },
    ],
    hotels: [{ id: 'h06', km: 7.0, min: 16, score: 0.8 }],
  },
  s07: {
    restaurants: [{ id: 'r08', km: 0.5, min: 2, timing: 'after_sauna', reason: '天然氷のかき氷', score: 0.8 }],
    spots: [{ id: 'p09', km: 0.7, min: 3, duration: 60, score: 0.85 }],
    hotels: [{ id: 'h07', km: 1.0, min: 4, score: 0.7 }],
  },
  s08: {
    restaurants: [{ id: 'r09', km: 3.0, min: 8, timing: 'lunch', reason: '薪窯のパン', score: 0.75 }],
    spots: [{ id: 'p11', km: 4.2, min: 11, duration: 60, score: 0.6 }],
    hotels: [],
  },
  s09: {
    restaurants: [{ id: 'r10', km: 3.6, min: 9, timing: 'after_sauna', reason: '漁協直営', score: 0.9 }],
    spots: [
      { id: 'p12', km: 2.0, min: 6, duration: 40, score: 0.75 },
      { id: 'p13', km: 4.0, min: 10, duration: 60, score: 0.7 },
    ],
    hotels: [{ id: 'h08', km: 1.8, min: 5, score: 0.9 }],
  },
  s10: {
    restaurants: [{ id: 'r11', km: 1.2, min: 4, timing: 'dinner', reason: '宿の食事処', score: 0.85 }],
    spots: [{ id: 'p14', km: 5.0, min: 12, duration: 70, score: 0.8 }],
    hotels: [{ id: 'h09', km: 0.1, min: 1, score: 0.95 }],
  },
  s11: {
    restaurants: [{ id: 'r12', km: 1.5, min: 4, timing: 'after_sauna', reason: '浜焼きの蛤', score: 0.85 }],
    spots: [{ id: 'p15', km: 2.0, min: 6, duration: 150, score: 0.7 }],
    hotels: [{ id: 'h10', km: 2.8, min: 8, score: 0.65 }],
  },
  s12: {
    restaurants: [{ id: 'r13', km: 6.5, min: 15, timing: 'after_sauna', reason: '奥久慈しゃもの親子丼', score: 0.85 }],
    spots: [
      { id: 'p16', km: 4.0, min: 10, duration: 50, score: 0.85 },
      { id: 'p17', km: 5.2, min: 13, duration: 60, score: 0.7 },
    ],
    hotels: [{ id: 'h11', km: 7.5, min: 18, score: 0.75 }],
  },
  s13: {
    restaurants: [{ id: 'r14', km: 2.2, min: 7, timing: 'lunch', reason: 'れんこん料理', score: 0.7 }],
    spots: [{ id: 'p18', km: 0.4, min: 2, duration: 90, score: 0.75 }],
    hotels: [{ id: 'h12', km: 3.0, min: 9, score: 0.7 }],
  },
  s14: {
    restaurants: [{ id: 'r15', km: 2.8, min: 8, timing: 'after_sauna', reason: '磯料理', score: 0.8 }],
    spots: [{ id: 'p19', km: 3.5, min: 9, duration: 50, score: 0.75 }],
    hotels: [],
  },
  s15: {
    restaurants: [{ id: 'r16', km: 4.0, min: 10, timing: 'lunch', reason: '自家製チーズ', score: 0.8 }],
    spots: [
      { id: 'p20', km: 8.0, min: 20, duration: 90, score: 0.75 },
      { id: 'p21', km: 6.0, min: 15, duration: 50, score: 0.85 },
    ],
    hotels: [{ id: 'h13', km: 2.0, min: 6, score: 0.9 }],
  },
  s16: {
    restaurants: [{ id: 'r17', km: 3.0, min: 9, timing: 'dinner', reason: '日光湯波の御膳', score: 0.85 }],
    spots: [
      { id: 'p22', km: 2.5, min: 8, duration: 40, score: 0.85 },
      { id: 'p23', km: 11.0, min: 22, duration: 60, score: 0.8 },
    ],
    hotels: [{ id: 'h14', km: 0.8, min: 3, score: 0.95 }],
  },
  s17: {
    restaurants: [{ id: 'r18', km: 1.6, min: 5, timing: 'after_sauna', reason: '手打ちうどん', score: 0.75 }],
    spots: [{ id: 'p24', km: 2.2, min: 7, duration: 40, score: 0.7 }],
    hotels: [{ id: 'h15', km: 0.1, min: 1, score: 0.9 }],
  },
  s18: {
    restaurants: [{ id: 'r19', km: 3.4, min: 9, timing: 'after_sauna', reason: 'ボリュームのある定食', score: 0.85 }],
    spots: [
      { id: 'p25', km: 2.0, min: 6, duration: 180, score: 0.85 },
      { id: 'p26', km: 4.5, min: 11, duration: 60, score: 0.8 },
    ],
    hotels: [{ id: 'h16', km: 3.0, min: 8, score: 0.85 }],
  },
  s19: {
    restaurants: [{ id: 'r20', km: 5.0, min: 12, timing: 'dinner', reason: '地元キャベツを使った洋食', score: 0.8 }],
    spots: [
      { id: 'p27', km: 3.0, min: 9, duration: 40, score: 0.8 },
      { id: 'p28', km: 6.0, min: 14, duration: 50, score: 0.7 },
    ],
    hotels: [{ id: 'h17', km: 1.0, min: 4, score: 0.9 }],
  },
  s20: {
    restaurants: [{ id: 'r21', km: 8.0, min: 18, timing: 'after_sauna', reason: '地粉のうどん', score: 0.7 }],
    spots: [
      { id: 'p29', km: 0.5, min: 2, duration: 90, score: 0.8 },
      { id: 'p30', km: 5.0, min: 13, duration: 60, score: 0.75 },
    ],
    hotels: [{ id: 'h18', km: 0.6, min: 3, score: 0.7 }],
  },
};

/** 指定サウナに紐付く周辺施設。未登録のサウナは空を返す */
export function linkedPlacesOf(saunaId: string): {
  restaurants: LinkedRestaurant[];
  spots: LinkedSpot[];
  hotels: LinkedHotel[];
} {
  const link = LINKS[saunaId];
  if (link === undefined) return { restaurants: [], spots: [], hotels: [] };

  return {
    restaurants: link.restaurants.flatMap((l) => {
      const restaurant = restaurantById.get(l.id);
      if (restaurant === undefined) return [];
      return [
        {
          restaurant,
          distanceKm: l.km,
          travelMinutes: l.min,
          recommendScore: l.score,
          recommendedTiming: l.timing,
          recommendReason: l.reason,
        },
      ];
    }),
    spots: link.spots.flatMap((l) => {
      const spot = spotById.get(l.id);
      if (spot === undefined) return [];
      return [
        {
          spot,
          distanceKm: l.km,
          travelMinutes: l.min,
          recommendScore: l.score,
          durationMinutes: l.duration,
        },
      ];
    }),
    hotels: link.hotels.flatMap((l) => {
      const hotel = hotelById.get(l.id);
      if (hotel === undefined) return [];
      return [{ hotel, distanceKm: l.km, travelMinutes: l.min, recommendScore: l.score }];
    }),
  };
}
