'use client';

import { useEffect, useRef } from 'react';

import { clearGuestState, loadGuestState } from '@/lib/state/guest-storage';

/**
 * 認証後のゲスト状態移行コンポーネント。
 *
 * レイアウトに配置し、認証済みユーザーがいるときに1回だけ実行する。
 * - pendingFavorite があれば、詳細ページに戻ったときにボタンから保存する導線とする
 * - localStorage のゲスト情報を破棄（要件15-5）
 *
 * 未認証時は何もしない。
 */
export function AuthSync({ isAuthenticated }: { isAuthenticated: boolean }) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || hasRun.current) return;
    hasRun.current = true;

    const state = loadGuestState();

    // pendingFavorite は詳細ページに戻ったときに FavoriteButton が処理する。
    // ここではゲスト情報のクリアのみ行う。
    // ただし pendingFavorite がある場合は、次の画面遷移で使えるよう残す。
    if (!state.pendingFavorite) {
      clearGuestState();
    }
  }, [isAuthenticated]);

  return null;
}
