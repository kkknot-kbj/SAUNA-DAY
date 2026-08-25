'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { savePlan } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

import type { HolidayPlan } from '@/lib/types';

/**
 * プラン保存ボタン。
 * 認証済みなら保存して一覧へ遷移。未認証なら認証ページへ。
 */
export function SavePlanButton({ plan }: { plan: HolidayPlan }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <div className="flex min-h-[44px] items-center justify-center gap-2 rounded-md bg-accent-weak px-5 text-[15px] text-accent">
        <Icon name="Check" size={20} />
        保存しました
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      block
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await savePlan(plan);
            setSaved(true);
            // 短いフィードバックの後にリダイレクト
            setTimeout(() => router.push('/plans'), 800);
          } catch {
            // 未認証の場合
            router.push('/auth?next=/plans');
          }
        });
      }}
    >
      <Icon name="Save" size={20} />
      {isPending ? '保存しています...' : 'このプランを保存'}
    </Button>
  );
}
