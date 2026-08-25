import { notFound } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { Timeline, toTimelineRow } from '@/components/plan/Timeline';
import { getRepository } from '@/lib/data';
import { resolvePlanItems } from '@/lib/plan/resolve';
import { formatDateLabel } from '@/lib/utils/format';

import { DeletePlanButton } from './DeletePlanButton';

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 保存プランの詳細。
 *
 * IMPORTANT: 表示時に refId から施設情報をDBで解決すること（要件14-6）。
 * 保存時のテキストをそのまま出さない。
 * 参照先が失われている場合は「情報が取得できません」と表示する（要件14-7）。
 */
export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const repository = getRepository();
  const plan = await repository.getSavedPlan(id);
  if (plan === null) notFound();

  const resolvedItems = await resolvePlanItems(plan.items, repository);
  const rows = resolvedItems.map(toTimelineRow);

  return (
    <>
      <AppHeader title={plan.title} backHref="/plans" />
      <PageShell>
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-[24px] leading-snug text-ink">{plan.title}</h1>
            {plan.date !== null ? (
              <p className="text-[13px] text-ink-muted">{formatDateLabel(plan.date)}</p>
            ) : null}
          </div>

          <Timeline rows={rows} />

          <DeletePlanButton planId={id} />
        </div>
      </PageShell>
    </>
  );
}
