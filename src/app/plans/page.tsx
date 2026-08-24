import Link from 'next/link';

import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { getRepository } from '@/lib/data';
import { formatDateLabel } from '@/lib/utils/format';

/**
 * 7. 保存プラン
 *
 * Phase 1 は保存機能が未接続なので常に空状態。
 * Phase 6 で saved_plans に接続する。
 */
export default async function PlansPage() {
  const plans = await getRepository().listSavedPlans();

  return (
    <>
      <AppHeader title="プラン" />
      <PageShell>
        {plans.length === 0 ? (
          <EmptyState
            message="まだ保存したプランはありません"
            action={{ label: 'サウナを探す', href: '/' }}
            icon="Route"
          />
        ) : (
          <ul className="flex flex-col">
            {plans.map((plan) => (
              <li key={plan.id ?? plan.title}>
                <Link
                  href={`/plans/${plan.id ?? ''}`}
                  className="flex min-h-[64px] items-center justify-between gap-3 border-b border-line py-4"
                >
                  <span className="flex flex-col gap-1">
                    <span className="text-[15px] text-ink">{plan.title}</span>
                    <span className="nums text-[13px] text-ink-muted">
                      {formatDateLabel(plan.date)}
                    </span>
                  </span>
                  <Icon name="ChevronRight" size={20} className="shrink-0 text-ink-faint" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageShell>
    </>
  );
}
