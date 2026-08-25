import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

/**
 * ブラウザ（Client Component）向けの Supabase クライアント。
 *
 * Phase 4 以降の認証済みユーザー操作で使用する。
 * Phase 2 時点では直接使わない（データ取得はすべて Server Component）。
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
