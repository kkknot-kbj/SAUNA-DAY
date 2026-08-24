'use client';

import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { setPendingFavorite } from '@/lib/state/guest-storage';

/**
 * 「行きたい」に保存する。
 *
 * ゲスト状態では認証を求める（要件13-2）。
 * 認証後に保存を完了させるため、対象を端末側に記憶しておく（要件13-3）。
 *
 * 実際の保存は Phase 3 で接続する。
 */
export function FavoriteButton({ slug }: { slug: string }) {
  const router = useRouter();

  return (
    <Button
      variant="secondary"
      block
      onClick={() => {
        setPendingFavorite(slug);
        router.push(`/auth?next=${encodeURIComponent(`/saunas/${slug}`)}`);
      }}
    >
      <Icon name="Bookmark" size={20} />
      行きたいに保存
    </Button>
  );
}
