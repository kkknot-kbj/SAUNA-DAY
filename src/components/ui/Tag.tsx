import { Icon } from './Icon';

type TagProps = {
  label: string;
  /** lucide-react のアイコン名 */
  icon?: string;
};

/** 表示専用のタグ。操作しない */
export function Tag({ label, icon }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1 text-[13px] text-ink-muted">
      {icon !== undefined ? <Icon name={icon} size={16} /> : null}
      <span>{label}</span>
    </span>
  );
}

/** タグを「 / 」区切りで並べる（検索結果カードの主要タグ用） */
export function TagRow({ items }: { items: { label: string; icon?: string }[] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-2">
          {index > 0 ? <span className="text-ink-faint">/</span> : null}
          <Tag label={item.label} icon={item.icon} />
        </span>
      ))}
    </span>
  );
}
