import { notFound } from 'next/navigation';

import { listFavoriteIds } from '@/app/actions';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { CooldownList } from '@/components/sauna/CooldownList';
import { EnvironmentList } from '@/components/sauna/EnvironmentList';
import { FavoriteButton } from '@/components/sauna/FavoriteButton';
import { LinkedPlaceList } from '@/components/sauna/LinkedPlaceList';
import { TagSection } from '@/components/sauna/TagSection';
import { TrackView } from '@/components/sauna/TrackView';
import { LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { Stat, StatList } from '@/components/ui/Stat';
import { getRepository } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';
import {
  formatBusinessHours,
  formatCapacity,
  formatPriceRange,
  formatTempRange,
} from '@/lib/utils/format';

type SaunaPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 4. サウナ詳細
 *
 * 写真を上部の主役に置き、要件10-1 の全項目を表示する。
 * IMPORTANT: 不明な項目は「不明」と表示する。推測値を出さない。
 * 予約URLがない施設では遷移手段を出さない（要件17-4）。
 */
export default async function SaunaPage({ params, searchParams }: SaunaPageProps) {
  const { slug } = await params;
  const query = await searchParams;

  // 遷移元に応じた「戻る」先。デフォルトは検索結果
  const fromParam = typeof query.from === 'string' ? query.from : null;
  const backHref = fromParam ?? '/search/results';

  const repository = getRepository();
  const sauna = await repository.getSaunaBySlug(slug);
  if (sauna === null) notFound();

  const [places, favoriteIds, supabase] = await Promise.all([
    repository.getLinkedPlaces(sauna.id),
    listFavoriteIds(),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = user !== null;
  const isFavorite = favoriteIds.includes(sauna.id);
  const hours = formatBusinessHours(sauna.businessHours);

  return (
    <>
      <AppHeader backHref={backHref} />
      <TrackView slug={slug} />

      <PageShell bleed>
        <div className="flex flex-col gap-10">
          {/* 写真を主役にする */}
          <div className="px-5 pt-2">
            <Photo
              url={sauna.heroImage?.url ?? null}
              alt={sauna.heroImage?.alt ?? `${sauna.name}の写真`}
              ratio="4/5"
              priority
            />
          </div>

          <div className="flex flex-col gap-3 px-5">
            <p className="text-[13px] text-ink-muted">
              {sauna.prefecture}
              {sauna.area !== null ? ` ${sauna.area}` : ''}
            </p>
            <h1 className="font-serif text-[28px] leading-snug text-ink">{sauna.name}</h1>
            {sauna.description !== null ? (
              <p className="text-[14px] leading-[1.9] text-ink-muted">{sauna.description}</p>
            ) : null}
          </div>

          {/* 主要なCTA。休日づくりが本命なので primary はこちら */}
          <div className="flex flex-col gap-3 px-5">
            <LinkButton href={`/plans/new?sauna=${sauna.slug}`} variant="primary" block>
              <Icon name="Route" size={20} />
              このサウナで休日を作る
            </LinkButton>
            <FavoriteButton
              slug={sauna.slug}
              saunaId={sauna.id}
              isFavorite={isFavorite}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* 基本情報 */}
          <section className="flex flex-col gap-3 px-5">
            <h2 className="text-[15px] text-ink">基本情報</h2>
            <StatList>
              <Stat label="料金" value={formatPriceRange(sauna.priceMin, sauna.priceMax)} />
              {sauna.priceNote !== null ? (
                <Stat label="料金の補足" value={sauna.priceNote} />
              ) : null}
              <Stat label="人数" value={formatCapacity(sauna.capacityMin, sauna.capacityMax)} />
              <Stat
                label="サウナ室温度"
                value={
                  sauna.tempMin === null && sauna.tempMax === null
                    ? null
                    : formatTempRange(sauna.tempMin, sauna.tempMax)
                }
              />
              <Stat label="住所" value={sauna.address} />
              <Stat label="駐車場" value={sauna.parkingNote} />
              <Stat label="電話" value={sauna.phone} />
              <Stat
                label="利用形態"
                value={
                  [
                    sauna.supportsDayTrip ? '日帰り' : null,
                    sauna.supportsLodging ? '宿泊' : null,
                  ]
                    .filter((value): value is string => value !== null)
                    .join(' / ') || null
                }
              />
            </StatList>
          </section>

          {/* 営業時間 */}
          <section className="flex flex-col gap-3 px-5">
            <h2 className="text-[15px] text-ink">営業時間</h2>
            <StatList>
              {hours.map((row) => (
                <Stat key={row.label} label={row.label} value={row.value} />
              ))}
            </StatList>
            {sauna.closedNote !== null ? (
              <p className="text-[13px] text-ink-muted">{sauna.closedNote}</p>
            ) : null}
            {sauna.businessHours?.note !== undefined && sauna.businessHours?.note !== null ? (
              <p className="text-[13px] text-ink-muted">{sauna.businessHours.note}</p>
            ) : null}
          </section>

          {/* サウナ */}
          <section className="flex flex-col gap-6 px-5">
            <h2 className="text-[15px] text-ink">サウナ</h2>
            <TagSection category="sauna_type" tags={sauna.features} />
            <TagSection category="heat_source" tags={sauna.features} />
            <TagSection category="equipment" tags={sauna.features} />
          </section>

          {/* クールダウン。「入れる」もの */}
          <section className="flex flex-col gap-3 px-5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] text-ink">クールダウン</h2>
              <span className="text-[12px] text-ink-faint">実際に入れるもの</span>
            </div>
            <CooldownList cooldowns={sauna.cooldowns} />
          </section>

          {/* 環境。「近くにある・見える」もの */}
          <section className="flex flex-col gap-3 px-5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-[15px] text-ink">自然環境</h2>
              <span className="text-[12px] text-ink-faint">近くにある・見える自然</span>
            </div>
            <EnvironmentList environments={sauna.environments} />
          </section>

          {/* 外気浴・体験・貸切・利用条件・アクセス */}
          <section className="flex flex-col gap-6 px-5">
            <h2 className="text-[15px] text-ink">過ごし方</h2>
            <TagSection category="outdoor_bath" tags={sauna.features} />
            <TagSection category="experience" tags={sauna.experiences} />
            <TagSection category="privacy" tags={sauna.features} title="貸切・プライベート性" />
            <TagSection category="usage" tags={sauna.features} />
            <TagSection category="access" tags={sauna.features} />
          </section>

          {/* 周辺施設。サウナ本体より下位の扱い */}
          <div className="px-5">
            <LinkedPlaceList places={places} />
          </div>

          {/* 予約は外部の公式ページへ。URLがなければ何も出さない */}
          <div className="flex flex-col gap-3 px-5">
            {sauna.reservationUrl !== null ? (
              <LinkButton href={sauna.reservationUrl} variant="secondary" block external>
                公式サイトで予約
                <Icon name="ExternalLink" size={16} />
              </LinkButton>
            ) : (
              <p className="text-[13px] text-ink-faint">
                予約ページの情報がありません。公式サイトをご確認ください。
              </p>
            )}

            {sauna.officialUrl !== null ? (
              <LinkButton href={sauna.officialUrl} variant="quiet" block external>
                公式サイト
                <Icon name="ExternalLink" size={16} />
              </LinkButton>
            ) : null}
          </div>
        </div>
      </PageShell>
    </>
  );
}
