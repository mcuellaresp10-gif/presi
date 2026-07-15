import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-presi-surface/50 px-6 py-10 text-center",
        className
      )}
    >
      {icon ? (
        <div className="mb-3 text-presi-gold/60">{icon}</div>
      ) : (
        <div className="mb-3 text-4xl opacity-30">⚽</div>
      )}
      <p className="text-display text-lg text-white/90">{title}</p>
      {description ? (
        <p className="mt-2 max-w-xs text-sm text-white/50">{description}</p>
      ) : null}
      {actionLabel && actionHref ? (
        <Button asChild className="mt-4" size="sm">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : actionLabel && onAction ? (
        <Button className="mt-4" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
