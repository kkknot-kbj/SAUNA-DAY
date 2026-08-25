import { notFound } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { PlanQuestions } from '@/components/plan/PlanQuestions';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRepository } from '@/lib/data';

type NewPlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 5. 休日プラン — ヒアリング画面
 *
 * サウナ選択後、食べたいごはん・体験を2ステップで聞く。
 * 回答を /plans/new/result に渡してプラン生成する。
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

  const isLodging = query.lodging === 'true';

  return (
    <>
      <AppHeader title="休日を作る" backHref={`/saunas/${sauna.slug}`} />
      <PageShell>
        <PlanQuestions slug={sauna.slug} isLodging={isLodging} />
      </PageShell>
    </>
  );
}
