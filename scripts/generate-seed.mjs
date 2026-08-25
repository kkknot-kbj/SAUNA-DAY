/**
 * モックデータを supabase/seed.sql に変換するスクリプト。
 * 実行: node scripts/generate-seed.mjs
 *
 * saunas.ts / places.ts / origins.ts / taxonomy/terms.ts のデータを読み、
 * INSERT 文を生成する。
 */
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(__dirname, '..', 'supabase', 'seed.sql');

// ──────────────── helpers ────────────────
function esc(val) {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function uuid(shortId) {
  // Expand short IDs like 's01', 'r02', 'p03', 'h04' → deterministic UUID (hex only)
  // Convert each char to its hex char code to ensure valid UUID
  const hex = Buffer.from(shortId, 'utf-8').toString('hex').padEnd(12, '0').slice(0, 12);
  return `'00000000-0000-4000-a000-${hex}'`;
}

// ──────────────── TAXONOMY ────────────────
const TAXONOMY = [
  // sauna_type
  ['sauna_type', 'hut', '小屋', 'Home', 1, false],
  ['sauna_type', 'tent', 'テント', 'Tent', 2, false],
  ['sauna_type', 'barrel', 'バレル', 'Cylinder', 3, false],
  ['sauna_type', 'container', 'コンテナ', 'Container', 4, false],
  ['sauna_type', 'open_air', '露天', 'CloudSun', 5, false],
  // heat_source
  ['heat_source', 'wood', '薪', 'Flame', 1, true],
  ['heat_source', 'electric', '電気', 'Zap', 2, true],
  ['heat_source', 'gas', 'ガス', 'Wind', 3, true],
  // equipment
  ['equipment', 'loyly', 'ロウリュ', 'Droplet', 1, true],
  ['equipment', 'self_loyly', 'セルフロウリュ', 'Droplets', 2, true],
  ['equipment', 'auto_loyly', 'オートロウリュ', 'Timer', 3, true],
  ['equipment', 'aufguss', 'アウフグース', 'Fan', 4, true],
  ['equipment', 'window', '窓', 'RectangleHorizontal', 5, true],
  ['equipment', 'scenic_view', '景色', 'Mountain', 6, true],
  // environment
  ['environment', 'forest', '森', 'Trees', 1, false],
  ['environment', 'mountain', '山', 'Mountain', 2, false],
  ['environment', 'river', '川', 'Waves', 3, false],
  ['environment', 'lake', '湖', 'Waves', 4, false],
  ['environment', 'sea', '海', 'Sailboat', 5, false],
  ['environment', 'gorge', '渓谷', 'MountainSnow', 6, false],
  ['environment', 'panorama', '絶景', 'Binoculars', 7, false],
  // cooldown
  ['cooldown', 'river', '川', 'Waves', 1, false],
  ['cooldown', 'lake', '湖', 'Waves', 2, false],
  ['cooldown', 'sea', '海', 'Sailboat', 3, false],
  ['cooldown', 'snow', '雪', 'Snowflake', 4, false],
  ['cooldown', 'spring_water', '天然水', 'Droplet', 5, false],
  ['cooldown', 'ground_water', '地下水', 'ArrowDownToLine', 6, false],
  ['cooldown', 'barrel', '樽', 'Cylinder', 7, false],
  ['cooldown', 'pool', 'プール', 'Waves', 8, false],
  ['cooldown', 'cold_bath', '水風呂', 'Bath', 9, false],
  ['cooldown', 'shower', 'シャワー', 'ShowerHead', 10, false],
  ['cooldown', 'none', 'なし', 'Ban', 11, false],
  // outdoor_bath
  ['outdoor_bath', 'forest', '森', 'Trees', 1, false],
  ['outdoor_bath', 'riverside', '川沿い', 'Waves', 2, false],
  ['outdoor_bath', 'lakeside', '湖畔', 'Waves', 3, false],
  ['outdoor_bath', 'seaside', '海辺', 'Sailboat', 4, false],
  ['outdoor_bath', 'mountain', '山', 'Mountain', 5, false],
  ['outdoor_bath', 'starry_sky', '星空', 'Stars', 6, false],
  ['outdoor_bath', 'panorama', '絶景', 'Binoculars', 7, false],
  ['outdoor_bath', 'roofed', '屋根あり', 'Umbrella', 8, true],
  ['outdoor_bath', 'rain_ok', '雨天利用可', 'CloudRain', 9, true],
  ['outdoor_bath', 'reclining', 'リクライニング', 'BedSingle', 10, true],
  ['outdoor_bath', 'infinity_chair', 'インフィニティチェア', 'Armchair', 11, true],
  ['outdoor_bath', 'hammock', 'ハンモック', 'RockingChair', 12, true],
  ['outdoor_bath', 'lie_down', '寝転び可能', 'BedDouble', 13, true],
  // experience
  ['experience', 'river_dive', '川ダイブ', 'Waves', 1, false],
  ['experience', 'lake_dive', '湖ダイブ', 'Waves', 2, false],
  ['experience', 'snow_dive', '雪ダイブ', 'Snowflake', 3, false],
  ['experience', 'sea_swim', '海に入る', 'Sailboat', 4, false],
  ['experience', 'wood_firing', '薪焚き', 'Flame', 5, false],
  ['experience', 'self_loyly', 'セルフロウリュ', 'Droplets', 6, false],
  ['experience', 'bonfire', '焚き火', 'Flame', 7, false],
  ['experience', 'starry_outdoor_bath', '星空外気浴', 'Stars', 8, false],
  ['experience', 'morning_sauna', '朝サウナ', 'Sunrise', 9, false],
  ['experience', 'sunset', 'サンセット', 'Sunset', 10, false],
  ['experience', 'sunrise', 'サンライズ', 'Sunrise', 11, false],
  // privacy
  ['privacy', 'full_private', '完全貸切', 'Lock', 1, false],
  ['privacy', 'time_private', '時間貸切', 'Clock', 2, false],
  ['privacy', 'semi_private', '半個室', 'DoorClosed', 3, false],
  ['privacy', 'mixed_gender', '男女共用', 'Users', 4, false],
  ['privacy', 'separated_gender', '男女別', 'UserRound', 5, false],
  ['privacy', 'shared_with_others', '他グループと共有', 'UsersRound', 6, false],
  ['privacy', 'single_group_only', '1組限定', 'UserRoundCheck', 7, false],
  // usage
  ['usage', 'swimwear_required', '水着必須', 'Shirt', 1, true],
  ['usage', 'swimwear_rental', '水着レンタル', 'ShoppingBag', 2, true],
  ['usage', 'nude_ok', '裸OK', 'UserRound', 3, true],
  ['usage', 'towel', 'タオル', 'Layers', 4, true],
  ['usage', 'food_ok', '飲食', 'UtensilsCrossed', 5, true],
  ['usage', 'alcohol_ok', '飲酒', 'Wine', 6, true],
  ['usage', 'children_ok', '子ども', 'Baby', 7, true],
  ['usage', 'pets_ok', 'ペット', 'PawPrint', 8, true],
  ['usage', 'photography_ok', '撮影', 'Camera', 9, true],
  // access
  ['access', 'by_car', '車', 'Car', 1, true],
  ['access', 'by_train', '電車', 'TrainFront', 2, true],
  ['access', 'on_foot', '徒歩', 'Footprints', 3, true],
  ['access', 'shuttle', '送迎', 'Bus', 4, true],
  ['access', 'parking', '駐車場', 'ParkingSquare', 5, true],
  ['access', 'unpaved_road', '未舗装道路', 'Milestone', 6, true],
  ['access', 'forest_road', '林道', 'TreePine', 7, true],
  ['access', 'winter_access', '冬季アクセス', 'Snowflake', 8, true],
  ['access', 'awd_recommended', '4WD推奨', 'Truck', 9, true],
];

// ──────────────── SEARCH WEIGHTS ────────────────
const WEIGHTS = [
  ['condition_match', 0.55],
  ['distance', 0.2],
  ['price', 0.1],
  ['popularity', 0.1],
  ['preference', 0.05],
];

// ──────────────── ORIGINS ────────────────
const ORIGINS = [
  ['tokyo', '東京', 35.6812, 139.7671],
  ['yokohama', '横浜', 35.4657, 139.6222],
  ['omiya', '大宮', 35.9065, 139.6238],
  ['chiba', '千葉', 35.6132, 140.1131],
  ['tachikawa', '立川', 35.6979, 139.4139],
];

// ──────────────── SAUNAS ────────────────
const SAUNAS = [
  { id: 's01', slug: 'okutama-kawabe-sauna', name: '奥多摩 川辺サウナ', pref: '東京都', area: '奥多摩町', address: '東京都西多摩郡奥多摩町（架空）', lat: 35.809, lng: 139.0966, desc: '多摩川の河原に直接テントを張るサウナ。水深のある淵に飛び込める区画があり、夏は流れの中で体を冷やせる。', priceMin: 4800, priceMax: 7200, priceNote: null, capMin: 1, capMax: 6, tempMin: 85, tempMax: 100, hours: {"mon":{"open":"09:00","close":"18:00"},"tue":null,"wed":null,"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"18:00"},"sun":{"open":"09:00","close":"18:00"},"note":"増水時は休業"}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '河原沿いに5台', resUrl: 'https://example.com/okutama-kawabe/reserve', offUrl: 'https://example.com/okutama-kawabe', phone: null, pop: 0.82 },
  { id: 's02', slug: 'hinohara-mori-no-koya', name: '檜原 森の小屋', pref: '東京都', area: '檜原村', address: '東京都西多摩郡檜原村（架空）', lat: 35.7397, lng: 139.1497, desc: '杉林に囲まれた1組限定の小屋サウナ。沢の水を引いた樽で冷やし、ハンモックで森を眺めて休む。', priceMin: 12000, priceMax: 18000, priceNote: '1棟あたり（最大4名）', capMin: 1, capMax: 4, tempMin: 90, tempMax: 105, hours: {"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"21:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '3台', resUrl: 'https://example.com/hinohara-mori/reserve', offUrl: 'https://example.com/hinohara-mori', phone: null, pop: 0.74 },
  { id: 's21', slug: 'tamagawa-kasenshiki-sauna', name: '多摩川 河川敷サウナ', pref: '東京都', area: '稲城市', address: '東京都稲城市（架空）', lat: 35.6379, lng: 139.5046, desc: '都心から電車で40分の河川敷。浅瀬に膝まで浸かって冷やす。手軽さを優先した価格設定。', priceMin: 3200, priceMax: 4200, priceNote: null, capMin: 1, capMax: 8, tempMin: 80, tempMax: 92, hours: {"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":"増水時は休業"}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '3台（河川敷駐車場）', resUrl: 'https://example.com/tamagawa-kasenshiki/reserve', offUrl: 'https://example.com/tamagawa-kasenshiki', phone: null, pop: 0.58 },
  { id: 's03', slug: 'hakone-tenku-roten', name: '箱根 天空露天サウナ', pref: '神奈川県', area: '箱根町', address: '神奈川県足柄下郡箱根町（架空）', lat: 35.2324, lng: 139.1069, desc: '斜面に張り出したデッキから山並みを見下ろす露天サウナ。夕方は雲海が出ることがある。', priceMin: 6500, priceMax: 9800, priceNote: null, capMin: 2, capMax: 10, tempMin: 80, tempMax: 95, hours: {"mon":{"open":"11:00","close":"22:00"},"tue":{"open":"11:00","close":"22:00"},"wed":{"open":"11:00","close":"22:00"},"thu":{"open":"11:00","close":"22:00"},"fri":{"open":"11:00","close":"22:00"},"sat":{"open":"11:00","close":"22:00"},"sun":{"open":"11:00","close":"22:00"},"note":null}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '20台', resUrl: 'https://example.com/hakone-tenku/reserve', offUrl: 'https://example.com/hakone-tenku', phone: null, pop: 0.91 },
  { id: 's04', slug: 'miura-umibe-barrel', name: '三浦 海辺バレル', pref: '神奈川県', area: '三浦市', address: '神奈川県三浦市（架空）', lat: 35.1667, lng: 139.65, desc: '砂浜に据えたバレルサウナ。目の前の海に入って冷やせる。冬は波が高い日が多い。', priceMin: 5200, priceMax: 7800, priceNote: null, capMin: 1, capMax: 5, tempMin: 85, tempMax: 95, hours: {"mon":{"open":"09:00","close":"19:00"},"tue":{"open":"09:00","close":"19:00"},"wed":null,"thu":{"open":"09:00","close":"19:00"},"fri":{"open":"09:00","close":"19:00"},"sat":{"open":"09:00","close":"19:00"},"sun":{"open":"09:00","close":"19:00"},"note":"荒天時は中止"}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '海岸駐車場を利用（有料）', resUrl: 'https://example.com/miura-barrel/reserve', offUrl: 'https://example.com/miura-barrel', phone: null, pop: 0.78 },
  { id: 's05', slug: 'sagamiko-kohan-container', name: '相模湖 湖畔コンテナ', pref: '神奈川県', area: '相模原市', address: '神奈川県相模原市緑区（架空）', lat: 35.61, lng: 139.19, desc: '湖に張り出した桟橋から湖水に入れるコンテナサウナ。都心から1時間強で着く。', priceMin: 4200, priceMax: 6000, priceNote: null, capMin: 1, capMax: 8, tempMin: 88, tempMax: 98, hours: {"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '10台', resUrl: 'https://example.com/sagamiko-container/reserve', offUrl: 'https://example.com/sagamiko-container', phone: null, pop: 0.69 },
  { id: 's06', slug: 'chichibu-keikoku-tent', name: '秩父 渓谷テントサウナ', pref: '埼玉県', area: '秩父市', address: '埼玉県秩父市（架空）', lat: 35.9917, lng: 139.0786, desc: '岩壁に囲まれた渓谷でのテントサウナ。淵は水深があり飛び込める。', priceMin: 5500, priceMax: 8000, priceNote: null, capMin: 2, capMax: 8, tempMin: 90, tempMax: 100, hours: {"mon":{"open":"09:30","close":"17:30"},"tue":{"open":"09:30","close":"17:30"},"wed":{"open":"09:30","close":"17:30"},"thu":null,"fri":{"open":"09:30","close":"17:30"},"sat":{"open":"09:30","close":"17:30"},"sun":{"open":"09:30","close":"17:30"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '8台（未舗装）', resUrl: 'https://example.com/chichibu-keikoku/reserve', offUrl: 'https://example.com/chichibu-keikoku', phone: null, pop: 0.8 },
  { id: 's07', slug: 'nagatoro-iwadatami-sauna', name: '長瀞 岩畳サウナ', pref: '埼玉県', area: '長瀞町', address: '埼玉県秩父郡長瀞町（架空）', lat: 36.0886, lng: 139.1128, desc: null, priceMin: null, priceMax: null, priceNote: '公式サイトで確認', capMin: 2, capMax: 12, tempMin: 85, tempMax: 95, hours: {"mon":{"open":"10:00","close":"17:00"},"tue":{"open":"10:00","close":"17:00"},"wed":{"open":"10:00","close":"17:00"},"thu":{"open":"10:00","close":"17:00"},"fri":{"open":"10:00","close":"17:00"},"sat":{"open":"10:00","close":"17:00"},"sun":{"open":"10:00","close":"17:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: null, resUrl: null, offUrl: 'https://example.com/nagatoro-iwadatami', phone: null, pop: 0.55 },
  { id: 's08', slug: 'hanno-shinrin-hut', name: '飯能 森林ハットサウナ', pref: '埼玉県', area: '飯能市', address: '埼玉県飯能市（架空）', lat: 35.8556, lng: 139.3278, desc: '雑木林の中の小屋サウナ。川は徒歩3分の距離にあるが、入水はできず水風呂で冷やす。', priceMin: 3800, priceMax: 5200, priceNote: null, capMin: 1, capMax: 6, tempMin: 88, tempMax: 96, hours: {"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"21:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '6台', resUrl: 'https://example.com/hanno-shinrin/reserve', offUrl: 'https://example.com/hanno-shinrin', phone: null, pop: 0.61 },
  { id: 's09', slug: 'minamiboso-sunset-barrel', name: '南房総 サンセットバレル', pref: '千葉県', area: '南房総市', address: '千葉県南房総市（架空）', lat: 34.9833, lng: 139.8667, desc: '西向きの岬に置かれたバレルサウナ。日没の時間帯に合わせた枠がある。', priceMin: 5800, priceMax: 8600, priceNote: null, capMin: 2, capMax: 6, tempMin: 85, tempMax: 98, hours: {"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '5台', resUrl: 'https://example.com/minamiboso-sunset/reserve', offUrl: 'https://example.com/minamiboso-sunset', phone: null, pop: 0.76 },
  { id: 's10', slug: 'yoro-keikoku-hanare', name: '養老渓谷 離れサウナ', pref: '千葉県', area: '大多喜町', address: '千葉県夷隅郡大多喜町（架空）', lat: 35.25, lng: 140.15, desc: '渓谷沿いの宿の離れにあるサウナ。眼下に川が流れるが入水はできず、地下水の水風呂で冷やす。', priceMin: 7000, priceMax: 11000, priceNote: '宿泊者は割引', capMin: 1, capMax: 4, tempMin: 82, tempMax: 92, hours: {"mon":null,"tue":{"open":"14:00","close":"23:00"},"wed":{"open":"14:00","close":"23:00"},"thu":{"open":"14:00","close":"23:00"},"fri":{"open":"14:00","close":"23:00"},"sat":{"open":"14:00","close":"23:00"},"sun":{"open":"14:00","close":"23:00"},"note":null}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '12台', resUrl: 'https://example.com/yoro-hanare/reserve', offUrl: 'https://example.com/yoro-hanare', phone: null, pop: 0.66 },
  { id: 's11', slug: 'kujukuri-sunrise-sauna', name: '九十九里 サンライズサウナ', pref: '千葉県', area: '山武市', address: '千葉県山武市（架空）', lat: 35.5, lng: 140.4, desc: '東向きの砂浜。朝5時からの枠で日の出を見ながら外気浴ができる。', priceMin: 4500, priceMax: 6200, priceNote: null, capMin: 1, capMax: 8, tempMin: 85, tempMax: 95, hours: {"mon":{"open":"05:00","close":"18:00"},"tue":{"open":"05:00","close":"18:00"},"wed":{"open":"05:00","close":"18:00"},"thu":{"open":"05:00","close":"18:00"},"fri":{"open":"05:00","close":"18:00"},"sat":{"open":"05:00","close":"18:00"},"sun":{"open":"05:00","close":"18:00"},"note":"朝枠は前日までの予約制"}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '15台', resUrl: 'https://example.com/kujukuri-sunrise/reserve', offUrl: 'https://example.com/kujukuri-sunrise', phone: null, pop: 0.63 },
  { id: 's12', slug: 'daigo-takisawa-sauna', name: '大子 滝沢サウナ', pref: '茨城県', area: '大子町', address: '茨城県久慈郡大子町（架空）', lat: 36.75, lng: 140.35, desc: '滝の下流の淵に入れるサウナ。水温が年間を通して低く、夏でも10℃台前半。', priceMin: 5000, priceMax: 7500, priceNote: null, capMin: 2, capMax: 6, tempMin: 90, tempMax: 102, hours: {"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":null,"thu":null,"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"18:00"},"sun":{"open":"09:00","close":"18:00"},"note":"冬季は短縮"}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '10台', resUrl: 'https://example.com/daigo-takisawa/reserve', offUrl: 'https://example.com/daigo-takisawa', phone: null, pop: 0.72 },
  { id: 's13', slug: 'kasumigaura-kohan-deck', name: '霞ヶ浦 湖畔デッキサウナ', pref: '茨城県', area: '土浦市', address: '茨城県土浦市（架空）', lat: 36.0333, lng: 140.4, desc: '湖に突き出したデッキで寝転べる。風が強い日はサウナ室の窓から湖面を眺めて過ごす。', priceMin: 3500, priceMax: 4800, priceNote: null, capMin: 1, capMax: 10, tempMin: 80, tempMax: 90, hours: null, closedNote: '不定休', dayTrip: true, lodging: false, parkingNote: '25台', resUrl: 'https://example.com/kasumigaura-deck/reserve', offUrl: 'https://example.com/kasumigaura-deck', phone: null, pop: 0.48 },
  { id: 's14', slug: 'kitaibaraki-iwaba-sauna', name: '北茨城 岩場サウナ', pref: '茨城県', area: '北茨城市', address: '茨城県北茨城市（架空）', lat: 36.8333, lng: 140.75, desc: '磯の岩場に組んだ小屋サウナ。潮だまりで冷やす独特の体験ができる。', priceMin: 4600, priceMax: 6800, priceNote: null, capMin: 2, capMax: 5, tempMin: 85, tempMax: 97, hours: {"mon":{"open":"10:00","close":"18:00"},"tue":null,"wed":{"open":"10:00","close":"18:00"},"thu":{"open":"10:00","close":"18:00"},"fri":{"open":"10:00","close":"18:00"},"sat":{"open":"10:00","close":"18:00"},"sun":{"open":"10:00","close":"18:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: null, resUrl: null, offUrl: 'https://example.com/kitaibaraki-iwaba', phone: null, pop: 0.44 },
  { id: 's15', slug: 'nasu-kogen-snow-sauna', name: '那須高原 スノーサウナ', pref: '栃木県', area: '那須町', address: '栃木県那須郡那須町（架空）', lat: 37.0, lng: 139.9667, desc: '冬は積雪にダイブできる高原のサウナ。夏は沢水の水風呂に切り替わる。', priceMin: 6800, priceMax: 9500, priceNote: null, capMin: 2, capMax: 8, tempMin: 90, tempMax: 105, hours: {"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"21:00"},"note":"積雪期は要4WDまたはチェーン"}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '15台（冬季は除雪状況により変動）', resUrl: 'https://example.com/nasu-snow/reserve', offUrl: 'https://example.com/nasu-snow', phone: null, pop: 0.85 },
  { id: 's16', slug: 'chuzenji-kohan-roten', name: '中禅寺 湖畔露天サウナ', pref: '栃木県', area: '日光市', address: '栃木県日光市（架空）', lat: 36.7333, lng: 139.4833, desc: '標高1200mの湖畔。湖水は真夏でも冷たく、飛び込みができる桟橋がある。', priceMin: 7500, priceMax: 12000, priceNote: null, capMin: 2, capMax: 10, tempMin: 85, tempMax: 98, hours: {"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":null,"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":"冬季（12〜3月）は休業"}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '18台', resUrl: 'https://example.com/chuzenji-roten/reserve', offUrl: 'https://example.com/chuzenji-roten', phone: null, pop: 0.88 },
  { id: 's17', slug: 'shiobara-yusen-sauna', name: '塩原 湯泉サウナ', pref: '栃木県', area: '那須塩原市', address: '栃木県那須塩原市（架空）', lat: 36.95, lng: 139.8, desc: '温泉旅館に併設されたサウナ。渓流沿いだが入水はできず、地下水の水風呂を使う。', priceMin: 3200, priceMax: 4500, priceNote: '日帰り入浴込み', capMin: 1, capMax: 12, tempMin: 78, tempMax: 88, hours: {"mon":{"open":"12:00","close":"21:00"},"tue":{"open":"12:00","close":"21:00"},"wed":{"open":"12:00","close":"21:00"},"thu":{"open":"12:00","close":"21:00"},"fri":{"open":"12:00","close":"21:00"},"sat":{"open":"12:00","close":"21:00"},"sun":{"open":"12:00","close":"21:00"},"note":null}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '30台', resUrl: null, offUrl: 'https://example.com/shiobara-yusen', phone: null, pop: 0.57 },
  { id: 's18', slug: 'minakami-gorge-dive', name: 'みなかみ 渓流ダイブサウナ', pref: '群馬県', area: 'みなかみ町', address: '群馬県利根郡みなかみ町（架空）', lat: 36.7833, lng: 138.9833, desc: '利根川上流の渓流に飛び込めるサウナ。冬は雪ダイブに切り替わる通年営業。', priceMin: 6000, priceMax: 9000, priceNote: null, capMin: 2, capMax: 8, tempMin: 90, tempMax: 105, hours: {"mon":{"open":"09:00","close":"20:00"},"tue":{"open":"09:00","close":"20:00"},"wed":{"open":"09:00","close":"20:00"},"thu":{"open":"09:00","close":"20:00"},"fri":{"open":"09:00","close":"20:00"},"sat":{"open":"09:00","close":"20:00"},"sun":{"open":"09:00","close":"20:00"},"note":null}, closedNote: null, dayTrip: true, lodging: true, parkingNote: '12台', resUrl: 'https://example.com/minakami-dive/reserve', offUrl: 'https://example.com/minakami-dive', phone: null, pop: 0.89 },
  { id: 's19', slug: 'tsumagoi-hoshizora-barrel', name: '嬬恋 星空バレル', pref: '群馬県', area: '嬬恋村', address: '群馬県吾妻郡嬬恋村（架空）', lat: 36.5333, lng: 138.5333, desc: '光害の少ない高原に置かれたバレルサウナ。夜枠は星空の下で外気浴ができる。', priceMin: 8500, priceMax: 14000, priceNote: '1棟あたり（最大5名）', capMin: 1, capMax: 5, tempMin: 88, tempMax: 100, hours: {"mon":{"open":"15:00","close":"23:00"},"tue":{"open":"15:00","close":"23:00"},"wed":{"open":"15:00","close":"23:00"},"thu":{"open":"15:00","close":"23:00"},"fri":{"open":"15:00","close":"23:00"},"sat":{"open":"15:00","close":"23:00"},"sun":{"open":"15:00","close":"23:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '5台', resUrl: 'https://example.com/tsumagoi-hoshizora/reserve', offUrl: 'https://example.com/tsumagoi-hoshizora', phone: null, pop: 0.71 },
  { id: 's20', slug: 'akagi-kohan-sauna', name: '赤城 湖畔サウナ', pref: '群馬県', area: '前橋市', address: '群馬県前橋市（架空）', lat: 36.55, lng: 139.1833, desc: 'カルデラ湖のほとりにある電気サウナ。設備が新しく、家族連れでも使いやすい。', priceMin: 2800, priceMax: 3900, priceNote: null, capMin: 1, capMax: 14, tempMin: 82, tempMax: 92, hours: {"mon":null,"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null}, closedNote: null, dayTrip: true, lodging: false, parkingNote: '40台', resUrl: 'https://example.com/akagi-kohan/reserve', offUrl: 'https://example.com/akagi-kohan', phone: null, pop: 0.52 },
];

// features per sauna
const FEATURES = {
  s01: [['sauna_type','tent'],['heat_source','wood'],['equipment','self_loyly'],['outdoor_bath','riverside'],['outdoor_bath','lie_down'],['privacy','time_private'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','food_ok'],['access','by_car'],['access','parking'],['access','unpaved_road']],
  s02: [['sauna_type','hut'],['heat_source','wood'],['equipment','self_loyly'],['equipment','window'],['outdoor_bath','forest'],['outdoor_bath','hammock'],['outdoor_bath','roofed'],['outdoor_bath','rain_ok'],['privacy','full_private'],['privacy','single_group_only'],['usage','nude_ok'],['usage','towel'],['access','by_car'],['access','parking'],['access','forest_road']],
  s21: [['sauna_type','tent'],['heat_source','gas'],['equipment','self_loyly'],['outdoor_bath','riverside'],['outdoor_bath','lie_down'],['privacy','shared_with_others'],['privacy','mixed_gender'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','children_ok'],['access','by_train'],['access','on_foot'],['access','by_car'],['access','parking']],
  s03: [['sauna_type','open_air'],['heat_source','gas'],['equipment','auto_loyly'],['equipment','scenic_view'],['equipment','window'],['outdoor_bath','panorama'],['outdoor_bath','infinity_chair'],['outdoor_bath','mountain'],['privacy','separated_gender'],['usage','nude_ok'],['usage','towel'],['usage','food_ok'],['usage','alcohol_ok'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking']],
  s04: [['sauna_type','barrel'],['heat_source','wood'],['equipment','self_loyly'],['equipment','window'],['outdoor_bath','seaside'],['outdoor_bath','reclining'],['privacy','time_private'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','photography_ok'],['access','by_car'],['access','by_train'],['access','parking']],
  s05: [['sauna_type','container'],['heat_source','electric'],['equipment','auto_loyly'],['equipment','window'],['outdoor_bath','lakeside'],['outdoor_bath','lie_down'],['privacy','mixed_gender'],['usage','swimwear_required'],['usage','children_ok'],['usage','food_ok'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking']],
  s06: [['sauna_type','tent'],['heat_source','wood'],['equipment','self_loyly'],['outdoor_bath','riverside'],['outdoor_bath','panorama'],['privacy','time_private'],['usage','swimwear_required'],['usage','food_ok'],['access','by_car'],['access','parking'],['access','unpaved_road'],['access','awd_recommended']],
  s07: [['sauna_type','tent'],['heat_source','wood'],['outdoor_bath','riverside'],['outdoor_bath','lie_down'],['privacy','shared_with_others'],['usage','swimwear_required'],['access','by_train'],['access','on_foot']],
  s08: [['sauna_type','hut'],['heat_source','electric'],['equipment','self_loyly'],['equipment','window'],['outdoor_bath','forest'],['outdoor_bath','hammock'],['outdoor_bath','roofed'],['outdoor_bath','rain_ok'],['privacy','time_private'],['usage','swimwear_required'],['usage','children_ok'],['usage','pets_ok'],['access','by_car'],['access','by_train'],['access','parking']],
  s09: [['sauna_type','barrel'],['heat_source','wood'],['equipment','self_loyly'],['equipment','scenic_view'],['outdoor_bath','seaside'],['outdoor_bath','panorama'],['outdoor_bath','infinity_chair'],['privacy','full_private'],['usage','swimwear_required'],['usage','alcohol_ok'],['usage','photography_ok'],['access','by_car'],['access','parking']],
  s10: [['sauna_type','hut'],['heat_source','electric'],['equipment','loyly'],['equipment','window'],['equipment','scenic_view'],['outdoor_bath','roofed'],['outdoor_bath','rain_ok'],['outdoor_bath','reclining'],['privacy','full_private'],['usage','nude_ok'],['usage','towel'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking']],
  s11: [['sauna_type','tent'],['heat_source','wood'],['equipment','self_loyly'],['outdoor_bath','seaside'],['outdoor_bath','reclining'],['outdoor_bath','panorama'],['privacy','shared_with_others'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','children_ok'],['access','by_car'],['access','parking']],
  s12: [['sauna_type','hut'],['heat_source','wood'],['equipment','self_loyly'],['equipment','window'],['outdoor_bath','riverside'],['outdoor_bath','forest'],['outdoor_bath','lie_down'],['privacy','time_private'],['usage','swimwear_required'],['usage','food_ok'],['access','by_car'],['access','parking'],['access','forest_road']],
  s13: [['sauna_type','container'],['heat_source','electric'],['equipment','auto_loyly'],['equipment','window'],['outdoor_bath','lakeside'],['outdoor_bath','lie_down'],['outdoor_bath','panorama'],['privacy','mixed_gender'],['usage','swimwear_required'],['usage','children_ok'],['usage','food_ok'],['access','by_car'],['access','parking']],
  s14: [['sauna_type','hut'],['heat_source','wood'],['equipment','self_loyly'],['outdoor_bath','seaside'],['outdoor_bath','panorama'],['privacy','single_group_only'],['privacy','full_private'],['usage','swimwear_required'],['usage','photography_ok'],['access','by_car'],['access','unpaved_road']],
  s15: [['sauna_type','hut'],['heat_source','wood'],['equipment','self_loyly'],['equipment','aufguss'],['equipment','window'],['outdoor_bath','forest'],['outdoor_bath','mountain'],['outdoor_bath','starry_sky'],['outdoor_bath','roofed'],['privacy','time_private'],['usage','swimwear_required'],['usage','towel'],['usage','food_ok'],['usage','alcohol_ok'],['access','by_car'],['access','parking'],['access','winter_access'],['access','awd_recommended']],
  s16: [['sauna_type','open_air'],['heat_source','wood'],['equipment','loyly'],['equipment','aufguss'],['equipment','scenic_view'],['outdoor_bath','lakeside'],['outdoor_bath','panorama'],['outdoor_bath','infinity_chair'],['outdoor_bath','mountain'],['privacy','separated_gender'],['usage','nude_ok'],['usage','towel'],['usage','food_ok'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking']],
  s17: [['sauna_type','hut'],['heat_source','gas'],['equipment','auto_loyly'],['equipment','window'],['outdoor_bath','riverside'],['outdoor_bath','roofed'],['outdoor_bath','rain_ok'],['outdoor_bath','reclining'],['privacy','separated_gender'],['usage','nude_ok'],['usage','towel'],['usage','children_ok'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking']],
  s18: [['sauna_type','tent'],['heat_source','wood'],['equipment','self_loyly'],['equipment','aufguss'],['outdoor_bath','riverside'],['outdoor_bath','mountain'],['outdoor_bath','starry_sky'],['privacy','time_private'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','food_ok'],['access','by_car'],['access','by_train'],['access','shuttle'],['access','parking'],['access','winter_access']],
  s19: [['sauna_type','barrel'],['heat_source','wood'],['equipment','self_loyly'],['equipment','window'],['outdoor_bath','starry_sky'],['outdoor_bath','mountain'],['outdoor_bath','reclining'],['outdoor_bath','infinity_chair'],['privacy','full_private'],['privacy','single_group_only'],['usage','nude_ok'],['usage','alcohol_ok'],['usage','pets_ok'],['access','by_car'],['access','parking'],['access','winter_access'],['access','awd_recommended']],
  s20: [['sauna_type','container'],['heat_source','electric'],['equipment','auto_loyly'],['equipment','window'],['outdoor_bath','lakeside'],['outdoor_bath','roofed'],['outdoor_bath','rain_ok'],['outdoor_bath','lie_down'],['privacy','separated_gender'],['usage','swimwear_required'],['usage','swimwear_rental'],['usage','children_ok'],['usage','food_ok'],['access','by_car'],['access','shuttle'],['access','parking']],
};

// environments per sauna
const ENVIRONMENTS = {
  s01: [['river','on_site'],['forest','nearby'],['mountain','view_only']],
  s02: [['forest','on_site'],['river','nearby'],['mountain','view_only']],
  s21: [['river','on_site']],
  s03: [['mountain','on_site'],['panorama','on_site'],['forest','nearby']],
  s04: [['sea','on_site'],['panorama','on_site']],
  s05: [['lake','on_site'],['mountain','view_only'],['forest','nearby']],
  s06: [['gorge','on_site'],['river','on_site'],['forest','nearby']],
  s07: [['river','on_site'],['gorge','view_only']],
  s08: [['forest','on_site'],['river','nearby'],['mountain','view_only']],
  s09: [['sea','on_site'],['panorama','on_site']],
  s10: [['gorge','on_site'],['river','view_only'],['forest','on_site']],
  s11: [['sea','on_site'],['panorama','on_site']],
  s12: [['gorge','on_site'],['river','on_site'],['forest','on_site']],
  s13: [['lake','on_site'],['panorama','on_site']],
  s14: [['sea','on_site'],['panorama','on_site']],
  s15: [['mountain','on_site'],['forest','on_site'],['panorama','view_only']],
  s16: [['lake','on_site'],['mountain','on_site'],['panorama','on_site']],
  s17: [['river','on_site'],['gorge','nearby'],['forest','on_site']],
  s18: [['river','on_site'],['gorge','on_site'],['mountain','on_site']],
  s19: [['mountain','on_site'],['forest','on_site'],['panorama','view_only']],
  s20: [['lake','on_site'],['mountain','view_only'],['forest','nearby']],
};

// cooldowns per sauna
const COOLDOWNS = {
  s01: [{key:'river',tempMin:12,tempMax:19,depthCm:140,canDive:true,isNatural:true,hasFlow:true,note:null},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s02: [{key:'spring_water',tempMin:11,tempMax:15,depthCm:90,canDive:false,isNatural:true,hasFlow:true,note:'沢水を樽に引き込んでいる'},{key:'barrel',tempMin:null,tempMax:null,depthCm:90,canDive:false,isNatural:true,hasFlow:false,note:null}],
  s21: [{key:'river',tempMin:15,tempMax:24,depthCm:50,canDive:false,isNatural:true,hasFlow:true,note:'浅瀬のため飛び込みは不可'},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s03: [{key:'cold_bath',tempMin:15,tempMax:17,depthCm:110,canDive:false,isNatural:false,hasFlow:false,note:null},{key:'ground_water',tempMin:14,tempMax:16,depthCm:100,canDive:false,isNatural:true,hasFlow:true,note:null}],
  s04: [{key:'sea',tempMin:14,tempMax:26,depthCm:null,canDive:false,isNatural:true,hasFlow:true,note:'遊泳区域内のみ'},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s05: [{key:'lake',tempMin:13,tempMax:24,depthCm:200,canDive:true,isNatural:true,hasFlow:false,note:null},{key:'cold_bath',tempMin:16,tempMax:18,depthCm:100,canDive:false,isNatural:false,hasFlow:false,note:null}],
  s06: [{key:'river',tempMin:10,tempMax:18,depthCm:180,canDive:true,isNatural:true,hasFlow:true,note:null}],
  s07: [{key:'river',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:true,hasFlow:true,note:'水温は未計測'}],
  s08: [{key:'cold_bath',tempMin:15,tempMax:17,depthCm:90,canDive:false,isNatural:false,hasFlow:false,note:null},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s09: [{key:'sea',tempMin:15,tempMax:27,depthCm:null,canDive:false,isNatural:true,hasFlow:true,note:null},{key:'barrel',tempMin:16,tempMax:19,depthCm:90,canDive:false,isNatural:false,hasFlow:false,note:null}],
  s10: [{key:'ground_water',tempMin:16,tempMax:18,depthCm:100,canDive:false,isNatural:true,hasFlow:true,note:null}],
  s11: [{key:'sea',tempMin:14,tempMax:26,depthCm:null,canDive:false,isNatural:true,hasFlow:true,note:null},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s12: [{key:'river',tempMin:9,tempMax:14,depthCm:150,canDive:true,isNatural:true,hasFlow:true,note:null},{key:'spring_water',tempMin:10,tempMax:12,depthCm:80,canDive:false,isNatural:true,hasFlow:true,note:null}],
  s13: [{key:'cold_bath',tempMin:17,tempMax:20,depthCm:80,canDive:false,isNatural:false,hasFlow:false,note:null}],
  s14: [{key:'sea',tempMin:null,tempMax:null,depthCm:null,canDive:false,isNatural:true,hasFlow:true,note:'潮位により入水可否が変わる'}],
  s15: [{key:'snow',tempMin:null,tempMax:null,depthCm:null,canDive:true,isNatural:true,hasFlow:false,note:'積雪期のみ'},{key:'spring_water',tempMin:11,tempMax:15,depthCm:100,canDive:false,isNatural:true,hasFlow:true,note:null}],
  s16: [{key:'lake',tempMin:8,tempMax:18,depthCm:250,canDive:true,isNatural:true,hasFlow:false,note:null},{key:'cold_bath',tempMin:14,tempMax:16,depthCm:110,canDive:false,isNatural:true,hasFlow:false,note:null}],
  s17: [{key:'ground_water',tempMin:15,tempMax:17,depthCm:95,canDive:false,isNatural:true,hasFlow:true,note:null},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
  s18: [{key:'river',tempMin:7,tempMax:15,depthCm:200,canDive:true,isNatural:true,hasFlow:true,note:null},{key:'snow',tempMin:null,tempMax:null,depthCm:null,canDive:true,isNatural:true,hasFlow:false,note:'1〜3月'}],
  s19: [{key:'barrel',tempMin:12,tempMax:16,depthCm:90,canDive:false,isNatural:true,hasFlow:false,note:null},{key:'snow',tempMin:null,tempMax:null,depthCm:null,canDive:true,isNatural:true,hasFlow:false,note:'12〜4月'}],
  s20: [{key:'lake',tempMin:10,tempMax:22,depthCm:160,canDive:false,isNatural:true,hasFlow:false,note:'指定区域のみ'},{key:'cold_bath',tempMin:16,tempMax:18,depthCm:90,canDive:false,isNatural:false,hasFlow:false,note:null},{key:'shower',tempMin:null,tempMax:null,depthCm:null,canDive:null,isNatural:false,hasFlow:null,note:null}],
};

// experiences per sauna
const EXPERIENCES = {
  s01: [['experience','river_dive'],['experience','self_loyly'],['experience','wood_firing']],
  s02: [['experience','self_loyly'],['experience','wood_firing'],['experience','bonfire']],
  s21: [['experience','self_loyly']],
  s03: [['experience','sunset'],['experience','morning_sauna'],['experience','starry_outdoor_bath']],
  s04: [['experience','sea_swim'],['experience','sunset'],['experience','wood_firing']],
  s05: [['experience','lake_dive'],['experience','sunset']],
  s06: [['experience','river_dive'],['experience','wood_firing'],['experience','bonfire']],
  s07: [['experience','wood_firing']],
  s08: [['experience','self_loyly'],['experience','bonfire']],
  s09: [['experience','sunset'],['experience','sea_swim'],['experience','starry_outdoor_bath']],
  s10: [['experience','morning_sauna']],
  s11: [['experience','sunrise'],['experience','morning_sauna'],['experience','sea_swim']],
  s12: [['experience','river_dive'],['experience','wood_firing'],['experience','self_loyly']],
  s13: [['experience','sunset']],
  s14: [['experience','sea_swim'],['experience','sunrise'],['experience','wood_firing']],
  s15: [['experience','snow_dive'],['experience','starry_outdoor_bath'],['experience','wood_firing'],['experience','bonfire']],
  s16: [['experience','lake_dive'],['experience','sunrise'],['experience','morning_sauna']],
  s17: [['experience','morning_sauna']],
  s18: [['experience','river_dive'],['experience','snow_dive'],['experience','wood_firing'],['experience','starry_outdoor_bath']],
  s19: [['experience','starry_outdoor_bath'],['experience','snow_dive'],['experience','bonfire'],['experience','self_loyly']],
  s20: [['experience','lake_dive'],['experience','sunset']],
};

// restaurants
const RESTAURANTS = [
  {id:'r01',name:'奥多摩 山女魚食堂',genre:'定食',priceMin:1200,priceMax:2200,hours:{"mon":{"open":"11:00","close":"15:00"},"tue":null,"wed":{"open":"11:00","close":"15:00"},"thu":{"open":"11:00","close":"15:00"},"fri":{"open":"11:00","close":"15:00"},"sat":{"open":"11:00","close":"15:00"},"sun":{"open":"11:00","close":"15:00"},"note":null},address:'東京都西多摩郡奥多摩町（架空）',url:'https://example.com/yamame'},
  {id:'r02',name:'檜原 蕎麦処 山の井',genre:'蕎麦',priceMin:1000,priceMax:1800,hours:{"mon":{"open":"11:00","close":"16:00"},"tue":{"open":"11:00","close":"16:00"},"wed":null,"thu":null,"fri":{"open":"11:00","close":"16:00"},"sat":{"open":"11:00","close":"16:00"},"sun":{"open":"11:00","close":"16:00"},"note":null},address:'東京都西多摩郡檜原村（架空）',url:null},
  {id:'r03',name:'稲城 river burger',genre:'ハンバーガー',priceMin:1100,priceMax:1900,hours:{"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null},address:'東京都稲城市（架空）',url:'https://example.com/river-burger'},
  {id:'r04',name:'箱根 豆腐料理 白雲',genre:'和食',priceMin:2400,priceMax:4800,hours:{"mon":{"open":"11:30","close":"21:00"},"tue":{"open":"11:30","close":"21:00"},"wed":{"open":"11:30","close":"21:00"},"thu":{"open":"11:30","close":"21:00"},"fri":{"open":"11:30","close":"21:00"},"sat":{"open":"11:30","close":"21:00"},"sun":{"open":"11:30","close":"21:00"},"note":null},address:'神奈川県足柄下郡箱根町（架空）',url:'https://example.com/hakuun'},
  {id:'r05',name:'三浦 まぐろ丼 岬',genre:'海鮮',priceMin:1600,priceMax:3200,hours:{"mon":{"open":"10:30","close":"19:00"},"tue":{"open":"10:30","close":"19:00"},"wed":null,"thu":{"open":"10:30","close":"19:00"},"fri":{"open":"10:30","close":"19:00"},"sat":{"open":"10:30","close":"19:00"},"sun":{"open":"10:30","close":"19:00"},"note":null},address:'神奈川県三浦市（架空）',url:'https://example.com/misaki-don'},
  {id:'r06',name:'相模湖 湖畔カフェ nagi',genre:'カフェ',priceMin:900,priceMax:1800,hours:{"mon":{"open":"09:00","close":"18:00"},"tue":{"open":"09:00","close":"18:00"},"wed":{"open":"09:00","close":"18:00"},"thu":{"open":"09:00","close":"18:00"},"fri":{"open":"09:00","close":"18:00"},"sat":{"open":"09:00","close":"18:00"},"sun":{"open":"09:00","close":"18:00"},"note":null},address:'神奈川県相模原市緑区（架空）',url:null},
  {id:'r07',name:'秩父 わらじ亭',genre:'定食',priceMin:1300,priceMax:2400,hours:{"mon":{"open":"11:00","close":"18:00"},"tue":{"open":"11:00","close":"18:00"},"wed":{"open":"11:00","close":"18:00"},"thu":null,"fri":{"open":"11:00","close":"18:00"},"sat":{"open":"11:00","close":"18:00"},"sun":{"open":"11:00","close":"18:00"},"note":null},address:'埼玉県秩父市（架空）',url:'https://example.com/waraji'},
  {id:'r08',name:'長瀞 かき氷 天然氷店',genre:'スイーツ',priceMin:700,priceMax:1400,hours:null,address:'埼玉県秩父郡長瀞町（架空）',url:null},
  {id:'r09',name:'飯能 森のパン工房',genre:'ベーカリー',priceMin:600,priceMax:1600,hours:{"mon":null,"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'埼玉県飯能市（架空）',url:'https://example.com/mori-pan'},
  {id:'r10',name:'南房総 漁協食堂 汐風',genre:'海鮮',priceMin:1500,priceMax:3000,hours:{"mon":{"open":"11:00","close":"15:00"},"tue":null,"wed":{"open":"11:00","close":"15:00"},"thu":{"open":"11:00","close":"15:00"},"fri":{"open":"11:00","close":"15:00"},"sat":{"open":"11:00","close":"15:00"},"sun":{"open":"11:00","close":"15:00"},"note":null},address:'千葉県南房総市（架空）',url:'https://example.com/shiokaze'},
  {id:'r11',name:'養老渓谷 猪鍋 山彦',genre:'鍋',priceMin:2200,priceMax:4200,hours:{"mon":null,"tue":{"open":"11:30","close":"20:00"},"wed":{"open":"11:30","close":"20:00"},"thu":{"open":"11:30","close":"20:00"},"fri":{"open":"11:30","close":"20:00"},"sat":{"open":"11:30","close":"20:00"},"sun":{"open":"11:30","close":"20:00"},"note":null},address:'千葉県夷隅郡大多喜町（架空）',url:null},
  {id:'r12',name:'九十九里 蛤焼 浜小屋',genre:'海鮮',priceMin:1400,priceMax:2800,hours:{"mon":{"open":"10:00","close":"17:00"},"tue":{"open":"10:00","close":"17:00"},"wed":{"open":"10:00","close":"17:00"},"thu":{"open":"10:00","close":"17:00"},"fri":{"open":"10:00","close":"17:00"},"sat":{"open":"10:00","close":"17:00"},"sun":{"open":"10:00","close":"17:00"},"note":null},address:'千葉県山武市（架空）',url:'https://example.com/hamagoya'},
  {id:'r13',name:'大子 奥久慈しゃも処',genre:'鶏料理',priceMin:1800,priceMax:3400,hours:{"mon":{"open":"11:00","close":"19:00"},"tue":{"open":"11:00","close":"19:00"},"wed":null,"thu":{"open":"11:00","close":"19:00"},"fri":{"open":"11:00","close":"19:00"},"sat":{"open":"11:00","close":"19:00"},"sun":{"open":"11:00","close":"19:00"},"note":null},address:'茨城県久慈郡大子町（架空）',url:'https://example.com/shamo'},
  {id:'r14',name:'土浦 れんこん食堂',genre:'定食',priceMin:1000,priceMax:2000,hours:{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"11:00","close":"21:00"},"sun":{"open":"11:00","close":"21:00"},"note":null},address:'茨城県土浦市（架空）',url:null},
  {id:'r15',name:'北茨城 磯料理 波音',genre:'海鮮',priceMin:1700,priceMax:3600,hours:{"mon":{"open":"11:00","close":"20:00"},"tue":null,"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null},address:'茨城県北茨城市（架空）',url:null},
  {id:'r16',name:'那須 高原チーズ工房',genre:'カフェ',priceMin:1200,priceMax:2600,hours:{"mon":{"open":"10:00","close":"17:00"},"tue":{"open":"10:00","close":"17:00"},"wed":{"open":"10:00","close":"17:00"},"thu":{"open":"10:00","close":"17:00"},"fri":{"open":"10:00","close":"17:00"},"sat":{"open":"10:00","close":"17:00"},"sun":{"open":"10:00","close":"17:00"},"note":null},address:'栃木県那須郡那須町（架空）',url:'https://example.com/nasu-cheese'},
  {id:'r17',name:'日光 湯波御膳 松風',genre:'和食',priceMin:2000,priceMax:4000,hours:{"mon":{"open":"11:00","close":"19:00"},"tue":{"open":"11:00","close":"19:00"},"wed":{"open":"11:00","close":"19:00"},"thu":null,"fri":{"open":"11:00","close":"19:00"},"sat":{"open":"11:00","close":"19:00"},"sun":{"open":"11:00","close":"19:00"},"note":null},address:'栃木県日光市（架空）',url:'https://example.com/matsukaze'},
  {id:'r18',name:'塩原 手打ちうどん 渓',genre:'うどん',priceMin:900,priceMax:1700,hours:{"mon":{"open":"11:00","close":"18:00"},"tue":{"open":"11:00","close":"18:00"},"wed":{"open":"11:00","close":"18:00"},"thu":{"open":"11:00","close":"18:00"},"fri":{"open":"11:00","close":"18:00"},"sat":{"open":"11:00","close":"18:00"},"sun":{"open":"11:00","close":"18:00"},"note":null},address:'栃木県那須塩原市（架空）',url:null},
  {id:'r19',name:'みなかみ 山賊焼 谷川',genre:'定食',priceMin:1400,priceMax:2600,hours:{"mon":{"open":"11:00","close":"21:00"},"tue":{"open":"11:00","close":"21:00"},"wed":{"open":"11:00","close":"21:00"},"thu":{"open":"11:00","close":"21:00"},"fri":{"open":"11:00","close":"21:00"},"sat":{"open":"11:00","close":"21:00"},"sun":{"open":"11:00","close":"21:00"},"note":null},address:'群馬県利根郡みなかみ町（架空）',url:'https://example.com/tanigawa'},
  {id:'r20',name:'嬬恋 キャベツ食堂',genre:'洋食',priceMin:1300,priceMax:2400,hours:{"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":null,"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null},address:'群馬県吾妻郡嬬恋村（架空）',url:null},
  {id:'r21',name:'赤城 うどん処 まる井',genre:'うどん',priceMin:800,priceMax:1600,hours:{"mon":null,"tue":{"open":"11:00","close":"19:00"},"wed":{"open":"11:00","close":"19:00"},"thu":{"open":"11:00","close":"19:00"},"fri":{"open":"11:00","close":"19:00"},"sat":{"open":"11:00","close":"19:00"},"sun":{"open":"11:00","close":"19:00"},"note":null},address:'群馬県前橋市（架空）',url:null},
];

const SPOTS = [
  {id:'p01',name:'奥多摩湖 展望デッキ',cat:'sightseeing',desc:'ダム湖を見下ろす展望台',priceMin:0,hours:{"mon":{"open":"08:00","close":"17:00"},"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'東京都西多摩郡奥多摩町（架空）',url:null},
  {id:'p02',name:'奥多摩 日帰り温泉 river spa',cat:'onsen',desc:'露天から渓谷を眺める日帰り温泉',priceMin:900,hours:{"mon":{"open":"10:00","close":"20:00"},"tue":null,"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null},address:'東京都西多摩郡奥多摩町（架空）',url:'https://example.com/river-spa'},
  {id:'p03',name:'多摩川 カヤック体験',cat:'activity',desc:'初心者向けの2時間コース',priceMin:5500,hours:{"mon":{"open":"09:00","close":"16:00"},"tue":{"open":"09:00","close":"16:00"},"wed":{"open":"09:00","close":"16:00"},"thu":{"open":"09:00","close":"16:00"},"fri":{"open":"09:00","close":"16:00"},"sat":{"open":"09:00","close":"16:00"},"sun":{"open":"09:00","close":"16:00"},"note":null},address:'東京都稲城市（架空）',url:'https://example.com/tama-kayak'},
  {id:'p04',name:'箱根 芦ノ湖遊覧',cat:'sightseeing',desc:'湖を一周する遊覧船',priceMin:1200,hours:{"mon":{"open":"09:30","close":"17:00"},"tue":{"open":"09:30","close":"17:00"},"wed":{"open":"09:30","close":"17:00"},"thu":{"open":"09:30","close":"17:00"},"fri":{"open":"09:30","close":"17:00"},"sat":{"open":"09:30","close":"17:00"},"sun":{"open":"09:30","close":"17:00"},"note":null},address:'神奈川県足柄下郡箱根町（架空）',url:'https://example.com/ashinoko'},
  {id:'p05',name:'箱根 大湯温泉',cat:'onsen',desc:'硫黄泉の日帰り湯',priceMin:1400,hours:{"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"21:00"},"note":null},address:'神奈川県足柄下郡箱根町（架空）',url:null},
  {id:'p06',name:'三浦 城ヶ崎ダイビング',cat:'activity',desc:'体験ダイビング',priceMin:12000,hours:{"mon":{"open":"08:00","close":"16:00"},"tue":{"open":"08:00","close":"16:00"},"wed":null,"thu":{"open":"08:00","close":"16:00"},"fri":{"open":"08:00","close":"16:00"},"sat":{"open":"08:00","close":"16:00"},"sun":{"open":"08:00","close":"16:00"},"note":null},address:'神奈川県三浦市（架空）',url:null},
  {id:'p07',name:'相模湖 ボート',cat:'activity',desc:'手漕ぎ・足漕ぎボート',priceMin:1000,hours:{"mon":{"open":"09:00","close":"17:00"},"tue":{"open":"09:00","close":"17:00"},"wed":{"open":"09:00","close":"17:00"},"thu":{"open":"09:00","close":"17:00"},"fri":{"open":"09:00","close":"17:00"},"sat":{"open":"09:00","close":"17:00"},"sun":{"open":"09:00","close":"17:00"},"note":null},address:'神奈川県相模原市緑区（架空）',url:null},
  {id:'p08',name:'秩父 三峯神社',cat:'sightseeing',desc:'標高1100mの山岳信仰の社',priceMin:0,hours:{"mon":{"open":"09:00","close":"16:00"},"tue":{"open":"09:00","close":"16:00"},"wed":{"open":"09:00","close":"16:00"},"thu":{"open":"09:00","close":"16:00"},"fri":{"open":"09:00","close":"16:00"},"sat":{"open":"09:00","close":"16:00"},"sun":{"open":"09:00","close":"16:00"},"note":null},address:'埼玉県秩父市（架空）',url:null},
  {id:'p09',name:'長瀞 ライン下り',cat:'activity',desc:'岩畳の渓谷を舟で下る',priceMin:2000,hours:{"mon":{"open":"09:00","close":"16:00"},"tue":{"open":"09:00","close":"16:00"},"wed":{"open":"09:00","close":"16:00"},"thu":{"open":"09:00","close":"16:00"},"fri":{"open":"09:00","close":"16:00"},"sat":{"open":"09:00","close":"16:00"},"sun":{"open":"09:00","close":"16:00"},"note":null},address:'埼玉県秩父郡長瀞町（架空）',url:'https://example.com/nagatoro-line'},
  {id:'p10',name:'秩父 武甲温泉',cat:'onsen',desc:'露天付きの日帰り温泉',priceMin:800,hours:{"mon":{"open":"10:00","close":"21:00"},"tue":{"open":"10:00","close":"21:00"},"wed":{"open":"10:00","close":"21:00"},"thu":{"open":"10:00","close":"21:00"},"fri":{"open":"10:00","close":"21:00"},"sat":{"open":"10:00","close":"21:00"},"sun":{"open":"10:00","close":"21:00"},"note":null},address:'埼玉県秩父市（架空）',url:null},
  {id:'p11',name:'飯能 天覧山ハイク',cat:'activity',desc:'往復1時間の低山ハイク',priceMin:0,hours:null,address:'埼玉県飯能市（架空）',url:null},
  {id:'p12',name:'南房総 野島埼灯台',cat:'sightseeing',desc:'房総最南端の灯台',priceMin:300,hours:{"mon":{"open":"08:30","close":"16:00"},"tue":{"open":"08:30","close":"16:00"},"wed":{"open":"08:30","close":"16:00"},"thu":{"open":"08:30","close":"16:00"},"fri":{"open":"08:30","close":"16:00"},"sat":{"open":"08:30","close":"16:00"},"sun":{"open":"08:30","close":"16:00"},"note":null},address:'千葉県南房総市（架空）',url:null},
  {id:'p13',name:'南房総 岩風呂の湯',cat:'onsen',desc:'海を見ながら入る日帰り湯',priceMin:1100,hours:{"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null},address:'千葉県南房総市（架空）',url:null},
  {id:'p14',name:'養老渓谷 粟又の滝遊歩道',cat:'sightseeing',desc:'滝沿いの遊歩道',priceMin:0,hours:{"mon":{"open":"07:00","close":"17:00"},"tue":{"open":"07:00","close":"17:00"},"wed":{"open":"07:00","close":"17:00"},"thu":{"open":"07:00","close":"17:00"},"fri":{"open":"07:00","close":"17:00"},"sat":{"open":"07:00","close":"17:00"},"sun":{"open":"07:00","close":"17:00"},"note":null},address:'千葉県夷隅郡大多喜町（架空）',url:null},
  {id:'p15',name:'九十九里 サーフィン体験',cat:'activity',desc:'初心者スクール',priceMin:7000,hours:{"mon":{"open":"08:00","close":"17:00"},"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'千葉県山武市（架空）',url:null},
  {id:'p16',name:'大子 袋田の滝',cat:'sightseeing',desc:'四段に落ちる大滝',priceMin:300,hours:{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"18:00"},"sat":{"open":"08:00","close":"18:00"},"sun":{"open":"08:00","close":"18:00"},"note":null},address:'茨城県久慈郡大子町（架空）',url:null},
  {id:'p17',name:'大子 森林の湯',cat:'onsen',desc:'山間の日帰り温泉',priceMin:700,hours:{"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":null,"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null},address:'茨城県久慈郡大子町（架空）',url:null},
  {id:'p18',name:'霞ヶ浦 サイクリングロード',cat:'activity',desc:'湖岸を走る自転車道',priceMin:0,hours:null,address:'茨城県土浦市（架空）',url:null},
  {id:'p19',name:'北茨城 五浦海岸',cat:'sightseeing',desc:'断崖と入江の景勝地',priceMin:0,hours:{"mon":{"open":"08:00","close":"17:00"},"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'茨城県北茨城市（架空）',url:null},
  {id:'p20',name:'那須 ロープウェイ',cat:'activity',desc:'茶臼岳の山頂駅へ',priceMin:1800,hours:{"mon":{"open":"08:30","close":"16:30"},"tue":{"open":"08:30","close":"16:30"},"wed":{"open":"08:30","close":"16:30"},"thu":{"open":"08:30","close":"16:30"},"fri":{"open":"08:30","close":"16:30"},"sat":{"open":"08:30","close":"16:30"},"sun":{"open":"08:30","close":"16:30"},"note":null},address:'栃木県那須郡那須町（架空）',url:null},
  {id:'p21',name:'那須 鹿の湯',cat:'onsen',desc:'硫黄泉の共同浴場',priceMin:600,hours:{"mon":{"open":"08:00","close":"18:00"},"tue":{"open":"08:00","close":"18:00"},"wed":{"open":"08:00","close":"18:00"},"thu":{"open":"08:00","close":"18:00"},"fri":{"open":"08:00","close":"18:00"},"sat":{"open":"08:00","close":"18:00"},"sun":{"open":"08:00","close":"18:00"},"note":null},address:'栃木県那須郡那須町（架空）',url:null},
  {id:'p22',name:'日光 華厳ノ滝',cat:'sightseeing',desc:'落差97mの滝',priceMin:600,hours:{"mon":{"open":"08:00","close":"17:00"},"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'栃木県日光市（架空）',url:null},
  {id:'p23',name:'奥日光 湯元温泉',cat:'onsen',desc:'白濁の硫黄泉',priceMin:800,hours:{"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null},address:'栃木県日光市（架空）',url:null},
  {id:'p24',name:'塩原 もみじ吊橋',cat:'sightseeing',desc:'渓谷に架かる吊橋',priceMin:0,hours:{"mon":{"open":"08:00","close":"17:00"},"tue":{"open":"08:00","close":"17:00"},"wed":{"open":"08:00","close":"17:00"},"thu":{"open":"08:00","close":"17:00"},"fri":{"open":"08:00","close":"17:00"},"sat":{"open":"08:00","close":"17:00"},"sun":{"open":"08:00","close":"17:00"},"note":null},address:'栃木県那須塩原市（架空）',url:null},
  {id:'p25',name:'みなかみ ラフティング',cat:'activity',desc:'利根川の激流を下る',priceMin:8000,hours:{"mon":{"open":"08:00","close":"16:00"},"tue":{"open":"08:00","close":"16:00"},"wed":{"open":"08:00","close":"16:00"},"thu":{"open":"08:00","close":"16:00"},"fri":{"open":"08:00","close":"16:00"},"sat":{"open":"08:00","close":"16:00"},"sun":{"open":"08:00","close":"16:00"},"note":null},address:'群馬県利根郡みなかみ町（架空）',url:'https://example.com/minakami-raft'},
  {id:'p26',name:'みなかみ 谷川の湯',cat:'onsen',desc:'渓流沿いの日帰り湯',priceMin:900,hours:{"mon":{"open":"11:00","close":"20:00"},"tue":{"open":"11:00","close":"20:00"},"wed":{"open":"11:00","close":"20:00"},"thu":{"open":"11:00","close":"20:00"},"fri":{"open":"11:00","close":"20:00"},"sat":{"open":"11:00","close":"20:00"},"sun":{"open":"11:00","close":"20:00"},"note":null},address:'群馬県利根郡みなかみ町（架空）',url:null},
  {id:'p27',name:'嬬恋 天空の展望台',cat:'sightseeing',desc:'キャベツ畑と山並みを望む',priceMin:0,hours:null,address:'群馬県吾妻郡嬬恋村（架空）',url:null},
  {id:'p28',name:'嬬恋 湯尻川温泉',cat:'onsen',desc:'源泉かけ流しの小さな湯',priceMin:600,hours:{"mon":{"open":"12:00","close":"20:00"},"tue":{"open":"12:00","close":"20:00"},"wed":{"open":"12:00","close":"20:00"},"thu":null,"fri":{"open":"12:00","close":"20:00"},"sat":{"open":"12:00","close":"20:00"},"sun":{"open":"12:00","close":"20:00"},"note":null},address:'群馬県吾妻郡嬬恋村（架空）',url:null},
  {id:'p29',name:'赤城 大沼カヌー',cat:'activity',desc:'カルデラ湖でのカヌー体験',priceMin:4500,hours:{"mon":{"open":"09:00","close":"16:00"},"tue":{"open":"09:00","close":"16:00"},"wed":{"open":"09:00","close":"16:00"},"thu":{"open":"09:00","close":"16:00"},"fri":{"open":"09:00","close":"16:00"},"sat":{"open":"09:00","close":"16:00"},"sun":{"open":"09:00","close":"16:00"},"note":null},address:'群馬県前橋市（架空）',url:null},
  {id:'p30',name:'赤城 白樺の湯',cat:'onsen',desc:'山腹の日帰り温泉',priceMin:700,hours:{"mon":{"open":"10:00","close":"20:00"},"tue":{"open":"10:00","close":"20:00"},"wed":{"open":"10:00","close":"20:00"},"thu":{"open":"10:00","close":"20:00"},"fri":{"open":"10:00","close":"20:00"},"sat":{"open":"10:00","close":"20:00"},"sun":{"open":"10:00","close":"20:00"},"note":null},address:'群馬県前橋市（架空）',url:null},
];

const HOTELS = [
  {id:'h01',name:'奥多摩 渓流の宿',type:'ryokan',priceMin:14000,priceMax:24000,address:'東京都西多摩郡奥多摩町（架空）',url:'https://example.com/keiryu-yado',resUrl:'https://example.com/keiryu-yado/reserve'},
  {id:'h02',name:'檜原 グランピング森音',type:'glamping',priceMin:22000,priceMax:38000,address:'東京都西多摩郡檜原村（架空）',url:'https://example.com/morine',resUrl:'https://example.com/morine/reserve'},
  {id:'h03',name:'箱根 山景ホテル',type:'hotel',priceMin:26000,priceMax:52000,address:'神奈川県足柄下郡箱根町（架空）',url:'https://example.com/sankei',resUrl:'https://example.com/sankei/reserve'},
  {id:'h04',name:'三浦 海辺のゲストハウス',type:'guesthouse',priceMin:6500,priceMax:11000,address:'神奈川県三浦市（架空）',url:null,resUrl:null},
  {id:'h05',name:'相模湖 キャンプ場 みずべ',type:'campsite',priceMin:3500,priceMax:6000,address:'神奈川県相模原市緑区（架空）',url:null,resUrl:'https://example.com/mizube/reserve'},
  {id:'h06',name:'秩父 山懐の宿',type:'ryokan',priceMin:15000,priceMax:27000,address:'埼玉県秩父市（架空）',url:'https://example.com/yamafutokoro',resUrl:'https://example.com/yamafutokoro/reserve'},
  {id:'h07',name:'長瀞 川沿いロッジ',type:'guesthouse',priceMin:7000,priceMax:12000,address:'埼玉県秩父郡長瀞町（架空）',url:null,resUrl:null},
  {id:'h08',name:'南房総 岬のオーベルジュ',type:'hotel',priceMin:24000,priceMax:42000,address:'千葉県南房総市（架空）',url:'https://example.com/misaki-auberge',resUrl:'https://example.com/misaki-auberge/reserve'},
  {id:'h09',name:'養老渓谷 離れの宿 山彦',type:'ryokan',priceMin:19000,priceMax:34000,address:'千葉県夷隅郡大多喜町（架空）',url:'https://example.com/yamabiko-yado',resUrl:'https://example.com/yamabiko-yado/reserve'},
  {id:'h10',name:'九十九里 浜のホステル',type:'guesthouse',priceMin:5500,priceMax:9500,address:'千葉県山武市（架空）',url:null,resUrl:null},
  {id:'h11',name:'大子 山あいの一軒宿',type:'ryokan',priceMin:13000,priceMax:22000,address:'茨城県久慈郡大子町（架空）',url:null,resUrl:'https://example.com/yamaai/reserve'},
  {id:'h12',name:'霞ヶ浦 レイクサイドホテル',type:'hotel',priceMin:11000,priceMax:19000,address:'茨城県土浦市（架空）',url:'https://example.com/lakeside',resUrl:'https://example.com/lakeside/reserve'},
  {id:'h13',name:'那須 高原のコテージ',type:'glamping',priceMin:20000,priceMax:36000,address:'栃木県那須郡那須町（架空）',url:'https://example.com/nasu-cottage',resUrl:'https://example.com/nasu-cottage/reserve'},
  {id:'h14',name:'中禅寺 湖畔の宿',type:'ryokan',priceMin:23000,priceMax:45000,address:'栃木県日光市（架空）',url:'https://example.com/kohan-yado',resUrl:'https://example.com/kohan-yado/reserve'},
  {id:'h15',name:'塩原 湯泉旅館',type:'ryokan',priceMin:16000,priceMax:28000,address:'栃木県那須塩原市（架空）',url:'https://example.com/yusen-ryokan',resUrl:null},
  {id:'h16',name:'みなかみ 谷川ロッジ',type:'guesthouse',priceMin:8000,priceMax:14000,address:'群馬県利根郡みなかみ町（架空）',url:'https://example.com/tanigawa-lodge',resUrl:'https://example.com/tanigawa-lodge/reserve'},
  {id:'h17',name:'嬬恋 星見のヴィラ',type:'glamping',priceMin:25000,priceMax:44000,address:'群馬県吾妻郡嬬恋村（架空）',url:'https://example.com/hoshimi-villa',resUrl:'https://example.com/hoshimi-villa/reserve'},
  {id:'h18',name:'赤城 大沼キャンプ場',type:'campsite',priceMin:3000,priceMax:5500,address:'群馬県前橋市（架空）',url:null,resUrl:null},
];

// Links (sauna → restaurants/spots/hotels)
const LINKS = {
  s01:{restaurants:[{id:'r01',km:2.4,min:6,timing:'after_sauna',reason:'川魚の塩焼きが名物。サウナの後に歩いて行ける',score:0.9},{id:'r02',km:14.0,min:28,timing:'lunch',reason:'手打ち蕎麦',score:0.6}],spots:[{id:'p01',km:6.2,min:14,dur:40,score:0.7},{id:'p02',km:3.1,min:8,dur:60,score:0.85}],hotels:[{id:'h01',km:4.5,min:11,score:0.8}]},
  s02:{restaurants:[{id:'r02',km:3.2,min:9,timing:'after_sauna',reason:'村内の蕎麦処',score:0.85}],spots:[{id:'p02',km:12.0,min:25,dur:60,score:0.6}],hotels:[{id:'h02',km:1.2,min:4,score:0.9}]},
  s21:{restaurants:[{id:'r03',km:1.1,min:4,timing:'after_sauna',reason:'河川敷から徒歩圏',score:0.85}],spots:[{id:'p03',km:0.6,min:2,dur:120,score:0.8}],hotels:[]},
  s03:{restaurants:[{id:'r04',km:2.0,min:6,timing:'dinner',reason:'湯葉と豆腐のコース',score:0.85}],spots:[{id:'p04',km:4.4,min:12,dur:70,score:0.75},{id:'p05',km:2.8,min:8,dur:60,score:0.8}],hotels:[{id:'h03',km:1.5,min:5,score:0.9}]},
  s04:{restaurants:[{id:'r05',km:1.8,min:5,timing:'after_sauna',reason:'漁港直送のまぐろ丼',score:0.9}],spots:[{id:'p06',km:8.0,min:18,dur:180,score:0.6}],hotels:[{id:'h04',km:2.2,min:7,score:0.7}]},
  s05:{restaurants:[{id:'r06',km:0.8,min:3,timing:'after_sauna',reason:'湖畔のカフェ',score:0.8}],spots:[{id:'p07',km:1.0,min:3,dur:60,score:0.7}],hotels:[{id:'h05',km:2.5,min:7,score:0.65}]},
  s06:{restaurants:[{id:'r07',km:5.5,min:13,timing:'after_sauna',reason:'秩父名物のわらじカツ',score:0.85}],spots:[{id:'p08',km:18.0,min:40,dur:90,score:0.7},{id:'p10',km:6.0,min:14,dur:60,score:0.75}],hotels:[{id:'h06',km:7.0,min:16,score:0.8}]},
  s07:{restaurants:[{id:'r08',km:0.5,min:2,timing:'after_sauna',reason:'天然氷のかき氷',score:0.8}],spots:[{id:'p09',km:0.7,min:3,dur:60,score:0.85}],hotels:[{id:'h07',km:1.0,min:4,score:0.7}]},
  s08:{restaurants:[{id:'r09',km:3.0,min:8,timing:'lunch',reason:'薪窯のパン',score:0.75}],spots:[{id:'p11',km:4.2,min:11,dur:60,score:0.6}],hotels:[]},
  s09:{restaurants:[{id:'r10',km:3.6,min:9,timing:'after_sauna',reason:'漁協直営',score:0.9}],spots:[{id:'p12',km:2.0,min:6,dur:40,score:0.75},{id:'p13',km:4.0,min:10,dur:60,score:0.7}],hotels:[{id:'h08',km:1.8,min:5,score:0.9}]},
  s10:{restaurants:[{id:'r11',km:1.2,min:4,timing:'dinner',reason:'宿の食事処',score:0.85}],spots:[{id:'p14',km:5.0,min:12,dur:70,score:0.8}],hotels:[{id:'h09',km:0.1,min:1,score:0.95}]},
  s11:{restaurants:[{id:'r12',km:1.5,min:4,timing:'after_sauna',reason:'浜焼きの蛤',score:0.85}],spots:[{id:'p15',km:2.0,min:6,dur:150,score:0.7}],hotels:[{id:'h10',km:2.8,min:8,score:0.65}]},
  s12:{restaurants:[{id:'r13',km:6.5,min:15,timing:'after_sauna',reason:'奥久慈しゃもの親子丼',score:0.85}],spots:[{id:'p16',km:4.0,min:10,dur:50,score:0.85},{id:'p17',km:5.2,min:13,dur:60,score:0.7}],hotels:[{id:'h11',km:7.5,min:18,score:0.75}]},
  s13:{restaurants:[{id:'r14',km:2.2,min:7,timing:'lunch',reason:'れんこん料理',score:0.7}],spots:[{id:'p18',km:0.4,min:2,dur:90,score:0.75}],hotels:[{id:'h12',km:3.0,min:9,score:0.7}]},
  s14:{restaurants:[{id:'r15',km:2.8,min:8,timing:'after_sauna',reason:'磯料理',score:0.8}],spots:[{id:'p19',km:3.5,min:9,dur:50,score:0.75}],hotels:[]},
  s15:{restaurants:[{id:'r16',km:4.0,min:10,timing:'lunch',reason:'自家製チーズ',score:0.8}],spots:[{id:'p20',km:8.0,min:20,dur:90,score:0.75},{id:'p21',km:6.0,min:15,dur:50,score:0.85}],hotels:[{id:'h13',km:2.0,min:6,score:0.9}]},
  s16:{restaurants:[{id:'r17',km:3.0,min:9,timing:'dinner',reason:'日光湯波の御膳',score:0.85}],spots:[{id:'p22',km:2.5,min:8,dur:40,score:0.85},{id:'p23',km:11.0,min:22,dur:60,score:0.8}],hotels:[{id:'h14',km:0.8,min:3,score:0.95}]},
  s17:{restaurants:[{id:'r18',km:1.6,min:5,timing:'after_sauna',reason:'手打ちうどん',score:0.75}],spots:[{id:'p24',km:2.2,min:7,dur:40,score:0.7}],hotels:[{id:'h15',km:0.1,min:1,score:0.9}]},
  s18:{restaurants:[{id:'r19',km:3.4,min:9,timing:'after_sauna',reason:'ボリュームのある定食',score:0.85}],spots:[{id:'p25',km:2.0,min:6,dur:180,score:0.85},{id:'p26',km:4.5,min:11,dur:60,score:0.8}],hotels:[{id:'h16',km:3.0,min:8,score:0.85}]},
  s19:{restaurants:[{id:'r20',km:5.0,min:12,timing:'dinner',reason:'地元キャベツを使った洋食',score:0.8}],spots:[{id:'p27',km:3.0,min:9,dur:40,score:0.8},{id:'p28',km:6.0,min:14,dur:50,score:0.7}],hotels:[{id:'h17',km:1.0,min:4,score:0.9}]},
  s20:{restaurants:[{id:'r21',km:8.0,min:18,timing:'after_sauna',reason:'地粉のうどん',score:0.7}],spots:[{id:'p29',km:0.5,min:2,dur:90,score:0.8},{id:'p30',km:5.0,min:13,dur:60,score:0.75}],hotels:[{id:'h18',km:0.6,min:3,score:0.7}]},
};

// ──────────────── GENERATE SQL ────────────────
const lines = [];
lines.push('-- ============================================================');
lines.push('-- SAUNA DAY MVP — Seed Data');
lines.push('-- Generated by scripts/generate-seed.mjs');
lines.push('-- ============================================================');
lines.push('');

// taxonomy_terms
lines.push('-- taxonomy_terms');
lines.push('INSERT INTO taxonomy_terms (category, key, label_ja, icon, sort_order, is_advanced) VALUES');
lines.push(TAXONOMY.map(([cat, key, label, icon, sort, adv]) =>
  `  (${esc(cat)}, ${esc(key)}, ${esc(label)}, ${esc(icon)}, ${sort}, ${adv})`
).join(',\n') + ';');
lines.push('');

// search_weights
lines.push('-- search_weights');
lines.push('INSERT INTO search_weights (key, weight) VALUES');
lines.push(WEIGHTS.map(([k, w]) => `  (${esc(k)}, ${w})`).join(',\n') + ';');
lines.push('');

// origins
lines.push('-- origins');
lines.push('INSERT INTO origins (key, label_ja, lat, lng) VALUES');
lines.push(ORIGINS.map(([k, l, lat, lng]) => `  (${esc(k)}, ${esc(l)}, ${lat}, ${lng})`).join(',\n') + ';');
lines.push('');

// saunas
lines.push('-- saunas');
for (const s of SAUNAS) {
  lines.push(`INSERT INTO saunas (id, slug, name, description, prefecture, area, address, lat, lng, price_min, price_max, price_note, capacity_min, capacity_max, temp_min, temp_max, business_hours, closed_note, supports_day_trip, supports_lodging, parking_note, reservation_url, official_url, phone, popularity_score) VALUES (${uuid(s.id)}, ${esc(s.slug)}, ${esc(s.name)}, ${esc(s.desc)}, ${esc(s.pref)}, ${esc(s.area)}, ${esc(s.address)}, ${esc(s.lat)}, ${esc(s.lng)}, ${esc(s.priceMin)}, ${esc(s.priceMax)}, ${esc(s.priceNote)}, ${esc(s.capMin)}, ${esc(s.capMax)}, ${esc(s.tempMin)}, ${esc(s.tempMax)}, ${esc(s.hours)}, ${esc(s.closedNote)}, ${s.dayTrip}, ${s.lodging}, ${esc(s.parkingNote)}, ${esc(s.resUrl)}, ${esc(s.offUrl)}, ${esc(s.phone)}, ${s.pop});`);
}
lines.push('');

// sauna_images (hero placeholder)
lines.push('-- sauna_images (hero placeholders)');
for (const s of SAUNAS) {
  const alt = `${s.name}のサウナ棟と外気浴スペース`;
  lines.push(`INSERT INTO sauna_images (sauna_id, url, alt, sort_order, is_hero) VALUES (${uuid(s.id)}, '/images/placeholder.jpg', ${esc(alt)}, 0, true);`);
}
lines.push('');

// sauna_features
lines.push('-- sauna_features');
for (const [sid, feats] of Object.entries(FEATURES)) {
  for (const [cat, key] of feats) {
    lines.push(`INSERT INTO sauna_features (sauna_id, category, key) VALUES (${uuid(sid)}, ${esc(cat)}, ${esc(key)});`);
  }
}
lines.push('');

// sauna_environments
lines.push('-- sauna_environments');
for (const [sid, envs] of Object.entries(ENVIRONMENTS)) {
  for (const [key, prox] of envs) {
    lines.push(`INSERT INTO sauna_environments (sauna_id, key, proximity) VALUES (${uuid(sid)}, ${esc(key)}, '${prox}');`);
  }
}
lines.push('');

// sauna_cooldowns
lines.push('-- sauna_cooldowns');
for (const [sid, cools] of Object.entries(COOLDOWNS)) {
  for (const c of cools) {
    lines.push(`INSERT INTO sauna_cooldowns (sauna_id, key, water_temp_min, water_temp_max, depth_cm, can_dive, is_natural, has_flow, note) VALUES (${uuid(sid)}, ${esc(c.key)}, ${esc(c.tempMin)}, ${esc(c.tempMax)}, ${esc(c.depthCm)}, ${esc(c.canDive)}, ${esc(c.isNatural)}, ${esc(c.hasFlow)}, ${esc(c.note)});`);
  }
}
lines.push('');

// sauna_experiences
lines.push('-- sauna_experiences');
for (const [sid, exps] of Object.entries(EXPERIENCES)) {
  for (const [cat, key] of exps) {
    lines.push(`INSERT INTO sauna_experiences (sauna_id, category, key) VALUES (${uuid(sid)}, ${esc(cat)}, ${esc(key)});`);
  }
}
lines.push('');

// restaurants
lines.push('-- restaurants');
for (const r of RESTAURANTS) {
  lines.push(`INSERT INTO restaurants (id, name, genre, price_min, price_max, business_hours, address, official_url) VALUES (${uuid(r.id)}, ${esc(r.name)}, ${esc(r.genre)}, ${esc(r.priceMin)}, ${esc(r.priceMax)}, ${esc(r.hours)}, ${esc(r.address)}, ${esc(r.url)});`);
}
lines.push('');

// spots
lines.push('-- spots');
for (const s of SPOTS) {
  lines.push(`INSERT INTO spots (id, name, category, description, price_min, business_hours, address, official_url) VALUES (${uuid(s.id)}, ${esc(s.name)}, '${s.cat}', ${esc(s.desc)}, ${esc(s.priceMin)}, ${esc(s.hours)}, ${esc(s.address)}, ${esc(s.url)});`);
}
lines.push('');

// hotels
lines.push('-- hotels');
for (const h of HOTELS) {
  lines.push(`INSERT INTO hotels (id, name, lodging_type, price_min, price_max, address, official_url, reservation_url) VALUES (${uuid(h.id)}, ${esc(h.name)}, ${esc(h.type)}, ${esc(h.priceMin)}, ${esc(h.priceMax)}, ${esc(h.address)}, ${esc(h.url)}, ${esc(h.resUrl)});`);
}
lines.push('');

// sauna_restaurants / sauna_spots / sauna_hotels
lines.push('-- sauna_restaurants');
for (const [sid, link] of Object.entries(LINKS)) {
  for (const r of link.restaurants) {
    lines.push(`INSERT INTO sauna_restaurants (sauna_id, restaurant_id, distance_km, travel_minutes, recommended_timing, recommend_reason, recommend_score) VALUES (${uuid(sid)}, ${uuid(r.id)}, ${esc(r.km)}, ${esc(r.min)}, ${esc(r.timing)}, ${esc(r.reason)}, ${r.score});`);
  }
}
lines.push('');

lines.push('-- sauna_spots');
for (const [sid, link] of Object.entries(LINKS)) {
  for (const s of link.spots) {
    lines.push(`INSERT INTO sauna_spots (sauna_id, spot_id, distance_km, travel_minutes, duration_minutes, recommend_score) VALUES (${uuid(sid)}, ${uuid(s.id)}, ${esc(s.km)}, ${esc(s.min)}, ${esc(s.dur)}, ${s.score});`);
  }
}
lines.push('');

lines.push('-- sauna_hotels');
for (const [sid, link] of Object.entries(LINKS)) {
  for (const h of link.hotels) {
    lines.push(`INSERT INTO sauna_hotels (sauna_id, hotel_id, distance_km, travel_minutes, recommend_score) VALUES (${uuid(sid)}, ${uuid(h.id)}, ${esc(h.km)}, ${esc(h.min)}, ${h.score});`);
  }
}
lines.push('');

writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`Generated: ${outPath}`);
console.log(`  ${SAUNAS.length} saunas, ${RESTAURANTS.length} restaurants, ${SPOTS.length} spots, ${HOTELS.length} hotels`);
