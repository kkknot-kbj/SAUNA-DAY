import { notFound } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { Timeline } from '@/components/plan/Timeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRepository } from '@/lib/data';
import { formatDuration, formatPriceRange } from '@/lib/utils/format';

import type { TimelineRow } from '@/components/plan/Timeline';

type NewPlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 5. 休日プラン
 *
 * Phase 1 では、DBに登録済みの候補を時系列の骨格として並べるところまで。
 * Phase 6 で営業時間と移動時間から決定的に組み立て、Phase 7 でLLMに差し替える。
 *
 * IMPORTANT: 候補はすべてDB由来。施設名・料金をこの画面で作らない。
 */
export default async function NewPlanPage({ searchParams }: NewPlanPageProps) {
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

  // Phase 1 は候補の並びをそのまま骨格として見せる。
  // おすすめ度の高いものを1件ずつ選ぶだけの単純な組み立て。
  const topRestaurant = [...places.restaurants].sort(
    (a, b) => b.recommendScore - a.recommendScore,
  )[0];
  const topSpot = [...places.spots].sort((a, b) => b.recommendScore - a.recommendScore)[0];

  const rows: TimelineRow[] = [
    { time: null, title: sauna.name, meta: sauna.area, icon: 'Flame', emphasis: true },
  ];

  if (topRestaurant !== undefined) {
    rows.push({
      time: null,
      title: topRestaurant.restaurant.name,
      meta: `${topRestaurant.restaurant.genre} / ${formatPriceRange(
        topRestaurant.restaurant.priceMin,
        topRestaurant.restaurant.priceMax,
      )}`,
      icon: 'UtensilsCrossed',
    });
  }

  if (topSpot !== undefined) {
    rows.push({
      time: null,
      title: topSpot.spot.name,
      meta:
        topSpot.durationMinutes === null
          ? null
          : `滞在 ${formatDuration(topSpot.durationMinutes)}`,
      icon: 'MapPin',
    });
  }

  return (
    <>
      <AppHeader title="休日を作る" backHref={`/saunas/${sauna.slug}`} />
      <PageShell>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <p className="text-[13px] text-ink-muted">このサウナを中心にした休日</p>
            <h1 className="font-serif text-[24px] leading-snug text-ink">{sauna.name}</h1>
          </div>

          <Timeline rows={rows} />

          <p className="text-[13px] text-ink-faint">
            時刻の割り当てと保存は、この先の実装で対応します。
          </p>
        </div>
      </PageShell>
    </>
  );
}
