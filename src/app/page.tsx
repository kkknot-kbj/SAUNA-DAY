import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { RecentlyViewed } from '@/components/sauna/RecentlyViewed';
import { StartFlow } from '@/components/search/StartFlow';
import { getRepository } from '@/lib/data';
import { ConditionsProvider } from '@/lib/state/conditions-context';
import { conditionsFromQuery } from '@/lib/state/conditions-url';
import { weekendPresets } from '@/lib/utils/date';

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 1. 探す（ホーム）
 *
 * サウナ付き一棟貸しの検索。メインコピーを最も目立つ要素として置き、
 * 1問1画面で条件を聞く。会員登録・ログインを要求しない。AIへの言及は一切置かない。
 */
export default async function HomePage({ searchParams }: HomePageProps) {
  const query = await searchParams;
  const initial = conditionsFromQuery(query);

  const origins = await getRepository().listOrigins();

  // 「今週末」の算出はサーバー側で行う（クライアントで計算するとハイドレーションがずれる）
  const datePresets = weekendPresets();

  return (
    <>
      <AppHeader />
      <PageShell>
        <ConditionsProvider initial={initial}>
          <div className="flex flex-col gap-10">
            <h1 className="font-serif text-[30px] leading-[1.45] tracking-tight text-ink">
              サウナで選ぶ、
              <br />
              一棟貸しの休日。
            </h1>

            <StartFlow origins={origins} datePresets={datePresets} />

            <RecentlyViewed />
          </div>
        </ConditionsProvider>
      </PageShell>
    </>
  );
}
