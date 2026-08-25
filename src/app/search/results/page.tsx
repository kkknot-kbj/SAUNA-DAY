import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { RelaxSuggestions } from '@/components/search/RelaxSuggestions';
import { WhyRanked } from '@/components/search/WhyRanked';
import { SaunaCard } from '@/components/sauna/SaunaCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { LinkButton } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { getRepository } from '@/lib/data';
import { conditionsFromQuery, pathWithConditions } from '@/lib/state/conditions-url';
import { iconOf, labelOf } from '@/lib/taxonomy/terms';

type ResultsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 3. 検索結果
 *
 * 写真を主役に、余白のあるリストで並べる（カードを敷き詰めない）。
 * 検索は Server Component 側で実行する。
 */
export default async function ResultsPage({ searchParams }: ResultsPageProps) {
  const query = await searchParams;
  const conditions = conditionsFromQuery(query);

  const repository = getRepository();
  const [outcome, origins] = await Promise.all([
    repository.searchSaunas(conditions),
    repository.listOrigins(),
  ]);

  const originLabel =
    origins.find((origin) => origin.key === conditions.required.originKey)?.labelJa ?? null;

  const backHref = pathWithConditions('/search/conditions', conditions);
  const mustTags = conditions.required.absoluteTags;

  return (
    <>
      <AppHeader title="検索結果" backHref={backHref} />
      <PageShell>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-ink-muted">
                <span className="nums text-ink">{outcome.items.length}</span> 件
              </p>
              <LinkButton href={backHref} variant="quiet">
                条件を変える
              </LinkButton>
            </div>

            {/* 何で絞っているかを結果の先頭で示す */}
            {mustTags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-line bg-base px-3 py-2.5">
                <span className="flex items-center gap-1.5 text-[12px] text-accent">
                  <Icon name="Lock" size={16} />
                  必須
                </span>
                {mustTags.map((ref) => (
                  <Tag key={`${ref.category}:${ref.key}`} label={labelOf(ref)} icon={iconOf(ref)} />
                ))}
              </div>
            ) : null}
          </div>

          {/* 0件のときは必ず緩和提示を出す（要件9-5） */}
          {outcome.suggestions.length > 0 ? (
            <RelaxSuggestions suggestions={outcome.suggestions} conditions={conditions} />
          ) : null}

          {outcome.items.length === 0 ? (
            <EmptyState
              message="条件に合うサウナが見つかりませんでした"
              action={{ label: '条件を変える', href: backHref }}
            />
          ) : (
            <ul className="flex flex-col gap-12">
              {outcome.items.map((item, index) => (
                <li key={item.sauna.id} className="flex flex-col gap-2">
                  <SaunaCard
                    sauna={item.sauna}
                    score={item.score}
                    originLabel={originLabel}
                    priority={index === 0}
                  />
                  {index === 0 && item.score.conditionMatch.matched.length > 0 ? (
                    <p className="text-[13px] text-ink-muted">
                      {item.score.conditionMatch.matched
                        .slice(0, 3)
                        .map((ref) => labelOf(ref))
                        .join('・')}
                      に一致
                    </p>
                  ) : null}
                  <WhyRanked score={item.score} mustTags={mustTags} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageShell>
    </>
  );
}
