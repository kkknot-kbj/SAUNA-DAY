import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from './types';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server Component / Server Action / Route Handler 向けの Supabase クライアント。
 *
 * Next.js の `cookies()` を使ってセッション管理する。
 * IMPORTANT: サービスロールキーは使わない。anon key のみ。
 */
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component からの呼び出し時は set できない。
            // 認証が必要な操作は Server Action / Route Handler で行う。
          }
        },
      },
    },
  );
}
