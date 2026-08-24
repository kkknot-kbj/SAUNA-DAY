import { notFound } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { getRepository } from '@/lib/data';

type PlanPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * 保存プランの詳細。
 *
 * Phase 6 で実装する。
 * IMPORTANT: 表示時に refId から施設情報をDBで解決すること（要件14-6）。
 * 保存時のテキストをそのまま出さない。
 */
export default async function PlanPage({ params }: PlanPageProps) {
  const { id } = await params;
  const plan = await getRepository().getSavedPlan(id);
  if (plan === null) notFound();

  return (
    <>
      <AppHeader title={plan.title} backHref="/plans" />
      <PageShell>
        <p className="text-[13px] text-ink-muted">{plan.title}</p>
      </PageShell>
    </>
  );
}
