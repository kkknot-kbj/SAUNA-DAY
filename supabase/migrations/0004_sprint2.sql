-- Sprint 2: 発見・プラン価値・リピート性
-- featured_until / featured_copy: 今月のおすすめ（要件19）
-- is_public: プラン共有（要件21）
-- saved_conditions: 検索条件の保存（要件22）

-- ── saunas: おすすめ表示期間とキャッチコピー
alter table saunas
  add column featured_until date,
  add column featured_copy  text;

comment on column saunas.featured_until is 'この日付まで「今月のおすすめ」に表示。null = 非掲載';
comment on column saunas.featured_copy is 'おすすめカード内のキャッチコピー。null ならエリア名を表示';

-- ── saved_plans: 公開フラグ
alter table saved_plans
  add column is_public boolean not null default false;

comment on column saved_plans.is_public is '共有URL発行時に true。匿名ユーザーに閲覧を許可する';

-- is_public = true のプランは匿名でも閲覧可能
create policy "公開プランは誰でも閲覧可" on saved_plans
  for select using (is_public = true);

-- ── saved_conditions: 保存した検索条件
create table saved_conditions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  label            text not null,
  conditions_json  jsonb not null,
  created_at       timestamptz not null default now()
);

create index idx_saved_conditions_user on saved_conditions (user_id, created_at desc);

alter table saved_conditions enable row level security;

create policy "本人のみ読み取り" on saved_conditions
  for select using (auth.uid() = user_id);

create policy "本人のみ挿入" on saved_conditions
  for insert with check (auth.uid() = user_id);

create policy "本人のみ削除" on saved_conditions
  for delete using (auth.uid() = user_id);
