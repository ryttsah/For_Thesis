import { IconMessageStar, IconStar, IconUserCheck } from "@tabler/icons-react";
import { useEffect, useMemo, useState } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { isApiEnabled } from "../../services/api";
import { fetchAdminBootstrap, submitAdminVisitFeedbackApi } from "../../services/domain";
import { Card, CardHead } from "../../components/ui/Card";

export default function AdminVisitLogs() {
  const { visitLogs, syncAdminDomain } = useDemoStore();
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchAdminBootstrap().then((data) => data && syncAdminDomain(data));
  }, [syncAdminDomain]);

  const readyLogs = useMemo(() => visitLogs.filter((log) => {
    const officerHasResponded = log.officerComment.trim().length > 0
      || (log.notVisitedReason.trim().length > 0 && log.notVisitedReason !== "Awaiting officer visit outcome.");
    return officerHasResponded && log.farmerConfirmed !== null;
  }), [visitLogs]);

  async function saveFeedback(visitId: string) {
    if (!feedback.trim() || !rating) {
      setError("Enter feedback and choose a rating.");
      return;
    }
    const result = await submitAdminVisitFeedbackApi(visitId, { feedback, rating });
    if (!result.ok) {
      setError(result.message ?? "Could not save feedback.");
      return;
    }
    const data = await fetchAdminBootstrap();
    if (data) syncAdminDomain(data);
    setFeedbackFor(null);
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead
          title="Officer Visit Logs"
          icon={<IconUserCheck size={16} />}
          action={<span className="rounded-full bg-pca-bg px-2.5 py-0.5 text-[11px] font-semibold text-pca-muted">{readyLogs.length} ready for review</span>}
        />
        <p className="mb-4 text-[13px] leading-relaxed text-pca-muted">
          A log appears only after both the officer and the farmer have responded. Review the completed work, the farmer's rating or report, then provide an administrator performance rating.
        </p>
        <div className="flex flex-col gap-4">
          {readyLogs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-pca-border bg-pca-bg p-8 text-center text-sm text-pca-muted">No completed officer-and-farmer visit feedback is ready for review.</p>
          ) : readyLogs.map((log) => (
            <article key={log.id} className="rounded-xl border border-pca-border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-pca-text">{log.farm}</h2>
                  <p className="mt-1 text-xs text-pca-muted">{log.officerName} · {log.recordedAt}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${log.visited ? "bg-pca-green-light text-pca-green" : "bg-pca-red-light text-pca-red"}`}>{log.visited ? "Officer visited" : "Officer did not visit"}</span>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <section className="rounded-xl bg-pca-bg p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-pca-muted">Officer outcome</p>
                  <p className="mt-2 text-sm leading-relaxed text-pca-text">{log.visited ? log.officerComment : log.notVisitedReason}</p>
                </section>
                <section className="rounded-xl border border-pca-green-soft bg-pca-green-light p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-pca-green">Farmer feedback</p>
                  <p className="mt-2 text-sm font-semibold text-pca-text">{log.farmerConfirmed ? "Farmer confirmed the visit" : "Farmer reported that the officer did not visit"}{log.farmerRating ? ` · ${log.farmerRating}/5 stars` : ""}</p>
                  {log.farmerComment && <p className="mt-2 text-sm leading-relaxed text-pca-text">{log.farmerComment}</p>}
                  {log.farmerReport && <p className="mt-2 text-sm leading-relaxed text-pca-red"><strong>Concern:</strong> {log.farmerReport}</p>}
                </section>
              </div>

              {log.adminFeedback ? (
                <section className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide"><IconMessageStar size={16} /> Administrator performance feedback</p>
                  <p className="mt-2 text-sm font-semibold">{log.adminRating}/5 stars · {log.adminFeedback}</p>
                </section>
              ) : (
                <section className="mt-4 rounded-xl border border-pca-border bg-pca-bg p-4">
                  <button type="button" onClick={() => { setFeedbackFor(log.visitId); setFeedback(""); setRating(0); setError(""); }} className="text-sm font-bold text-pca-green hover:underline">Add administrator performance feedback</button>
                  {feedbackFor === log.visitId && (
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-pca-text">Rate this officer</p>
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setRating(star)} className={star <= rating ? "text-amber-500" : "text-slate-300"} aria-label={`${star} stars`}><IconStar size={27} fill="currentColor" /></button>)}
                      </div>
                      <textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} className="mt-3 min-h-24 w-full rounded-lg border border-pca-border bg-white p-3 text-sm" placeholder="Describe the officer's performance" />
                      {error && <p className="mt-2 text-xs font-semibold text-pca-red">{error}</p>}
                      <div className="mt-3 flex gap-2"><button type="button" onClick={() => void saveFeedback(log.visitId)} className="rounded-lg bg-pca-green px-4 py-2 text-sm font-bold text-white">Save feedback</button><button type="button" onClick={() => setFeedbackFor(null)} className="rounded-lg border border-pca-border px-4 py-2 text-sm font-bold text-pca-muted">Cancel</button></div>
                    </div>
                  )}
                </section>
              )}
            </article>
          ))}
        </div>
      </Card>
    </div>
  );
}
