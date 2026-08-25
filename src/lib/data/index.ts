import { mockRepository } from './mock-repository';
import { supabaseRepository } from './supabase-repository';

import type { Repository } from './repository';

export type { Repository } from './repository';
export { NotImplementedYetError } from './repository';

/**
 * データアクセスの入口。
 *
 * IMPORTANT: 画面やコンポーネントは必ずここ経由でデータを取る。
 * `@/mock/*` を直接 import してはいけない（Phase 2 の差し替えが効かなくなる）。
 *
 * 環境変数 `NEXT_PUBLIC_DATA_SOURCE` で切り替える:
 * - 'supabase' → Supabase PostgreSQL（Phase 2+）
 * - それ以外（未設定含む） → モックデータ（Phase 1）
 */
export function getRepository(): Repository {
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'supabase') {
    return supabaseRepository;
  }
  return mockRepository;
}
