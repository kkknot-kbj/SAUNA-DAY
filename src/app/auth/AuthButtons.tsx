'use client';

import { useCallback } from 'react';

import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/browser';

type AuthButtonsProps = {
  /** 認証後に遷移する先（コールバックで next パラメータとして渡す） */
  redirectTo: string;
};

/**
 * Apple / Google サインインボタン。
 *
 * IMPORTANT: メール/パスワードは MVP では提供しない（要件15-3）。
 */
export function AuthButtons({ redirectTo }: AuthButtonsProps) {
  const signIn = useCallback(
    async (provider: 'apple' | 'google') => {
      const supabase = createClient();
      const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`;

      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      });
    },
    [redirectTo],
  );

  return (
    <div className="flex flex-col gap-3">
      <Button variant="secondary" block onClick={() => signIn('apple')}>
        Appleで続ける
      </Button>
      <Button variant="secondary" block onClick={() => signIn('google')}>
        Googleで続ける
      </Button>
    </div>
  );
}
