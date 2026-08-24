import { getWeights, redistributeForGuest, runSearch } from '@/lib/search';
import { estimateTravelMinutes } from '@/lib/utils/distance';
import { findOrigin, MOCK_ORIGINS } from '@/mock/origins';
import { linkedPlacesOf } from '@/mock/places';
import { MOCK_SAUNAS } from '@/mock/saunas';

import { NotImplementedYetError } from './repository';

import type { Repository } from './repository';
import type {
  HolidayPlan,
  LinkedPlaces,
  Origin,
  SaunaDetail,
  SaunaSummary,
  SearchConditions,
  SearchOutcome,
  Weights,
} from '@/lib/types';

/**
 * Phase 1 のデータアクセス実装。
 * Phase 2 で supabase-repository.ts に差し替える。画面コードは変更しない。
 */

/** 出発地から所要時間を導出して SaunaDetail を組み立てる */
function withTravelMinutes(originKey: string | null): SaunaDetail[] {
  const origin = findOrigin(originKey);
  return MOCK_SAUNAS.map((sauna) => ({
    ...sauna,
    travelMinutes: estimateTravelMinutes(origin, sauna),
  }));
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
  };
}

export const mockRepository: Repository = {
  async searchSaunas(conditions: SearchConditions): Promise<SearchOutcome> {
    const saunas = withTravelMinutes(conditions.required.originKey);
    // Phase 1 はゲストのみ。preference の重みは他要素へ再配分する
    const weights = redistributeForGuest(await getWeights());
    return runSearch(saunas, conditions, weights);
  },

  async countSaunas(conditions: SearchConditions): Promise<number> {
    const outcome = await this.searchSaunas(conditions);
    return outcome.items.length;
  },

  async getSaunaBySlug(slug: string): Promise<SaunaDetail | null> {
    const sauna = MOCK_SAUNAS.find((s) => s.slug === slug);
    if (sauna === undefined) return null;
    // 出発地が不明な文脈なので所要時間は null（→「不明」）
    return { ...sauna, travelMinutes: null };
  },

  async getSaunaById(id: string): Promise<SaunaDetail | null> {
    const sauna = MOCK_SAUNAS.find((s) => s.id === id);
    if (sauna === undefined) return null;
    return { ...sauna, travelMinutes: null };
  },

  async getSaunaSummariesByIds(ids: string[]): Promise<SaunaSummary[]> {
    const order = new Map(ids.map((id, index) => [id, index]));
    return MOCK_SAUNAS.filter((sauna) => order.has(sauna.id))
      .map((sauna) => toSummary({ ...sauna, travelMinutes: null }))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  },

  async getSaunaSummariesBySlugs(slugs: string[]): Promise<SaunaSummary[]> {
    const order = new Map(slugs.map((slug, index) => [slug, index]));
    return MOCK_SAUNAS.filter((sauna) => order.has(sauna.slug))
      .map((sauna) => toSummary({ ...sauna, travelMinutes: null }))
      .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  },

  async getLinkedPlaces(saunaId: string): Promise<LinkedPlaces> {
    return linkedPlacesOf(saunaId);
  },

  async listOrigins(): Promise<Origin[]> {
    return [...MOCK_ORIGINS];
  },

  async getWeights(): Promise<Weights> {
    return getWeights();
  },

  // ── Phase 3 で実装
  async listFavoriteSaunaIds(): Promise<string[]> {
    return [];
  },

  async addFavorite(): Promise<void> {
    throw new NotImplementedYetError('addFavorite', 'Phase 3');
  },

  async removeFavorite(): Promise<void> {
    throw new NotImplementedYetError('removeFavorite', 'Phase 3');
  },

  // ── Phase 6 で実装
  async listSavedPlans(): Promise<HolidayPlan[]> {
    return [];
  },

  async getSavedPlan(): Promise<HolidayPlan | null> {
    return null;
  },

  async savePlan(): Promise<string> {
    throw new NotImplementedYetError('savePlan', 'Phase 6');
  },

  async deletePlan(): Promise<void> {
    throw new NotImplementedYetError('deletePlan', 'Phase 6');
  },
};
