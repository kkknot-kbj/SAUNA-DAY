'use client';

import { useEffect, useState } from 'react';

import { countMatching } from '@/app/actions';
import { useConditions } from '@/lib/state/conditions-context';

/**
 * 現在の条件で見つかる件数（要件2-8）。
 * 条件を変えるたびに更新する。
 */
export function ResultCount() {
  const { conditions } = useConditions();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    countMatching(conditions)
      .then((value) => {
        if (active) setCount(value);
      })
      .catch(() => {
        if (active) setCount(null);
      });

    return () => {
      active = false;
    };
  }, [conditions]);

  return (
    <p aria-live="polite" className="text-[13px] text-ink-muted">
      {count === null ? (
        '探しています'
      ) : (
        <>
          この条件で <span className="nums text-ink">{count}</span> 件
        </>
      )}
    </p>
  );
}
