import { IconBell, IconX } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { isApiEnabled } from "../../services/api";
import { fetchPortalNotifications, type PortalNotification } from "../../services/analytics";

export default function PortalNotifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PortalNotification[]>([]);
  const [seenIds, setSeenIds] = useState<Set<string>>(() => new Set());
  const rootRef = useRef<HTMLDivElement>(null);
  const seenKey = user ? `pca_seen_notifications_${user.role}_${user.id}` : "";

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchPortalNotifications().then(setItems);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!seenKey) return;
    try {
      const raw = localStorage.getItem(seenKey);
      setSeenIds(new Set(raw ? (JSON.parse(raw) as string[]) : []));
    } catch {
      setSeenIds(new Set());
    }
  }, [seenKey]);

  useEffect(() => {
    if (!open || !seenKey || items.length === 0) return;
    setSeenIds((current) => {
      const next = new Set(current);
      let changed = false;
      for (const item of items) {
        if (item.is_new && !item.id.endsWith("-ok") && !next.has(item.id)) {
          next.add(item.id);
          changed = true;
        }
      }
      if (!changed) return current;
      localStorage.setItem(seenKey, JSON.stringify([...next]));
      return next;
    });
  }, [open, items, seenKey]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!open) return;
      if (rootRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const unread = items.filter((n) => n.is_new && !n.id.endsWith("-ok") && !seenIds.has(n.id)).length;

  function openItem(href: string) {
    setOpen(false);
    if (href) navigate(href);
  }

  function markAllRead() {
    if (!seenKey) return;
    const next = new Set(items.filter((item) => item.is_new && !item.id.endsWith("-ok")).map((item) => item.id));
    setSeenIds(next);
    localStorage.setItem(seenKey, JSON.stringify([...next]));
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
            <div className="flex items-center gap-3"><button type="button" onClick={markAllRead} className="text-[11px] font-bold text-blue-700 hover:underline">Mark all as read</button><button type="button" onClick={() => setOpen(false)} className="text-pca-muted hover:text-pca-text" aria-label="Close"><IconX size={16} /></button></div>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-pca-muted">No notifications.</li>
            ) : (
              items.map((n) => (
                <li key={n.id} className="border-b border-pca-border last:border-b-0">
                  <button type="button" onClick={() => openItem(n.href)} className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-pca-bg ${n.is_new && !seenIds.has(n.id) ? "bg-blue-50" : "bg-white"}`}>
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.is_new && !seenIds.has(n.id) ? "bg-blue-600" : "bg-slate-300"}`} />
                    <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-pca-text">{n.title}</span><span className="mt-0.5 block text-xs leading-relaxed text-pca-muted">{n.body}</span><span className="mt-1 block text-[10px] font-medium text-pca-muted">{n.date_line}</span></span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
