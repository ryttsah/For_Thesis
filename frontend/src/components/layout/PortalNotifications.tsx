import { IconBell, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isApiEnabled } from "../../services/api";
import { fetchPortalNotifications, type PortalNotification } from "../../services/analytics";

export default function PortalNotifications() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isApiEnabled() || !open) return;
    void fetchPortalNotifications().then(setItems);
  }, [open]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const unread = items.filter((n) => n.is_new && !n.id.endsWith("-ok")).length;

  function openItem(href: string) {
    setOpen(false);
    if (href) navigate(href);
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        data-notif-trigger
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border-2 border-pca-green/30 bg-pca-green-light px-3.5 py-2 text-[13px] font-semibold text-pca-green shadow-sm transition-colors hover:border-pca-green hover:bg-pca-green hover:text-white"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <IconBell size={20} stroke={2} />
        <span className="hidden sm:inline">Notifications</span>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-pca-red px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border border-pca-border bg-white shadow-xl"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-pca-border px-4 py-3">
            <span className="text-sm font-bold text-pca-text">Notifications</span>
            <button type="button" onClick={() => setOpen(false)} className="text-pca-muted hover:text-pca-text" aria-label="Close">
              <IconX size={16} />
            </button>
          </div>
          <ul className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-pca-muted">No notifications.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="mb-1 rounded-lg px-3 py-2.5 hover:bg-pca-bg">
                  <div className="text-[13px] font-semibold text-pca-text">{n.title}</div>
                  <p className="mt-0.5 text-xs leading-relaxed text-pca-muted">{n.body}</p>
                  {n.href ? (
                    <button
                      type="button"
                      onClick={() => openItem(n.href)}
                      className="mt-2 rounded-md bg-pca-green px-2.5 py-1 text-xs font-semibold text-white hover:bg-pca-green-hover"
                    >
                      Open
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
