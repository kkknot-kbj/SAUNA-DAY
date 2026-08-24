'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import { Field, Section } from '@/components/ui/Field';
import { Icon } from '@/components/ui/Icon';
import { OptionRow } from '@/components/ui/OptionRow';
import { Stepper } from '@/components/ui/Stepper';
import { useConditions } from '@/lib/state/conditions-context';
import { pathWithConditions } from '@/lib/state/conditions-url';
import { ADVANCED_CATEGORIES, WISH_CATEGORIES } from '@/lib/taxonomy/terms';

import { ChipGroup } from './ChipGroup';
import { ResultCount } from './ResultCount';
import { SelectedConditions } from './SelectedConditions';
import { BUDGET_OPTIONS, COMPANION_OPTIONS, STAY_OPTIONS, TRAVEL_OPTIONS } from './options';

import type { Origin } from '@/lib/types';

/**
 * 2. 条件設定
 *
 * 休日の枠（必須条件）とサウナの条件を分けて置く。
 *
 * IMPORTANT: サウナの条件は必須 / 希望を**タグ単位**で決める。
 * 「川は必須、薪は希望」のような指定ができるようにするため、
 * カテゴリごとに必須・希望を分けない（要件2-6）。
 *
 * 詳細条件は「条件を追加」を操作したときにだけ出す（要件2-3, 2-4）。
 */
export function ConditionsForm({ origins }: { origins: Origin[] }) {
  const router = useRouter();
  const {
    conditions,
    setDate,
    setPartySize,
    setCompanion,
    setOrigin,
    setTravelMinutes,
    setStayType,
    setBudget,
    levelOf,
    cycleTag,
    setTagLevel,
    mustTags,
    wishTags,
    reset,
  } = useConditions();

  const { required } = conditions;
  const originOptions = origins.map((origin) => ({ value: origin.key, label: origin.labelJa }));

  return (
    <div className="flex flex-col gap-12">
      {/* ── 休日の枠 */}
      <Section title="休日の枠" hint="満たさない施設は表示しません">
        <div className="flex flex-col gap-7">
          <Field label="日付">
            <input
              type="date"
              value={required.date ?? ''}
              onChange={(event) => setDate(event.target.value === '' ? null : event.target.value)}
              className="nums min-h-[44px] w-full rounded-sm border border-line bg-base px-3 text-[15px] text-ink"
            />
          </Field>

          <Field label="人数">
            <Stepper
              label="人数"
              value={required.partySize}
              onChange={setPartySize}
              unit="人"
              min={1}
              max={20}
            />
          </Field>

          <Field label="誰と行く">
            <OptionRow
              label="誰と行く"
              options={COMPANION_OPTIONS}
              value={required.companion}
              onChange={setCompanion}
            />
          </Field>

          <Field label="出発地">
            <OptionRow
              label="出発地"
              options={originOptions}
              value={required.originKey}
              onChange={setOrigin}
            />
          </Field>

          <Field label="移動時間">
            <OptionRow
              label="移動時間"
              options={TRAVEL_OPTIONS}
              value={required.maxTravelMinutes}
              onChange={setTravelMinutes}
            />
          </Field>

          <Field label="日帰り / 宿泊">
            <OptionRow
              label="日帰りか宿泊か"
              options={STAY_OPTIONS}
              value={required.stayType}
              onChange={setStayType}
            />
          </Field>

          <Field label="予算" hint="1人あたり">
            <OptionRow
              label="予算"
              options={BUDGET_OPTIONS}
              value={required.budgetMax}
              onChange={setBudget}
            />
          </Field>
        </div>
      </Section>

      {/* ── サウナの条件。必須/希望はタグ単位 */}
      <Section title="サウナの条件">
        <div className="flex flex-col gap-7">
          {/* 3状態の操作方法を1行で伝える */}
          <div className="flex flex-col gap-2 rounded-md border border-line bg-base px-4 py-3">
            <p className="text-[13px] text-ink">
              タップすると
              <span className="mx-1 inline-flex items-center gap-1 rounded-sm border-2 border-accent bg-accent-weak px-1.5 text-accent">
                <Icon name="Check" size={16} />
                希望
              </span>
              、もう一度タップで
              <span className="mx-1 inline-flex items-center gap-1 rounded-sm bg-accent px-1.5 text-base">
                <Icon name="Lock" size={16} />
                必須
              </span>
            </p>
            <p className="text-[12px] text-ink-muted">
              「川に入れるのは絶対」のような外せない条件は必須にしてください。
            </p>
          </div>

          {WISH_CATEGORIES.map((category) => (
            <ChipGroup
              key={category}
              category={category}
              levelOf={levelOf}
              onCycle={cycleTag}
            />
          ))}
        </div>
      </Section>

      {/* ── 選択中の条件。カテゴリを跨いで確認・入れ替えできる */}
      <SelectedConditions
        mustTags={mustTags}
        wishTags={wishTags}
        onDowngrade={(tag) => setTagLevel(tag, 'wish')}
        onUpgrade={(tag) => setTagLevel(tag, 'must')}
        onClear={(tag) => setTagLevel(tag, 'none')}
      />

      {/* ── 詳細条件。最初は隠す */}
      <Disclosure label="条件を追加" openLabel="詳細条件を閉じる">
        <div className="flex flex-col gap-7 pt-4">
          {/* 詳細条件専用のカテゴリは全項目を出す */}
          {ADVANCED_CATEGORIES.map((category) => (
            <ChipGroup
              key={category}
              category={category}
              levelOf={levelOf}
              onCycle={cycleTag}
              mode="all"
            />
          ))}

          {/* 上で出した希望条件カテゴリのうち、詳細寄りの項目だけ。重複させない */}
          {WISH_CATEGORIES.map((category) => (
            <ChipGroup
              key={`advanced-${category}`}
              category={category}
              levelOf={levelOf}
              onCycle={cycleTag}
              mode="advanced"
            />
          ))}
        </div>
      </Disclosure>

      <div className="sticky bottom-0 -mx-5 flex flex-col gap-3 border-t border-line bg-surface px-5 pb-4 pt-4">
        <ResultCount />
        <Button
          block
          onClick={() => router.push(pathWithConditions('/search/results', conditions))}
        >
          この条件で探す
        </Button>
        <Button variant="quiet" onClick={reset}>
          条件をすべて外す
        </Button>
      </div>
    </div>
  );
}
