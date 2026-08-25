import { runSearch, redistributeForGuest, DEFAULT_WEIGHTS, normalizeWeights } from '@/lib/search';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { estimateTravelMinutes } from '@/lib/utils/distance';

import { NotImplementedYetError } from './repository';

import type { Repository } from './repository';
import type { Database } from '@/lib/supabase/types';
import type {
  BusinessHours,
  Cooldown,
  HolidayPlan,
  LinkedHotel,
  LinkedPlaces,
  LinkedRestaurant,
  LinkedSpot,
  Origin,
  SavedCondition,
  SaunaDetail,
  SaunaEnvironment,
  SaunaImage,
  SaunaSummary,
  SearchConditions,
  SearchOutcome,
  TagRef,
  TaxonomyCategory,
  Weights,
} from '@/lib/types';

// ──────────────── Row 型エイリアス ────────────────

type SaunaRow = Database['public']['Tables']['saunas']['Row'];
type ImageRow = Database['public']['Tables']['sauna_images']['Row'];
type FeatureRow = Database['public']['Tables']['sauna_features']['Row'];
type EnvRow = Database['public']['Tables']['sauna_environments']['Row'];
type CooldownRow = Database['public']['Tables']['sauna_cooldowns']['Row'];
type ExpRow = Database['public']['Tables']['sauna_experiences']['Row'];
type RestaurantsRow = Database['public']['Tables']['restaurants']['Row'];
type SpotsRow = Database['public']['Tables']['spots']['Row'];
type HotelsRow = Database['public']['Tables']['hotels']['Row'];

// ──────────────── ヘルパー ────────────────

function parseBusinessHours(raw: unknown): BusinessHours | null {
  if (raw === null || raw === undefined) return null;
  return raw as BusinessHours;
}

function heroImageOf(images: ImageRow[]): SaunaImage | null {
  const hero = images.find((img) => img.is_hero);
  if (hero) return { url: hero.url, alt: hero.alt };
  if (images.length > 0) return { url: images[0].url, alt: images[0].alt };
  return null;
}

function primaryTagsOf(features: FeatureRow[]): TagRef[] {
  // 最初の3〜4件を表示用に使う。カテゴリの多様性を優先
  const seen = new Set<string>();
  const result: TagRef[] = [];
  for (const f of features) {
    if (seen.has(f.category)) continue;
    seen.add(f.category);
    result.push({ category: f.category as TaxonomyCategory, key: f.key });
    if (result.length >= 4) break;
  }
  return result;
}

function mapCooldown(row: CooldownRow): Cooldown {
  return {
    key: row.key,
    waterTempMin: row.water_temp_min,
    waterTempMax: row.water_temp_max,
    depthCm: row.depth_cm,
    canDive: row.can_dive,
    isNatural: row.is_natural,
    hasFlow: row.has_flow,
    note: row.note,
  };
}

function mapEnvironment(row: EnvRow): SaunaEnvironment {
  return { key: row.key, proximity: row.proximity };
}

/**
 * DB行からSaunaDetailを組み立てる。
 * travelMinutesは出発地によるので、呼び出し側で設定する。
 */
function buildSaunaDetail(
  row: SaunaRow,
  images: ImageRow[],
  features: FeatureRow[],
  environments: EnvRow[],
  cooldowns: CooldownRow[],
  experiences: ExpRow[],
  travelMinutes: number | null,
): SaunaDetail {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    prefecture: row.prefecture,
    area: row.area,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    priceMin: row.price_min,
    priceMax: row.price_max,
    priceNote: row.price_note,
    capacityMin: row.capacity_min,
    capacityMax: row.capacity_max,
    tempMin: row.temp_min,
    tempMax: row.temp_max,
    businessHours: parseBusinessHours(row.business_hours),
    closedNote: row.closed_note,
    parkingNote: row.parking_note,
    reservationUrl: row.reservation_url,
    officialUrl: row.official_url,
    phone: row.phone,
    supportsDayTrip: row.supports_day_trip,
    supportsLodging: row.supports_lodging,
    popularityScore: row.popularity_score,
    heroImage: heroImageOf(images),
    images: images.map((img) => ({ url: img.url, alt: img.alt })),
    primaryTags: primaryTagsOf(features),
    features: features.map((f) => ({ category: f.category as TaxonomyCategory, key: f.key })),
    environments: environments.map(mapEnvironment),
    cooldowns: cooldowns.map(mapCooldown),
    experiences: experiences.map((e) => ({ category: e.category as TaxonomyCategory, key: e.key })),
    travelMinutes,
    featuredUntil: (row as Record<string, unknown>).featured_until as string | null ?? null,
    featuredCopy: (row as Record<string, unknown>).featured_copy as string | null ?? null,
  };
}

function toSummary(sauna: SaunaDetail): SaunaSummary {
  return {
    id: sauna.id,
    slug: sauna.slug,
    name: sauna.name,
    prefecture: sauna.prefecture,
    area: sauna.area,
    heroImage: sauna.heroImage,
    primaryTags: sauna.primaryTags,
    priceMin: sauna.priceMin,
    travelMinutes: sauna.travelMinutes,
    featuredUntil: sauna.featuredUntil,
    featuredCopy: sauna.featuredCopy,
  };
}

// ──────────────── 全サウナ取得（検索用） ────────────────

async function fetchAllSaunasWithDetails(originKey: string | null): Promise<SaunaDetail[]> {
  const supabase = await createServerClient();

  // 出発地の座標を取得
  let origin: { lat: number; lng: number } | null = null;
  if (originKey) {
    const { data: originRow } = await supabase
      .from('origins')
      .select('lat, lng')
      .eq('key', originKey)
      .single();
    if (originRow) {
      origin = { lat: originRow.lat, lng: originRow.lng };
    }
  }

  // 全サウナを取得
  const { data: saunaRows, error } = await supabase
    .from('saunas')
    .select('*')
    .order('slug');

  if (error || !saunaRows) return [];

  // 関連データを一括取得
  const saunaIds = saunaRows.map((s) => s.id);

  const [imagesRes, featuresRes, envsRes, cooldownsRes, expsRes] = await Promise.all([
    supabase.from('sauna_images').select('*').in('sauna_id', saunaIds).order('sort_order'),
    supabase.from('sauna_features').select('*').in('sauna_id', saunaIds),
    supabase.from('sauna_environments').select('*').in('sauna_id', saunaIds),
    supabase.from('sauna_cooldowns').select('*').in('sauna_id', saunaIds),
    supabase.from('sauna_experiences').select('*').in('sauna_id', saunaIds),
  ]);

  const images = imagesRes.data ?? [];
  const features = featuresRes.data ?? [];
  const envs = envsRes.data ?? [];
  const cooldowns = cooldownsRes.data ?? [];
  const exps = expsRes.data ?? [];

  // サウナIDごとにグルーピング
  const imagesBySauna = groupBy(images, 'sauna_id');
  const featuresBySauna = groupBy(features, 'sauna_id');
  const envsBySauna = groupBy(envs, 'sauna_id');
  const cooldownsBySauna = groupBy(cooldowns, 'sauna_id');
  const expsBySauna = groupBy(exps, 'sauna_id');

  return saunaRows.map((row) => {
    const travelMinutes = estimateTravelMinutes(origin, row);
    return buildSaunaDetail(
      row,
      imagesBySauna.get(row.id) ?? [],
      featuresBySauna.get(row.id) ?? [],
      envsBySauna.get(row.id) ?? [],
      cooldownsBySauna.get(row.id) ?? [],
      expsBySauna.get(row.id) ?? [],
      travelMinutes,
    );
  });
}

// ──────────────── 単一サウナ取得 ────────────────

async function fetchSaunaByColumn(
  column: 'slug' | 'id',
  value: string,
): Promise<SaunaDetail | null> {
  const supabase = await createServerClient();

  const { data: row } = await supabase
    .from('saunas')
    .select('*')
    .eq(column, value)
    .single();

  if (!row) return null;

  const [imagesRes, featuresRes, envsRes, cooldownsRes, expsRes] = await Promise.all([
    supabase.from('sauna_images').select('*').eq('sauna_id', row.id).order('sort_order'),
    supabase.from('sauna_features').select('*').eq('sauna_id', row.id),
    supabase.from('sauna_environments').select('*').eq('sauna_id', row.id),
    supabase.from('sauna_cooldowns').select('*').eq('sauna_id', row.id),
    supabase.from('sauna_experiences').select('*').eq('sauna_id', row.id),
  ]);

  return buildSaunaDetail(
    row,
    imagesRes.data ?? [],
    featuresRes.data ?? [],
    envsRes.data ?? [],
    cooldownsRes.data ?? [],
    expsRes.data ?? [],
    null, // 出発地不明 → 「不明」
  );
}

// ──────────────── ユーティリティ ────────────────

function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = item[key] as string;
    const list = map.get(k);
    if (list) {
      list.push(item);
    } else {
      map.set(k, [item]);
    }
  }
  return map;
}

// ──────────────── Repository 実装 ────────────────

export const supabaseRepository: Repository = {
  async searchSaunas(conditions: SearchConditions): Promise<SearchOutcome> {
    const saunas = await fetchAllSaunasWithDetails(conditions.required.originKey);
    const weights = redistributeForGuest(await this.getWeights());
    return runSearch(saunas, conditions, weights);
  },

  async countSaunas(conditions: SearchConditions): Promise<number> {
    const outcome = await this.searchSaunas(conditions);
    return outcome.items.length;
  },

  async getSaunaBySlug(slug: string): Promise<SaunaDetail | null> {
    return fetchSaunaByColumn('slug', slug);
  },

  async getSaunaById(id: string): Promise<SaunaDetail | null> {
    return fetchSaunaByColumn('id', id);
  },

  async getSaunaSummariesByIds(ids: string[]): Promise<SaunaSummary[]> {
    if (ids.length === 0) return [];
    const supabase = await createServerClient();

    const { data: rows } = await supabase
      .from('saunas')
      .select('*')
      .in('id', ids);

    if (!rows || rows.length === 0) return [];

    const saunaIds = rows.map((r) => r.id);
    const [imagesRes, featuresRes] = await Promise.all([
      supabase.from('sauna_images').select('*').in('sauna_id', saunaIds).eq('is_hero', true),
      supabase.from('sauna_features').select('*').in('sauna_id', saunaIds),
    ]);

    const imagesBySauna = groupBy(imagesRes.data ?? [], 'sauna_id');
    const featuresBySauna = groupBy(featuresRes.data ?? [], 'sauna_id');

    const order = new Map(ids.map((id, i) => [id, i]));
    return rows
      .map((row) => {
        const detail = buildSaunaDetail(
          row,
          imagesBySauna.get(row.id) ?? [],
          featuresBySauna.get(row.id) ?? [],
          [],
          [],
          [],
          null,
        );
        return toSummary(detail);
      })
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  },

  async getSaunaSummariesBySlugs(slugs: string[]): Promise<SaunaSummary[]> {
    if (slugs.length === 0) return [];
    const supabase = await createServerClient();

    const { data: rows } = await supabase
      .from('saunas')
      .select('*')
      .in('slug', slugs);

    if (!rows || rows.length === 0) return [];

    const saunaIds = rows.map((r) => r.id);
    const [imagesRes, featuresRes] = await Promise.all([
      supabase.from('sauna_images').select('*').in('sauna_id', saunaIds).eq('is_hero', true),
      supabase.from('sauna_features').select('*').in('sauna_id', saunaIds),
    ]);

    const imagesBySauna = groupBy(imagesRes.data ?? [], 'sauna_id');
    const featuresBySauna = groupBy(featuresRes.data ?? [], 'sauna_id');

    const order = new Map(slugs.map((slug, i) => [slug, i]));
    return rows
      .map((row) => {
        const detail = buildSaunaDetail(
          row,
          imagesBySauna.get(row.id) ?? [],
          featuresBySauna.get(row.id) ?? [],
          [],
          [],
          [],
          null,
        );
        return toSummary(detail);
      })
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  },

  async getLinkedPlaces(saunaId: string): Promise<LinkedPlaces> {
    const supabase = await createServerClient();

    // 中間テーブルを取得
    const [linkRestRes, linkSpotRes, linkHotelRes] = await Promise.all([
      supabase.from('sauna_restaurants').select('*').eq('sauna_id', saunaId).order('recommend_score', { ascending: false }),
      supabase.from('sauna_spots').select('*').eq('sauna_id', saunaId).order('recommend_score', { ascending: false }),
      supabase.from('sauna_hotels').select('*').eq('sauna_id', saunaId).order('recommend_score', { ascending: false }),
    ]);

    const linkRests = linkRestRes.data ?? [];
    const linkSpots = linkSpotRes.data ?? [];
    const linkHotels = linkHotelRes.data ?? [];

    // 関連する施設を取得
    const restIds = linkRests.map((l) => l.restaurant_id);
    const spotIds = linkSpots.map((l) => l.spot_id);
    const hotelIds = linkHotels.map((l) => l.hotel_id);

    const [restRes, spotRes, hotelRes] = await Promise.all([
      restIds.length > 0
        ? supabase.from('restaurants').select('*').in('id', restIds)
        : Promise.resolve({ data: [] as RestaurantsRow[] }),
      spotIds.length > 0
        ? supabase.from('spots').select('*').in('id', spotIds)
        : Promise.resolve({ data: [] as SpotsRow[] }),
      hotelIds.length > 0
        ? supabase.from('hotels').select('*').in('id', hotelIds)
        : Promise.resolve({ data: [] as HotelsRow[] }),
    ]);

    const restMap = new Map((restRes.data ?? []).map((r) => [r.id, r]));
    const spotMap = new Map((spotRes.data ?? []).map((s) => [s.id, s]));
    const hotelMap = new Map((hotelRes.data ?? []).map((h) => [h.id, h]));

    const restaurants: LinkedRestaurant[] = linkRests.flatMap((link) => {
      const r = restMap.get(link.restaurant_id);
      if (!r) return [];
      return [{
        restaurant: {
          id: r.id,
          name: r.name,
          genre: r.genre,
          priceMin: r.price_min,
          priceMax: r.price_max,
          businessHours: parseBusinessHours(r.business_hours),
          address: r.address,
          officialUrl: r.official_url,
        },
        distanceKm: link.distance_km,
        travelMinutes: link.travel_minutes,
        recommendScore: link.recommend_score,
        recommendedTiming: link.recommended_timing as LinkedRestaurant['recommendedTiming'],
        recommendReason: link.recommend_reason,
      }];
    });

    const spots: LinkedSpot[] = linkSpots.flatMap((link) => {
      const s = spotMap.get(link.spot_id);
      if (!s) return [];
      return [{
        spot: {
          id: s.id,
          name: s.name,
          category: s.category,
          description: s.description,
          priceMin: s.price_min,
          businessHours: parseBusinessHours(s.business_hours),
          address: s.address,
          officialUrl: s.official_url,
        },
        distanceKm: link.distance_km,
        travelMinutes: link.travel_minutes,
        recommendScore: link.recommend_score,
        durationMinutes: link.duration_minutes,
      }];
    });

    const hotels: LinkedHotel[] = linkHotels.flatMap((link) => {
      const h = hotelMap.get(link.hotel_id);
      if (!h) return [];
      return [{
        hotel: {
          id: h.id,
          name: h.name,
          lodgingType: h.lodging_type as LinkedHotel['hotel']['lodgingType'],
          priceMin: h.price_min,
          priceMax: h.price_max,
          address: h.address,
          officialUrl: h.official_url,
          reservationUrl: h.reservation_url,
        },
        distanceKm: link.distance_km,
        travelMinutes: link.travel_minutes,
        recommendScore: link.recommend_score,
      }];
    });

    return { restaurants, spots, hotels };
  },

  async listOrigins(): Promise<Origin[]> {
    const supabase = await createServerClient();
    const { data } = await supabase.from('origins').select('*').order('key');
    if (!data) return [];
    return data.map((row) => ({
      key: row.key,
      labelJa: row.label_ja,
      lat: row.lat,
      lng: row.lng,
    }));
  },

  async getWeights(): Promise<Weights> {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from('search_weights').select('key, weight');

    if (error || !data || data.length === 0) {
      return normalizeWeights(DEFAULT_WEIGHTS);
    }

    const weights = { ...DEFAULT_WEIGHTS };
    for (const row of data) {
      if (row.key in weights) {
        (weights as Record<string, number>)[row.key] = row.weight;
      }
    }
    return normalizeWeights(weights);
  },

  // ── Favorites（Phase 3）
  async listFavoriteSaunaIds(): Promise<string[]> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('favorites')
      .select('sauna_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!data) return [];
    return data.map((row) => row.sauna_id);
  },

  async addFavorite(saunaId: string): Promise<void> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('favorites')
      .upsert({ user_id: user.id, sauna_id: saunaId }, { onConflict: 'user_id,sauna_id' });
  },

  async removeFavorite(saunaId: string): Promise<void> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('sauna_id', saunaId);
  },

  // ── Saved Plans（Phase 6）
  async listSavedPlans(): Promise<HolidayPlan[]> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: plans } = await supabase
      .from('saved_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!plans || plans.length === 0) return [];

    const planIds = plans.map((p) => p.id);
    const { data: items } = await supabase
      .from('plan_items')
      .select('*')
      .in('plan_id', planIds)
      .order('sort_order');

    const itemsByPlan = new Map<string, typeof items>();
    for (const item of items ?? []) {
      const list = itemsByPlan.get(item.plan_id) ?? [];
      list.push(item);
      itemsByPlan.set(item.plan_id, list);
    }

    return plans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      date: plan.plan_date,
      saunaId: plan.sauna_id,
      originKey: plan.origin_key,
      departureTime: plan.departure_time,
      isLodging: plan.is_lodging,
      items: (itemsByPlan.get(plan.id) ?? []).map((item) => ({
        startTime: item.start_time,
        refType: item.ref_type,
        refId: item.ref_id,
        note: item.note,
      })),
    }));
  },

  async getSavedPlan(id: string): Promise<HolidayPlan | null> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: plan } = await supabase
      .from('saved_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return null;

    const { data: items } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plan.id)
      .order('sort_order');

    return {
      id: plan.id,
      title: plan.title,
      date: plan.plan_date,
      saunaId: plan.sauna_id,
      originKey: plan.origin_key,
      departureTime: plan.departure_time,
      isLodging: plan.is_lodging,
      items: (items ?? []).map((item) => ({
        startTime: item.start_time,
        refType: item.ref_type,
        refId: item.ref_id,
        note: item.note,
      })),
    };
  },

  async savePlan(plan: HolidayPlan): Promise<string> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    const { data: inserted, error } = await supabase
      .from('saved_plans')
      .insert({
        user_id: user.id,
        title: plan.title,
        plan_date: plan.date,
        sauna_id: plan.saunaId,
        origin_key: plan.originKey,
        departure_time: plan.departureTime,
        is_lodging: plan.isLodging,
      })
      .select('id')
      .single();

    if (error || !inserted) throw new Error('プランの保存に失敗しました');

    const planId = inserted.id;

    // plan_items を挿入
    if (plan.items.length > 0) {
      const itemRows = plan.items.map((item, index) => ({
        plan_id: planId,
        sort_order: index,
        start_time: item.startTime,
        ref_type: item.refType,
        ref_id: item.refId,
        note: item.note,
      }));

      await supabase.from('plan_items').insert(itemRows);
    }

    return planId;
  },

  async deletePlan(id: string): Promise<void> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // RLS が本人のみ削除を許可するので、user_id チェックは RLS に任せる
    // plan_items は cascade で自動削除される
    await supabase.from('saved_plans').delete().eq('id', id).eq('user_id', user.id);
  },

  // ── 今月のおすすめ（Sprint 2）
  async listFeaturedSaunas(): Promise<SaunaSummary[]> {
    const saunas = await fetchAllSaunasWithDetails(null);
    const today = new Date().toISOString().slice(0, 10);
    const featured = saunas.filter(
      (s) => s.featuredUntil !== null && s.featuredUntil >= today,
    );
    return featured.slice(0, 3).map(toSummary);
  },

  // ── プラン共有（Sprint 2）
  async getPublicPlan(id: string): Promise<HolidayPlan | null> {
    const supabase = await createServerClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan } = await (supabase as any)
      .from('saved_plans')
      .select('*')
      .eq('id', id)
      .eq('is_public', true)
      .single();

    if (!plan) return null;

    const { data: items } = await supabase
      .from('plan_items')
      .select('*')
      .eq('plan_id', plan.id)
      .order('sort_order');

    return {
      id: plan.id,
      title: plan.title,
      date: plan.plan_date,
      saunaId: plan.sauna_id,
      originKey: plan.origin_key,
      departureTime: plan.departure_time,
      isLodging: plan.is_lodging,
      items: (items ?? []).map((item) => ({
        startTime: item.start_time,
        refType: item.ref_type,
        refId: item.ref_id,
        note: item.note,
      })),
    };
  },

  async setPublicPlan(id: string, isPublic: boolean): Promise<void> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('saved_plans')
      .update({ is_public: isPublic })
      .eq('id', id)
      .eq('user_id', user.id);
  },

  // ── 検索条件の保存（Sprint 2）
  async listSavedConditions(): Promise<SavedCondition[]> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('saved_conditions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id: row.id,
      label: row.label,
      conditions: row.conditions_json as SearchConditions,
      createdAt: row.created_at,
    }));
  },

  async saveCondition(label: string, conditions: SearchConditions): Promise<string> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('認証が必要です');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('saved_conditions')
      .insert({
        user_id: user.id,
        label,
        conditions_json: conditions,
      })
      .select('id')
      .single();

    if (error || !data) throw new Error('条件の保存に失敗しました');
    return data.id;
  },

  async deleteCondition(id: string): Promise<void> {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('saved_conditions').delete().eq('id', id).eq('user_id', user.id);
  },
};
