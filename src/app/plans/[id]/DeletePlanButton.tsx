'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { deletePlan } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

/**
 * プラン削除ボタン。確認なしで即削除する。
 * IMPORTANT: 破壊的操作なのでスタイルは quiet に。
 */
export function DeletePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="quiet"
      block
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await deletePlan(planId);
          router.push('/plans');
        });
      }}
    >
      <Icon name="Trash2" size={16} />
      {isPending ? '削除しています...' : 'このプランを削除'}
    </Button>
  );
}
