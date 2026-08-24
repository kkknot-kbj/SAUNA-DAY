'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChoiceList } from '@/components/ui/ChoiceList';
import { useConditions } from '@/lib/state/conditions-context';
import { pathWithConditions } from '@/lib/state/conditions-url';

import { StartSummary } from './StartSummary';
import { StepShell } from './StepShell';
import { BUDGET_OPTIONS, COMPANION_OPTIONS, STAY_OPTIONS, TRAVEL_OPTIONS } from './options';

import type { DatePreset } from '@/lib/utils/date';
import type { CompanionType, Origin, StayType } from '@/lib/types';

const TOTAL_STEPS = 6;

/** 同行者タイプから人数の初期値を決める。確認画面で微調整できる */
const PARTY_SIZE_BY_COMPANION: Record<CompanionType, number> = {
  solo: 1,
  couple: 2,
  friends: 4,
  family: 4,
};

/** 自動で次へ進むまでの間。選んだことが見えるだけの短さに留める */
const ADVANCE_DELAY_MS = 260;

type StartFlowProps = {
  origins: Origin[];
  /** サーバー側で算出した日付プリセット（ハイドレーションずれを避ける） */
  datePresets: DatePreset[];
};

/**
 * ホームの条件入力フロー。
 *
 * 1問1画面で進める。必須条件のうち「休日の枠」を決める6項目を扱う。
 * 貸切などサウナ側の絶対条件は次の条件設定画面に置く。
 *
 * IMPORTANT: すべて任意。未入力でも先へ進める（要件1-4）。
 * 単一選択のステップは選択後に自動で進み、タップ数を減らす。
 */
export function StartFlow({ origins, datePresets }: StartFlowProps) {
  const router = useRouter();
  const {
    conditions,
    setDate,
    setPartySize,
    setOrigin,
    setTravelMinutes,
    setStayType,
    setBudget,
    setRequired,
  } = useConditions();

  // 1..TOTAL_STEPS がステップ、TOTAL_STEPS + 1 が確認画面
  const [step, setStep] = useState(1);
  const [showCustomDate, setShowCustomDate] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) clearTimeout(timer.current);
    };
  }, []);

  const goNext = useCallback(() => {
    setStep((current) => Math.min(current + 1, TOTAL_STEPS + 1));
  }, []);

  const goBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 1));
  }, []);

  /** 選択を反映してから少し置いて次へ。押した実感を残す */
  const selectAndAdvance = useCallback(
    (apply: () => void) => {
      apply();
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = setTimeout(goNext, ADVANCE_DELAY_MS);
    },
    [goNext],
  );

  const { required } = conditions;

  const proceed = useCallback(() => {
    router.push(pathWithConditions('/search/conditions', conditions));
  }, [router, conditions]);

  if (step > TOTAL_STEPS) {
    return (
      <StartSummary
        conditions={conditions}
        origins={origins}
        onEdit={(target) => {
          setShowCustomDate(false);
          setStep(target);
        }}
        onPartySizeChange={setPartySize}
        onProceed={proceed}
      />
    );
  }

  const shared = {
    step,
    total: TOTAL_STEPS,
    onBack: step === 1 ? null : goBack,
    onSkip: goNext,
  };

  return (
    // key でステップごとに再マウントし、控えめな出現アニメーションを当てる
    <div key={step} className="step-enter">
      {step === 1 ? (
        <StepShell
          {...shared}
          question="いつ行く？"
          hint="あとから変えられます"
          onNext={showCustomDate ? goNext : null}
        >
          <ChoiceList
            label="日付"
            choices={[
              ...datePresets.map((preset) => ({ value: preset.date, label: preset.label })),
              { value: 'custom', label: '日付を選ぶ', icon: 'Calendar' },
            ]}
            value={
              showCustomDate
                ? 'custom'
                : (datePresets.find((preset) => preset.date === required.date)?.date ?? null)
            }
            onSelect={(value) => {
              if (value === 'custom') {
                setShowCustomDate(true);
                return;
              }
              setShowCustomDate(false);
              selectAndAdvance(() => setDate(value));
            }}
          />

          {showCustomDate ? (
            <input
              type="date"
              value={required.date ?? ''}
              onChange={(event) =>
                setDate(event.target.value === '' ? null : event.target.value)
              }
              className="nums min-h-[52px] w-full rounded-md border border-line bg-base px-4 text-[16px] text-ink"
            />
          ) : null}
        </StepShell>
      ) : null}

      {step === 2 ? (
        <StepShell {...shared} question="誰と行く？" hint="人数はあとで調整できます">
          <ChoiceList
            label="誰と行く"
            choices={COMPANION_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              icon: option.icon,
            }))}
            value={required.companion}
            onSelect={(value) =>
              selectAndAdvance(() => {
                // 同行者タイプから人数の初期値も入れる
                setRequired({
                  companion: value as CompanionType,
                  partySize: PARTY_SIZE_BY_COMPANION[value as CompanionType],
                });
              })
            }
          />
        </StepShell>
      ) : null}

      {step === 3 ? (
        <StepShell {...shared} question="どこから行く？" hint="所要時間の目安を出します">
          <ChoiceList
            label="出発地"
            choices={origins.map((origin) => ({ value: origin.key, label: origin.labelJa }))}
            value={required.originKey}
            onSelect={(value) => selectAndAdvance(() => setOrigin(value))}
          />
        </StepShell>
      ) : null}

      {step === 4 ? (
        <StepShell {...shared} question="日帰り？ 泊まる？">
          <ChoiceList
            label="日帰りか宿泊か"
            choices={STAY_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
              icon: option.icon,
            }))}
            value={required.stayType}
            onSelect={(value) => selectAndAdvance(() => setStayType(value as StayType))}
          />
        </StepShell>
      ) : null}

      {step === 5 ? (
        <StepShell {...shared} question="どこまで行ける？" hint="片道の移動時間">
          <ChoiceList
            label="移動時間"
            choices={TRAVEL_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={required.maxTravelMinutes}
            onSelect={(value) => selectAndAdvance(() => setTravelMinutes(value))}
          />
        </StepShell>
      ) : null}

      {step === 6 ? (
        <StepShell {...shared} question="予算は？" hint="1人あたり">
          <ChoiceList
            label="予算"
            choices={BUDGET_OPTIONS.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            value={required.budgetMax}
            onSelect={(value) => selectAndAdvance(() => setBudget(value))}
          />
        </StepShell>
      ) : null}
    </div>
  );
}
