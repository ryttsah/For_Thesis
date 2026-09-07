import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
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

export function Pagination({
  page,
  totalItems,
  pageSize = 10,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(totalItems / pageSize);
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (item) => item === 1 || item === totalPages || Math.abs(item - page) <= 1,
  );
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] border-pca-border bg-white text-pca-muted disabled:cursor-not-allowed disabled:opacity-40 hover:bg-pca-bg"
      >
        <IconChevronLeft size={16} />
      </button>
      {pages.map((item, index) => (
        <span key={item} className="contents">
          {index > 0 && pages[index - 1] !== item - 1 && <span className="flex h-9 w-5 items-center justify-center text-pca-muted">…</span>}
        <button
          type="button"
          onClick={() => onPageChange(item)}
          aria-current={item === page ? "page" : undefined}
          className={`flex h-9 min-w-9 items-center justify-center rounded-lg border-[1.5px] text-[13px] font-semibold ${item === page ? "border-pca-green bg-pca-green text-white" : "border-pca-border bg-white text-pca-muted hover:bg-pca-bg"}`}
        >
          {item}
        </button>
        </span>
      ))}
      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
        className="flex h-9 w-9 items-center justify-center rounded-lg border-[1.5px] border-pca-border bg-white text-pca-muted disabled:cursor-not-allowed disabled:opacity-40 hover:bg-pca-bg"
      >
        <IconChevronRight size={16} />
      </button>
    </div>
  );
}
