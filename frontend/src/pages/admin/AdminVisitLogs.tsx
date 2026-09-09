import { IconCalendarEvent, IconChevronRight, IconMessageStar, IconStar, IconUserCheck, IconX } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHead } from "../../components/ui/Card";
import { useDemoStore } from "../../context/DemoStoreContext";
import { isApiEnabled } from "../../services/api";
import { fetchAdminBootstrap, submitAdminVisitFeedbackApi } from "../../services/domain";
import type { VisitLog } from "../../types/demoStore";

type OfficerReviews = { id: string; name: string; logs: VisitLog[] };

function Stars({ rating, size = 18 }: { rating: number; size?: number }) {
  return <span className="inline-flex gap-0.5 text-amber-500">{[1, 2, 3, 4, 5].map((star) => <IconStar key={star} size={size} fill={star <= Math.round(rating) ? "currentColor" : "none"} className={star <= Math.round(rating) ? "" : "text-slate-200"} />)}</span>;
}

function getAverage(logs: VisitLog[]) {
  const rated = logs.filter((log) => log.farmerRating !== null);
  return rated.length ? rated.reduce((sum, log) => sum + (log.farmerRating ?? 0), 0) / rated.length : 0;
}

function Distribution({ logs }: { logs: VisitLog[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => logs.filter((log) => log.farmerRating === star).length);
  const highest = Math.max(...counts, 1);
  return <div className="space-y-2">{[5, 4, 3, 2, 1].map((star, index) => <div key={star} className="flex items-center gap-3"><span className="w-3 text-sm text-pca-muted">{star}</span><div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${(counts[index] / highest) * 100}%` }} /></div><span className="w-7 text-right text-xs text-pca-muted">{counts[index]}</span></div>)}</div>;
}

function formatVisitLine(date: string, slot: string) {
  const dateText = new Date(date + "T12:00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return `${dateText} | ${slot === "AM" ? "8:00 AM - 11:30 AM" : "1:00 PM - 4:30 PM"}`;
}

export default function AdminVisitLogs() {
  const { visitLogs, scheduledVisits, syncAdminDomain } = useDemoStore();
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [loggedOpen, setLoggedOpen] = useState(false);
  const [loggedOfficer, setLoggedOfficer] = useState("all");

  useEffect(() => { if (isApiEnabled()) void fetchAdminBootstrap().then((data) => data && syncAdminDomain(data)); }, [syncAdminDomain]);

  const officers = useMemo<OfficerReviews[]>(() => {
    const eligible = visitLogs.filter((log) => {
      const officerResponded = log.officerComment.trim() || (log.notVisitedReason.trim() && log.notVisitedReason !== "Awaiting officer visit outcome.");
      return Boolean(officerResponded) && log.farmerConfirmed !== null;
    });
    const grouped = new Map<string, OfficerReviews>();
    for (const log of eligible) {
      const id = log.officerId || log.officerName;
      const group = grouped.get(id) ?? { id, name: log.officerName, logs: [] };
      group.logs.push(log);
      grouped.set(id, group);
    }
    return [...grouped.values()].sort((a, b) => b.logs.filter((log) => log.farmerRating !== null).length - a.logs.filter((log) => log.farmerRating !== null).length);
  }, [visitLogs]);
  const selected = officers.find((officer) => officer.id === (selectedOfficerId ?? officers[0]?.id)) ?? null;
  const allLoggedVisits = visitLogs.filter((log) => log.officerComment.trim() || log.notVisitedReason.trim());
  const filteredLoggedVisits = loggedOfficer === "all" ? allLoggedVisits : allLoggedVisits.filter((log) => log.officerId === loggedOfficer);

  async function saveAdminFeedback(visitId: string) {
    if (!rating || !feedback.trim()) { setError("Choose a star rating and write feedback."); return; }
    const result = await submitAdminVisitFeedbackApi(visitId, { feedback, rating });
    if (!result.ok) { setError(result.message ?? "Could not save feedback."); return; }
    const data = await fetchAdminBootstrap();
    if (data) syncAdminDomain(data);
    setRatingFor(null);
  }

  return <div className="animate-fade-in"><Card>
    <CardHead title="Ratings and Reviews" icon={<IconMessageStar size={17} />} action={<div className="flex items-center gap-3"><button type="button" onClick={() => setLoggedOpen(true)} className="text-xs font-bold text-pca-green hover:underline">Logged Visits of All Officers</button><span className="text-xs font-semibold text-pca-muted">Verified farmer feedback</span></div>} />
    <p className="text-[13px] leading-relaxed text-pca-muted">Choose an officer to see their average farmer rating, five-to-one star breakdown, and every verified comment from their recorded farm visits.</p>
    {officers.length === 0 ? <p className="mt-5 rounded-xl border border-dashed border-pca-border bg-pca-bg p-8 text-center text-sm text-pca-muted">No officer-and-farmer feedback is ready for review yet.</p> : <div className="mt-5 grid gap-5 xl:grid-cols-[300px_1fr]">
      <aside className="overflow-hidden rounded-xl border border-pca-border"><div className="border-b border-pca-border bg-pca-bg px-4 py-3 text-xs font-bold uppercase tracking-wide text-pca-muted">Officers</div>{officers.map((officer) => { const average = getAverage(officer.logs); const active = officer.id === (selectedOfficerId ?? officers[0]?.id); return <button key={officer.id} type="button" onClick={() => setSelectedOfficerId(officer.id)} className={`flex w-full items-center gap-3 border-b border-pca-border px-4 py-4 text-left last:border-b-0 ${active ? "bg-pca-green-light" : "hover:bg-pca-bg"}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pca-green text-sm font-bold text-white">{officer.name.slice(0, 1).toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-pca-text">{officer.name}</span><span className="mt-1 flex items-center gap-1 text-xs text-pca-muted">{average ? average.toFixed(1) : "No rating"}{average ? <Stars rating={average} size={13} /> : null}</span></span><IconChevronRight size={17} className="text-pca-muted" /></button>; })}</aside>
      {selected && <section className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold text-pca-text">{selected.name}</h2><p className="mt-1 text-sm text-pca-muted">Ratings and reviews are verified after a farmer has responded to a recorded visit.</p></div><IconUserCheck size={23} className="text-pca-green" /></div><div className="mt-5 grid gap-6 lg:grid-cols-[150px_1fr] lg:items-center"><div><div className="text-6xl font-medium text-pca-text">{getAverage(selected.logs) ? getAverage(selected.logs).toFixed(1) : "—"}</div><div className="mt-2"><Stars rating={getAverage(selected.logs)} size={21} /></div><p className="mt-3 text-sm text-pca-muted">{selected.logs.filter((log) => log.farmerRating !== null).length} verified reviews</p></div><Distribution logs={selected.logs} /></div><div className="mt-7 space-y-5">{selected.logs.map((log) => <article key={log.id} className="border-t border-pca-border pt-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-pca-green text-sm font-bold text-white">F</span><div><p className="font-semibold text-pca-text">Farmer review · {log.farm}</p><p className="mt-1 text-xs text-pca-muted">{log.recordedAt}</p></div></div>{log.farmerRating ? <Stars rating={log.farmerRating} /> : null}</div><p className="mt-3 text-sm leading-relaxed text-pca-text">{log.farmerComment || (log.farmerConfirmed ? "The farmer confirmed the visit without a written comment." : "The farmer reported that the visit was not completed.")}</p>{log.farmerReport && <p className="mt-2 text-sm text-pca-red"><strong>Reported concern:</strong> {log.farmerReport}</p>}<p className="mt-3 rounded-lg bg-pca-bg p-3 text-xs text-pca-muted"><strong>Officer outcome:</strong> {log.visited ? log.officerComment : log.notVisitedReason}</p>{log.adminFeedback ? <p className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-950"><strong>Administrator feedback{log.adminRating ? ` · ${log.adminRating}/5 stars` : ""}:</strong> {log.adminFeedback}</p> : <div className="mt-3"><button type="button" onClick={() => { setRatingFor(log.visitId); setRating(0); setFeedback(""); setError(""); }} className="text-sm font-bold text-pca-green hover:underline">Add administrator performance feedback</button>{ratingFor === log.visitId && <div className="mt-3 rounded-xl border border-pca-border bg-pca-bg p-4"><p className="text-sm font-semibold">Rate this officer</p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} className={star <= rating ? "text-amber-500" : "text-slate-300"} aria-label={`${star} stars`}><IconStar size={27} fill="currentColor" /></button>)}</div><textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-3 min-h-24 w-full rounded-lg border border-pca-border bg-white p-3 text-sm" placeholder="Describe the officer's performance" />{error && <p className="mt-2 text-xs font-semibold text-pca-red">{error}</p>}<div className="mt-3 flex gap-2"><button type="button" onClick={() => void saveAdminFeedback(log.visitId)} className="rounded-lg bg-pca-green px-4 py-2 text-sm font-bold text-white">Save feedback</button><button type="button" onClick={() => setRatingFor(null)} className="rounded-lg border border-pca-border px-4 py-2 text-sm font-bold text-pca-muted">Cancel</button></div></div>}</div>}</article>)}</div></section>}
    </div>}
  </Card>{loggedOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"><div className="max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-pca-border p-6"><div><p className="text-xs font-bold uppercase tracking-wide text-pca-muted">Administrative audit</p><h2 className="mt-1 text-xl font-bold">Logged Visits of All Officers</h2><p className="mt-1 text-sm text-pca-muted">Review the scheduled visit, recorded outcome, and completed feedback trail.</p></div><button type="button" onClick={() => setLoggedOpen(false)} className="rounded-lg border border-pca-border p-2"><IconX size={20} /></button></div><div className="max-h-[70vh] overflow-y-auto p-6"><label className="mb-4 block text-sm font-semibold">Filter officer<select value={loggedOfficer} onChange={(event) => setLoggedOfficer(event.target.value)} className="mt-2 w-full rounded-lg border border-pca-border bg-white p-2.5 text-sm"><option value="all">All officers</option>{[...new Map(allLoggedVisits.map((log) => [log.officerId, log.officerName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label><div className="space-y-4">{filteredLoggedVisits.map((log) => { const visit = scheduledVisits.find((item) => item.id === log.visitId); return <article key={log.id} className="rounded-xl border border-pca-border p-5"><div className="grid gap-3 sm:grid-cols-[1fr_auto]"><div><p className="font-semibold">{log.farm}</p><p className="mt-1 text-xs text-pca-muted">{log.officerName} · Recorded {log.recordedAt}</p></div><span className={`h-fit w-fit shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${log.visited ? "bg-pca-green-light text-pca-green" : "bg-pca-red-light text-pca-red"}`}>{log.visited ? "Visit completed" : "Visit not completed"}</span></div>{visit && <div className="mt-4 flex gap-3 rounded-lg bg-pca-bg p-3"><IconCalendarEvent size={18} className="mt-0.5 shrink-0 text-pca-green" /><div><p className="text-[11px] font-bold uppercase tracking-wide text-pca-muted">Scheduled visit</p><p className="mt-1 text-sm font-semibold text-pca-text">{formatVisitLine(visit.date, visit.slot)}</p><p className="mt-1 text-sm text-pca-muted">{visit.purpose}</p></div></div>}<div className="mt-3 rounded-lg bg-pca-bg p-3"><p className="text-[11px] font-bold uppercase tracking-wide text-pca-muted">Officer outcome</p><p className="mt-1 text-sm text-pca-text">{log.visited ? log.officerComment : log.notVisitedReason}</p></div>{log.evidenceImage && <div className="mt-3"><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-pca-muted">Officer visit evidence</p><img src={log.evidenceImage} alt={`Visit evidence for ${log.farm}`} className="h-56 w-full rounded-lg border border-pca-border object-cover" /></div>}{log.farmerConfirmed !== null && <div className="mt-3 rounded-lg bg-pca-green-light p-3 text-sm text-pca-text"><strong>Farmer feedback{log.farmerRating ? ` · ${log.farmerRating}/5 stars` : ""}:</strong> {log.farmerComment || (log.farmerConfirmed ? "Visit confirmed without a written comment." : log.farmerReport || "Visit was reported as not completed.")}</div>}{log.adminFeedback && <div className="mt-3 rounded-lg bg-blue-50 p-3 text-sm text-blue-950"><strong>Administrator feedback{log.adminRating ? ` · ${log.adminRating}/5 stars` : ""}:</strong> {log.adminFeedback}</div>}</article>; })}{filteredLoggedVisits.length === 0 && <p className="py-8 text-center text-sm text-pca-muted">No logged visits match this officer.</p>}</div></div></div></div>}</div>;
}
