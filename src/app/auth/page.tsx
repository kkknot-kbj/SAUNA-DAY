import { redirect } from 'next/navigation';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { LinkButton } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/server';

import { AuthButtons } from './AuthButtons';

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 8. 認証
 *
 * IMPORTANT: 認証手段は Apple と Google の2つのみ。
 * メールアドレス・パスワード入力は MVP では提供しない（要件15-3）。
 * 既にログイン済みなら next へ直接遷移する。
 */
export default async function AuthPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const nextParam = query.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  const redirectTo = next ?? '/';

  // 既に認証済みなら next へ飛ばす
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect(redirectTo);
  }

  // 認証を中断してもゲストとして続けられるようにする（要件15-6）
  const cancelHref = redirectTo;

  return (
    <>
      <AppHeader backHref={cancelHref} />
      <PageShell>
        <div className="flex flex-col gap-12 pt-8">
          <div className="flex flex-col gap-3">
            <h1 className="font-serif text-[26px] leading-snug text-ink">
              行きたいを保存しよう
            </h1>
            <p className="text-[14px] leading-[1.9] text-ink-muted">
              気になったサウナを保存して、あとから見返せます。
            </p>
          </div>

          <AuthButtons redirectTo={redirectTo} />

          <div className="flex flex-col gap-4">
            <LinkButton href={cancelHref} variant="quiet" block>
              今はしない
            </LinkButton>
            <p className="text-[12px] text-ink-faint">
              検索と閲覧は登録なしで使えます。
            </p>
          </div>
        </div>
      </PageShell>
    </>
  );
}
