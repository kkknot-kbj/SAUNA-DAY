import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { ConditionsForm } from '@/components/search/ConditionsForm';
import { getRepository } from '@/lib/data';
import { ConditionsProvider } from '@/lib/state/conditions-context';
import { conditionsFromQuery } from '@/lib/state/conditions-url';

type ConditionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** 2. 条件設定 */
export default async function ConditionsPage({ searchParams }: ConditionsPageProps) {
  const query = await searchParams;
  const initial = conditionsFromQuery(query);

  const origins = await getRepository().listOrigins();

  return (
    <>
      <AppHeader title="条件を選ぶ" backHref="/" />
      <PageShell>
        <ConditionsProvider initial={initial}>
          <ConditionsForm origins={origins} />
        </ConditionsProvider>
      </PageShell>
    </>
  );
}
