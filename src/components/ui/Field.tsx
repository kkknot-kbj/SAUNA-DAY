import type { ReactNode } from 'react';

type FieldProps = {
  label: string;
  /** 補足。長い説明は書かない */
  hint?: string;
  children: ReactNode;
};

/** ラベルと入力のレイアウト */
export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-[14px] text-ink">{label}</span>
        {hint !== undefined ? <span className="text-[12px] text-ink-faint">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

type SectionProps = {
  title: string;
  hint?: string;
  children: ReactNode;
};

/** 画面内のセクション。見出しは大きさより余白で階層をつくる */
export function Section({ title, hint, children }: SectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[15px] text-ink">{title}</h2>
        {hint !== undefined ? <span className="text-[12px] text-ink-faint">{hint}</span> : null}
      </div>
      {children}
    </section>
  );
}
