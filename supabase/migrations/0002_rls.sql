-- ============================================================
-- RLS (Row Level Security) 設定
-- design.md §2.4 に準拠
--
-- 施設系テーブル: anon に select 許可（未登録で検索できる要件 15-7）
-- ユーザー系テーブル: 本人のみ全操作
-- ============================================================

-- ============ 施設系・マスタ: 全員読み取り可 ============

alter table taxonomy_terms enable row level security;
create policy "全員が読み取り可能" on taxonomy_terms
  for select using (true);

alter table search_weights enable row level security;
create policy "全員が読み取り可能" on search_weights
  for select using (true);

alter table origins enable row level security;
create policy "全員が読み取り可能" on origins
  for select using (true);

alter table saunas enable row level security;
create policy "全員が読み取り可能" on saunas
  for select using (true);

alter table sauna_images enable row level security;
create policy "全員が読み取り可能" on sauna_images
  for select using (true);

alter table sauna_features enable row level security;
create policy "全員が読み取り可能" on sauna_features
  for select using (true);

alter table sauna_environments enable row level security;
create policy "全員が読み取り可能" on sauna_environments
  for select using (true);

alter table sauna_cooldowns enable row level security;
create policy "全員が読み取り可能" on sauna_cooldowns
  for select using (true);

alter table sauna_experiences enable row level security;
create policy "全員が読み取り可能" on sauna_experiences
  for select using (true);

alter table restaurants enable row level security;
create policy "全員が読み取り可能" on restaurants
  for select using (true);

alter table sauna_restaurants enable row level security;
create policy "全員が読み取り可能" on sauna_restaurants
  for select using (true);

alter table spots enable row level security;
create policy "全員が読み取り可能" on spots
  for select using (true);

alter table sauna_spots enable row level security;
create policy "全員が読み取り可能" on sauna_spots
  for select using (true);

alter table hotels enable row level security;
create policy "全員が読み取り可能" on hotels
  for select using (true);

alter table sauna_hotels enable row level security;
create policy "全員が読み取り可能" on sauna_hotels
  for select using (true);

-- ============ ユーザー系: 本人のみ ============

alter table profiles enable row level security;
create policy "本人のみ読み取り" on profiles
  for select using (auth.uid() = id);
create policy "本人のみ更新" on profiles
  for update using (auth.uid() = id);

alter table favorites enable row level security;
create policy "本人のみ読み取り" on favorites
  for select using (auth.uid() = user_id);
create policy "本人のみ挿入" on favorites
  for insert with check (auth.uid() = user_id);
create policy "本人のみ削除" on favorites
  for delete using (auth.uid() = user_id);

alter table saved_plans enable row level security;
create policy "本人のみ読み取り" on saved_plans
  for select using (auth.uid() = user_id);
create policy "本人のみ挿入" on saved_plans
  for insert with check (auth.uid() = user_id);
create policy "本人のみ削除" on saved_plans
  for delete using (auth.uid() = user_id);

alter table plan_items enable row level security;
-- plan_items は親プランの所有者で判定する
create policy "プラン所有者のみ読み取り" on plan_items
  for select using (
    exists (
      select 1 from saved_plans
      where saved_plans.id = plan_items.plan_id
        and saved_plans.user_id = auth.uid()
    )
  );
create policy "プラン所有者のみ挿入" on plan_items
  for insert with check (
    exists (
      select 1 from saved_plans
      where saved_plans.id = plan_items.plan_id
        and saved_plans.user_id = auth.uid()
    )
  );
create policy "プラン所有者のみ削除" on plan_items
  for delete using (
    exists (
      select 1 from saved_plans
      where saved_plans.id = plan_items.plan_id
        and saved_plans.user_id = auth.uid()
    )
  );
