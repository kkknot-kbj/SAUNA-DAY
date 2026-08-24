import { mockRepository } from './mock-repository';

import type { Repository } from './repository';

export type { Repository } from './repository';
export { NotImplementedYetError } from './repository';

/**
 * データアクセスの入口。
 *
 * IMPORTANT: 画面やコンポーネントは必ずここ経由でデータを取る。
 * `@/mock/*` を直接 import してはいけない（Phase 2 の差し替えが効かなくなる）。
 *
 * Phase 2 で Supabase 実装を追加したら、環境変数で切り替える。
 */
export function getRepository(): Repository {
  return mockRepository;
}
