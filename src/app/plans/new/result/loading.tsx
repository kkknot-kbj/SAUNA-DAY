import { AppHeader } from '@/components/layout/AppHeader';
import { PageShell } from '@/components/layout/PageShell';
import { Icon } from '@/components/ui/Icon';

/**
 * プラン生成中のローディング画面。
 *
 * 「AI」「生成中」の文言を使わず、
 * 「休日を組み立てています」と表示する。
 */
export default function PlanResultLoading() {
  return (
    <>
      <AppHeader title="休日を作る" backHref="/" />
      <PageShell>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6">
          <div className="flex size-12 items-center justify-center rounded-full border border-line bg-base">
            <Icon name="Route" size={24} className="animate-pulse text-accent" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] text-ink">休日を組み立てています</p>
            <p className="text-[13px] text-ink-faint">候補を比較して最適な流れを考えています</p>
          </div>

          {/* スケルトンのタイムライン */}
          <div className="mt-8 flex w-full max-w-sm flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="size-9 animate-pulse rounded-full bg-line" />
                  {i < 3 ? <div className="w-px flex-1 bg-line" /> : null}
                </div>
                <div className="flex flex-1 flex-col gap-2 pb-8">
                  <div className="h-3 w-12 animate-pulse rounded bg-line" />
                  <div className="h-4 w-32 animate-pulse rounded bg-line" />
                  <div className="h-3 w-20 animate-pulse rounded bg-line" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
