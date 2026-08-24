import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { Button, LinkButton } from '@/components/ui/Button';

type AuthPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * 8. 認証
 *
 * IMPORTANT: 認証手段は Apple と Google の2つのみ。
 * メールアドレス・パスワード入力は MVP では提供しない（要件15-3）。
 *
 * 実際のサインインは Phase 4 で Supabase Auth に接続する。
 */
export default async function AuthPage({ searchParams }: AuthPageProps) {
  const query = await searchParams;
  const nextParam = query.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;

  // 認証を中断してもゲストとして続けられるようにする（要件15-6）
  const cancelHref = next ?? '/';

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

          {/*
            Apple / Google はサインインボタンに公式マークの使用を求めているため、
            汎用アイコンで代用しない。Phase 4 で公式アセットを入れる。
          */}
          <div className="flex flex-col gap-3">
            <Button variant="secondary" block>
              Appleで続ける
            </Button>
            <Button variant="secondary" block>
              Googleで続ける
            </Button>
          </div>

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
