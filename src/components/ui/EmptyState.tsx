import { Icon } from './Icon';
import { LinkButton } from './Button';

type EmptyStateProps = {
  /** 状況を1行で。説明を重ねない */
  message: string;
  /** 次の行動は1つだけ示す */
  action?: { label: string; href: string };
  icon?: string;
};

/** 空状態。次の行動を1つだけ提示する */
export function EmptyState({ message, action, icon = 'Search' }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 py-16 text-center">
      <Icon name={icon} size={24} className="text-ink-faint" />
      <p className="text-[14px] text-ink-muted">{message}</p>
      {action !== undefined ? (
        <LinkButton href={action.href} variant="secondary">
          {action.label}
        </LinkButton>
      ) : null}
    </div>
  );
}
