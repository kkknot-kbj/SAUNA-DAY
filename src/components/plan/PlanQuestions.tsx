'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

import { ChoiceList } from '@/components/ui/ChoiceList';
import { StepShell } from '@/components/search/StepShell';

/** 出発時間の選択肢 */
const DEPARTURE_CHOICES = [
  { value: '07:00', label: '早朝（7:00）', icon: 'Sunrise' },
  { value: '09:00', label: '朝（9:00）', icon: 'Sun' },
  { value: '11:00', label: '昼前（11:00）', icon: 'Clock' },
  { value: '14:00', label: '午後（14:00）', icon: 'Sunset' },
] as const;

/** 食事ジャンルの選択肢 */
const MEAL_CHOICES = [
  { value: '和食', label: '和食', icon: 'Soup' },
  { value: '海鮮', label: '海鮮', icon: 'Fish' },
  { value: '定食', label: 'がっつり定食', icon: 'UtensilsCrossed' },
  { value: 'カフェ', label: 'カフェ・軽食', icon: 'Coffee' },
  { value: '蕎麦', label: '蕎麦・うどん', icon: 'Wheat' },
  { value: '肉', label: '肉料理', icon: 'Beef' },
] as const;

/** 体験の選択肢 */
const EXPERIENCE_CHOICES = [
  { value: 'sightseeing', label: '景色を楽しむ・のんびり観光', icon: 'Mountain' },
  { value: 'activity', label: 'アクティブに体を動かす', icon: 'Bike' },
  { value: 'none', label: '食事だけでいい', icon: 'Coffee' },
] as const;

type PlanQuestionsProps = {
  /** サウナのslug。プラン生成URLに含める */
  slug: string;
  /** 宿泊フラグ（前画面から引き継ぐ） */
  isLodging: boolean;
};

/**
 * プラン生成前の3ステップヒアリング。
 *
 * 1. 何時に出発する？
 * 2. 食べたいごはん
 * 3. どんな体験をしたいか
 *
 * 選択後260msで自動遷移。「指定せず進む」でスキップ可能。
 * 回答を searchParams としてプラン生成ページに渡す。
 */
export function PlanQuestions({ slug, isLodging }: PlanQuestionsProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [departure, setDeparture] = useState<string | null>(null);
  const [meal, setMeal] = useState<string | null>(null);
  const [experience, setExperience] = useState<string | null>(null);

  /** プラン生成ページへ遷移 */
  const navigateToPlan = useCallback(
    (mealVal: string | null, expVal: string | null) => {
      const params = new URLSearchParams();
      params.set('sauna', slug);
      if (isLodging) params.set('lodging', 'true');
      if (departure) params.set('departure', departure);
      if (mealVal) params.set('meal', mealVal);
      if (expVal) params.set('experience', expVal);
      router.push(`/plans/new/result?${params.toString()}`);
    },
    [slug, isLodging, departure, router],
  );

  /** Step 1 完了 → Step 2 へ */
  const completeStep1 = useCallback(
    (value: string | null) => {
      setDeparture(value);
      setStep(2);
    },
    [],
  );

  /** Step 2 完了 → Step 3 へ */
  const completeStep2 = useCallback(
    (value: string | null) => {
      setMeal(value);
      setStep(3);
    },
    [],
  );

  /** Step 3 完了 → プラン生成へ */
  const completeStep3 = useCallback(
    (value: string | null) => {
      setExperience(value);
      navigateToPlan(meal, value);
    },
    [meal, navigateToPlan],
  );

  if (step === 1) {
    return (
      <StepShell
        step={1}
        total={3}
        question="何時ごろ出発する？"
        hint="時間に合わせてプランを組みます"
        onBack={null}
        onSkip={() => completeStep1(null)}
      >
        <ChoiceList
          label="出発時間"
          choices={DEPARTURE_CHOICES}
          value={departure}
          onSelect={(v) => {
            setDeparture(v);
            setTimeout(() => completeStep1(v), 260);
          }}
        />
      </StepShell>
    );
  }

  if (step === 2) {
    return (
      <StepShell
        step={2}
        total={3}
        question="サウナの後、何を食べたい？"
        hint="候補の中から近い店を選びます"
        onBack={() => setStep(1)}
        onSkip={() => completeStep2(null)}
      >
        <ChoiceList
          label="食べたいごはん"
          choices={MEAL_CHOICES}
          value={meal}
          onSelect={(v) => {
            setMeal(v);
            setTimeout(() => completeStep2(v), 260);
          }}
        />
      </StepShell>
    );
  }

  return (
    <StepShell
      step={3}
      total={3}
      question="サウナ以外に何をしたい？"
      hint="食事の前後に組み込みます"
      onBack={() => setStep(2)}
      onSkip={() => completeStep3(null)}
    >
      <ChoiceList
        label="体験の希望"
        choices={EXPERIENCE_CHOICES}
        value={experience}
        onSelect={(v) => {
          setExperience(v);
          setTimeout(() => completeStep3(v), 260);
        }}
      />
    </StepShell>
  );
}
