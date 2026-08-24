import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { SaunaCard } from '@/components/sauna/SaunaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getRepository } from '@/lib/data';

/**
 * 6. 行きたい
 *
 * Phase 1 は保存機能が未接続なので常に空状態。
 * Phase 3 で favorites に接続する。
 *
 * 将来の地域ごとの整理に備え、prefecture でまとめられる構造にしておく。
 */
export default async function FavoritesPage() {
  const repository = getRepository();
  const ids = await repository.listFavoriteSaunaIds();
  const saunas = await repository.getSaunaSummariesByIds(ids);

  // 地域ごとの整理（要件13-6）に向けて県単位でまとめる
  const byPrefecture = new Map<string, typeof saunas>();
  for (const sauna of saunas) {
    const list = byPrefecture.get(sauna.prefecture) ?? [];
    list.push(sauna);
    byPrefecture.set(sauna.prefecture, list);
  }

  return (
    <>
      <AppHeader title="行きたい" />
      <PageShell>
        {saunas.length === 0 ? (
          <EmptyState
            message="まだ保存したサウナはありません"
            action={{ label: 'サウナを探す', href: '/' }}
            icon="Bookmark"
          />
        ) : (
          <div className="flex flex-col gap-12">
            {[...byPrefecture.entries()].map(([prefecture, list]) => (
              <section key={prefecture} className="flex flex-col gap-6">
                <h2 className="text-[13px] text-ink-faint">{prefecture}</h2>
                <ul className="flex flex-col gap-12">
                  {list.map((sauna) => (
                    <li key={sauna.id}>
                      <SaunaCard sauna={sauna} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </PageShell>
    </>
  );
}
