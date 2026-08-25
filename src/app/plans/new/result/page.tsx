import { notFound } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { Timeline, toTimelineRow } from '@/components/plan/Timeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRepository } from '@/lib/data';
import { collectCandidates, createHolidayPlan } from '@/lib/plan';
import { resolvePlanItems } from '@/lib/plan/resolve';

import { SavePlanButton } from '../SavePlanButton';
import { RegenerateButton } from './RegenerateButton';

import type { TimelineRow } from '@/components/plan/Timeline';

type PlanResultPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 5. 休日プラン — 結果表示
 *
 * ヒアリング回答を searchParams で受け取り、
 * 候補をDBから収集 → Gemini でプランを組み立てて表示する。
 * AI が失敗した場合は決定的なロジックにフォールバック。
 *
 * IMPORTANT: 候補はすべてDB由来。施設名・料金をこの画面で作らない。
 */
export default async function PlanResultPage({ searchParams }: PlanResultPageProps) {
  const query = await searchParams;
  const slugParam = query.sauna;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;

  if (slug === undefined) {
    return (
      <>
        <AppHeader title="休日を作る" backHref="/" />
        <PageShell>
          <EmptyState
            message="どのサウナで休日を作るか選んでください"
            action={{ label: 'サウナを探す', href: '/' }}
            icon="Route"
          />
        </PageShell>
      </>
    );
  }

  const repository = getRepository();
  const sauna = await repository.getSaunaBySlug(slug);
  if (sauna === null) notFound();

  const places = await repository.getLinkedPlaces(sauna.id);

  // 候補収集
  const isLodging = query.lodging === 'true';
  const candidates = collectCandidates(sauna, places, isLodging);

  // 候補不足チェック: サ飯も観光もない場合はプラン生成不可
  const hasCandidates =
    candidates.places.restaurants.length > 0 || candidates.places.spots.length > 0;

  if (!hasCandidates) {
    return (
      <>
        <AppHeader title="休日を作る" backHref={`/saunas/${sauna.slug}`} />
        <PageShell>
          <EmptyState
            message="このサウナの周辺候補がまだ登録されていません"
            action={{ label: 'サウナ詳細に戻る', href: `/saunas/${sauna.slug}` }}
            icon="MapPinOff"
          />
        </PageShell>
      </>
    );
  }

  // AI生成（フォールバック付き）
  const validPlan = await createHolidayPlan(candidates, {
    isLodging,
    departureTime: typeof query.departure === 'string' ? query.departure : null,
    date: typeof query.date === 'string' ? query.date : null,
    partySize: typeof query.party === 'string' ? parseInt(query.party, 10) || null : null,
    mealPreference: typeof query.meal === 'string' ? query.meal : null,
    experiencePreference: typeof query.experience === 'string' ? query.experience : null,
  });

  // 表示用に参照を解決
  const resolvedItems = await resolvePlanItems(validPlan.items, repository);

  const rows: TimelineRow[] = resolvedItems.map(toTimelineRow);

  return (
    <>
      <AppHeader title="休日を作る" backHref={`/plans/new?sauna=${sauna.slug}${isLodging ? '&lodging=true' : ''}`} />
      <PageShell>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-[24px] leading-snug text-ink">{validPlan.title}</h1>
            <p className="text-[13px] text-ink-muted">{sauna.name}を中心にした休日</p>
          </div>

          <Timeline rows={rows} />

          <div className="flex flex-col gap-3">
            <SavePlanButton plan={validPlan} />
            <RegenerateButton />
          </div>
        </div>
      </PageShell>
    </>
  );
}
