import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[14px] border border-pca-border bg-white p-5 transition-colors hover:border-[#d1d5db] ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHead({
  title,
  icon,
  action,
}: {
  title: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm font-bold text-pca-text">
        {icon && <span className="text-pca-green">{icon}</span>}
        {title}
      </span>
      {action}
    </div>
  );
}

export function GhostButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border-[1.5px] border-pca-border bg-transparent px-3 py-1.5 text-xs font-medium text-pca-muted transition-colors hover:bg-pca-bg hover:text-pca-text"
    >
      {children}
    </button>
  );
}

export function Pagination() {
  return (
    <div className="flex gap-1.5">
      {["‹", "1", "2", "3", "›"].map((label) => (
        <button
          key={label}
          type="button"
          className="flex h-9 min-w-9 items-center justify-center rounded-lg border-[1.5px] border-pca-border bg-white text-[13px] font-semibold text-pca-muted hover:bg-pca-bg"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
