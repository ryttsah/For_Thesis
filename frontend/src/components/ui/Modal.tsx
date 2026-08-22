import type { ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  wide?: boolean;
  footer?: ReactNode;
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  wide,
  footer,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-slate-900/45 p-5"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`modal-panel max-h-[calc(100vh-40px)] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] ${wide ? "max-w-[720px]" : "max-w-[480px]"}`}
      >
        <h3 className="text-[17px] font-bold text-pca-text">{title}</h3>
        {description && (
          <p className="mt-1.5 mb-4 text-[13px] leading-relaxed text-pca-muted">{description}</p>
        )}
        {children}
        {footer && <div className="modal-actions mt-4 flex flex-wrap justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
}
