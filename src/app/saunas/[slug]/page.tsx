import { notFound } from 'next/navigation';

import { listFavoriteIds } from '@/app/actions';
import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { AmenityList } from '@/components/sauna/AmenityList';
import { BbqSection } from '@/components/sauna/BbqSection';
import { CooldownList } from '@/components/sauna/CooldownList';
import { EnvironmentList } from '@/components/sauna/EnvironmentList';
import { FavoriteButton } from '@/components/sauna/FavoriteButton';
import { LinkedPlaceList } from '@/components/sauna/LinkedPlaceList';
import { SaunaSpec } from '@/components/sauna/SaunaSpec';
import { TagSection } from '@/components/sauna/TagSection';
import { TrackView } from '@/components/sauna/TrackView';
import { LinkButton } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Photo } from '@/components/ui/Photo';
import { Stat, StatList } from '@/components/ui/Stat';
import { Tabs } from '@/components/ui/Tabs';
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
  const saunaTemp =
    sauna.tempMin === null && sauna.tempMax === null
      ? null
      : formatTempRange(sauna.tempMin, sauna.tempMax);

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

            {/* 宿泊の要点を一目で。料金は1棟あたり、定員を併記 */}
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pt-1">
              <span className="nums text-[17px] text-ink">
                {formatPriceRange(sauna.priceMin, sauna.priceMax)}
              </span>
              <span className="text-[13px] text-ink-muted">
                {sauna.priceNote ?? '1棟あたり'}
              </span>
              <span className="text-[13px] text-ink-muted">
                定員 {formatCapacity(sauna.capacityMin, sauna.capacityMax)}
              </span>
            </div>

            {sauna.description !== null ? (
              <p className="text-[14px] leading-[1.9] text-ink-muted">{sauna.description}</p>
            ) : null}
          </div>

          {/* 主要なCTA。予約への送客が本命。予約URLがなければ公式サイトへ */}
          <div className="flex flex-col gap-3 px-5">
            {sauna.reservationUrl !== null ? (
              <LinkButton href={sauna.reservationUrl} variant="primary" block external>
                空き状況を見る・予約
                <Icon name="ExternalLink" size={16} />
              </LinkButton>
            ) : sauna.officialUrl !== null ? (
              <LinkButton href={sauna.officialUrl} variant="primary" block external>
                公式サイトで見る
                <Icon name="ExternalLink" size={16} />
              </LinkButton>
            ) : null}
            <FavoriteButton
              slug={sauna.slug}
              saunaId={sauna.id}
              isFavorite={isFavorite}
              isAuthenticated={isAuthenticated}
            />
          </div>

          {/* タブで サウナ / BBQ・設備 / 宿泊情報 を切り替える */}
          <div className="px-5">
            <Tabs
              tabs={[
                {
                  key: 'sauna',
                  label: 'サウナ',
                  content: (
                    <div className="flex flex-col gap-8">
                      {/* 主要スペック（タイプ・熱源・温度ゲージ） */}
                      <SaunaSpec
                        tempMin={sauna.tempMin}
                        tempMax={sauna.tempMax}
                        features={sauna.features}
                        cooldowns={sauna.cooldowns}
                      />

                      {/* サウナ設備 */}
                      <section className="flex flex-col gap-6">
                        <TagSection category="equipment" tags={sauna.features} />
                      </section>

                      {/* クールダウン。「入れる」もの */}
                      <section className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-[15px] text-ink">クールダウン</h3>
                          <span className="text-[12px] text-ink-faint">実際に入れるもの</span>
                        </div>
                        <CooldownList cooldowns={sauna.cooldowns} />
                      </section>

                      {/* 環境。「近くにある・見える」もの */}
                      <section className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-2">
                          <h3 className="text-[15px] text-ink">自然環境</h3>
                          <span className="text-[12px] text-ink-faint">近くにある・見える自然</span>
                        </div>
                        <EnvironmentList environments={sauna.environments} />
                      </section>

                      {/* 外気浴・体験 */}
                      <section className="flex flex-col gap-6">
                        <TagSection category="outdoor_bath" tags={sauna.features} />
                        <TagSection category="experience" tags={sauna.experiences} />
                      </section>
                    </div>
                  ),
                },
                {
                  key: 'bbq',
                  label: 'BBQ・設備',
                  content: (
                    <div className="flex flex-col gap-8">
                      <BbqSection bbq={sauna.bbq} />

                      {/* 宿の設備 */}
                      <section className="flex flex-col gap-3">
                        <h3 className="text-[15px] text-ink">設備・アメニティ</h3>
                        <AmenityList amenities={sauna.lodging?.amenities ?? []} />
                      </section>

                      {/* 貸切・利用条件 */}
                      <section className="flex flex-col gap-6">
                        <TagSection
                          category="privacy"
                          tags={sauna.features}
                          title="貸切・プライベート性"
                        />
                        <TagSection category="usage" tags={sauna.features} />
                      </section>
                    </div>
                  ),
                },
                {
                  key: 'lodging',
                  label: '宿泊情報',
                  content: (
                    <div className="flex flex-col gap-8">
                      {/* 宿泊の基本情報 */}
                      <StatList>
                        <Stat
                          label="料金"
                          value={formatPriceRange(sauna.priceMin, sauna.priceMax)}
                          note={sauna.priceNote ?? '1棟あたり'}
                        />
                        <Stat
                          label="定員"
                          value={formatCapacity(sauna.capacityMin, sauna.capacityMax)}
                        />
                        {sauna.lodging !== null ? (
                          <>
                            <Stat
                              label="宿泊人数"
                              value={
                                sauna.lodging.maxGuests === null
                                  ? null
                                  : `最大${sauna.lodging.maxGuests}名`
                              }
                            />
                            <Stat label="チェックイン" value={sauna.lodging.checkIn} />
                            <Stat label="チェックアウト" value={sauna.lodging.checkOut} />
                            <Stat
                              label="セルフチェックイン"
                              value={
                                sauna.lodging.selfCheckIn === null
                                  ? null
                                  : sauna.lodging.selfCheckIn
                                    ? '対応'
                                    : '非対応（対面）'
                              }
                            />
                            {sauna.lodging.stayNote !== null ? (
                              <Stat label="宿泊の補足" value={sauna.lodging.stayNote} />
                            ) : null}
                          </>
                        ) : null}
                        <Stat label="サウナ室温度" value={saunaTemp} />
                        <Stat label="住所" value={sauna.address} />
                        <Stat label="駐車場" value={sauna.parkingNote} />
                        <Stat label="電話" value={sauna.phone} />
                      </StatList>

                      {/* アクセス */}
                      <section className="flex flex-col gap-3">
                        <h3 className="text-[15px] text-ink">アクセス</h3>
                        <TagSection category="access" tags={sauna.features} />
                      </section>

                      {/* 日帰り施設のときだけ営業時間を出す。宿は営業時間の概念が薄い */}
                      {sauna.supportsDayTrip && !sauna.supportsLodging ? (
                        <section className="flex flex-col gap-3">
                          <h3 className="text-[15px] text-ink">営業時間</h3>
                          <StatList>
                            {hours.map((row) => (
                              <Stat key={row.label} label={row.label} value={row.value} />
                            ))}
                          </StatList>
                          {sauna.closedNote !== null ? (
                            <p className="text-[13px] text-ink-muted">{sauna.closedNote}</p>
                          ) : null}
                        </section>
                      ) : null}
                    </div>
                  ),
                },
              ]}
            />
          </div>

          {/* 周辺施設。サウナ本体より下位の扱い */}
          <div className="px-5">
            <LinkedPlaceList places={places} />
          </div>

          {/* 予約・公式サイトへの補助導線。主要CTAは上部にある */}
          <div className="flex flex-col gap-3 px-5">
            {sauna.reservationUrl !== null && sauna.officialUrl !== null ? (
              <LinkButton href={sauna.officialUrl} variant="quiet" block external>
                公式サイト
                <Icon name="ExternalLink" size={16} />
              </LinkButton>
            ) : null}
            {sauna.reservationUrl === null && sauna.officialUrl === null ? (
              <p className="text-[13px] text-ink-faint">
                予約・公式サイトの情報がありません。
              </p>
            ) : null}

            {/* 翌日の過ごし方は補助機能として控えめに置く */}
            <LinkButton href={`/plans/new?sauna=${sauna.slug}`} variant="quiet" block>
              <Icon name="Route" size={16} />
              泊まった翌日の過ごし方を見る
            </LinkButton>
          </div>
        </div>
      </PageShell>
    </>
  );
}
