import { IconCamera, IconCheck, IconPhoto, IconX } from "@tabler/icons-react";
import { useState } from "react";

interface VisitOutcomeModalProps {
  open: boolean;
  farm: string;
  onClose: () => void;
  onSave: (value: { visited: boolean; officerComment: string; notVisitedReason: string; evidence: File | null }) => Promise<void>;
}

export default function VisitOutcomeModal({ open, farm, onClose, onSave }: VisitOutcomeModalProps) {
  const [visited, setVisited] = useState(true);
  const [officerComment, setOfficerComment] = useState("");
  const [notVisitedReason, setNotVisitedReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  if (!open) return null;

  async function submit() {
    const required = visited ? officerComment.trim() : notVisitedReason.trim();
    if (!required) { setError(visited ? "Describe the work completed during this visit." : "State why the visit was not completed."); return; }
    if (visited && !evidence) { setError("Take a fresh farm-visit photo before saving this outcome."); return; }
    setSaving(true); setError("");
    try { await onSave({ visited, officerComment, notVisitedReason, evidence }); onClose(); } catch (e) { setError(e instanceof Error ? e.message : "Could not save the visit log."); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wide text-pca-muted">Officer visit log</p><h2 className="mt-1 text-xl font-bold">{farm}</h2></div><button onClick={onClose} className="rounded-lg border border-pca-border p-2 text-pca-muted"><IconX size={20}/></button></div>
        <p className="mt-3 text-sm text-pca-muted">Record the actual field outcome. This will be shown to the farmer and administrator.</p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setVisited(true)} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${visited ? "border-pca-green bg-pca-green-light text-pca-green" : "border-pca-border"}`}>Visited farm</button>
          <button type="button" onClick={() => setVisited(false)} className={`rounded-lg border px-3 py-3 text-sm font-semibold ${!visited ? "border-pca-red bg-pca-red-light text-pca-red" : "border-pca-border"}`}>Did not visit</button>
        </div>
        {visited ? <><label className="mt-4 block text-sm font-semibold">Work completed<textarea value={officerComment} onChange={(e) => setOfficerComment(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-pca-border p-3 text-sm font-normal" placeholder="Describe the inspection, advice, treatment, or survey work done." /></label><label className="mt-4 flex cursor-pointer items-center justify-between rounded-xl border border-pca-green bg-pca-green-light p-4 text-sm font-bold text-pca-green"><span className="flex items-center gap-2"><IconCamera size={20} />Take fresh farm-visit evidence</span><span>{evidence ? <span className="inline-flex items-center gap-1"><IconPhoto size={16} />Captured</span> : "Required"}</span><input type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => setEvidence(event.target.files?.[0] ?? null)} /></label><p className="mt-2 text-xs text-pca-muted">This opens the device camera on supported phones. Evidence is available to administrators only.</p></> : <label className="mt-4 block text-sm font-semibold">Reason for not visiting<textarea value={notVisitedReason} onChange={(e) => setNotVisitedReason(e.target.value)} className="mt-2 min-h-28 w-full rounded-lg border border-pca-border p-3 text-sm font-normal" placeholder="State why the visit could not be completed and the next action." /></label>}
        {error && <p className="mt-3 text-sm font-medium text-pca-red">{error}</p>}
        <button disabled={saving} onClick={() => void submit()} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-pca-green px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><IconCheck size={18}/>{saving ? "Saving..." : "Save visit log"}</button>
      </div>
    </div>
  );
}
