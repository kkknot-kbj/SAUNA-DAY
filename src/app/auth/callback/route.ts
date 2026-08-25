import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import type { NextRequest } from 'next/server';

/**
 * OAuth コールバック Route Handler。
 *
 * Supabase Auth の OAuth フローで、プロバイダ認証後にここへリダイレクトされる。
 * URL パラメータの `code` をセッションに交換し、`next` で指定された画面へ遷移する。
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 認証成功 → next パラメータの画面へ
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // 認証失敗 → ホームへ戻す
  return NextResponse.redirect(new URL('/', origin));
}
