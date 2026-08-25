'use client';

import { useCallback, useOptimistic, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { addFavorite, removeFavorite } from '@/app/actions';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { setPendingFavorite } from '@/lib/state/guest-storage';

type FavoriteButtonProps = {
  /** サウナの slug（ゲスト導線用） */
  slug: string;
  /** サウナの ID（DB操作用）。未認証時は null */
  saunaId: string | null;
  /** 現在保存済みか。未認証なら false */
  isFavorite: boolean;
  /** 認証済みかどうか */
  isAuthenticated: boolean;
};

/**
 * 「行きたい」保存/解除ボタン。
 *
 * - 認証済み: トグル動作（保存/解除）。楽観的UIで即座に反映。
 * - 未認証: pendingFavorite を端末に記憶して認証ページへ送る（要件13-2）。
 */
export function FavoriteButton({ slug, saunaId, isFavorite, isAuthenticated }: FavoriteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticFavorite, setOptimistic] = useOptimistic(isFavorite);

  const handleClick = useCallback(() => {
    if (!isAuthenticated || saunaId === null) {
      // ゲスト: 認証ページへ送る
      setPendingFavorite(slug);
      router.push(`/auth?next=${encodeURIComponent(`/saunas/${slug}`)}`);
      return;
    }

    // 認証済み: トランジション内で楽観的にトグル
    startTransition(async () => {
      const nextState = !optimisticFavorite;
      setOptimistic(nextState);

      if (nextState) {
        await addFavorite(saunaId);
      } else {
        await removeFavorite(saunaId);
      }
    });
  }, [isAuthenticated, saunaId, slug, optimisticFavorite, setOptimistic, router]);

  return (
    <Button
      variant={optimisticFavorite ? 'primary' : 'secondary'}
      block
      onClick={handleClick}
      disabled={isPending}
    >
      <Icon name={optimisticFavorite ? 'BookmarkCheck' : 'Bookmark'} size={20} />
      {optimisticFavorite ? '保存済み' : '行きたいに保存'}
    </Button>
  );
}
