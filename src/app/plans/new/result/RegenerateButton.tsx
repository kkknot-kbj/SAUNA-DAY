'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { Icon } from '@/components/ui/Icon';

/**
 * 「別のプランを見る」ボタン。
 *
 * 同じ条件でサーバーを再リクエストし、AI に別パターンを生成させる。
 * router.refresh() でサーバーコンポーネントを再実行する。
 */
export function RegenerateButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          router.refresh();
        });
      }}
      className={[
        'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md border border-line px-5 text-[15px] transition-colors',
        isPending
          ? 'cursor-wait text-ink-faint'
          : 'text-ink-muted hover:border-accent hover:text-accent',
      ].join(' ')}
    >
      <Icon
        name="RefreshCw"
        size={16}
        className={isPending ? 'animate-spin' : ''}
      />
      {isPending ? '組み立て中...' : '別のプランを見る'}
    </button>
  );
}
