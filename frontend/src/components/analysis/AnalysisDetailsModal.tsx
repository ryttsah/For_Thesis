import { IconPhoto, IconX } from "@tabler/icons-react";
import type { AnalysisDetails } from "../../types/demoStore";

export interface AnalysisModalRecord {
  title: string;
  date?: string;
  farm?: string;
  sector?: string;
  brgy?: string;
  result?: string;
  details?: AnalysisDetails;
}

interface Props {
  open: boolean;
  record: AnalysisModalRecord | null;
  onClose: () => void;
}

function hasDetails(details?: AnalysisDetails) {
  return Boolean(
    details &&
      (details.confidencePct ||
        details.majority ||
        details.breakdown?.length ||
        details.perPhoto?.length ||
        details.recommendationText),
  );
}

export default function AnalysisDetailsModal({ open, record, onClose }: Props) {
  if (!open || !record) return null;
  const details = record.details;
  const confidence =
    typeof details?.confidencePct === "number" && details.confidencePct > 0
      ? `${details.confidencePct.toFixed(details.confidencePct % 1 === 0 ? 0 : 1)}%`
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4" role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-pca-border px-5 py-4">
          <div className="min-w-0">
            <div className="text-xs font-black uppercase tracking-widest text-pca-muted">Analysis Details</div>
            <h3 className="mt-1 break-words text-2xl font-black text-pca-text">{record.title}</h3>
            <p className="mt-1 text-sm text-pca-muted">
              {[record.farm, record.sector ? `Sector ${record.sector}` : "", record.brgy].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-pca-border text-pca-muted hover:bg-pca-bg hover:text-pca-text"
            aria-label="Close analysis details"
          >
            <IconX size={20} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-96px)] overflow-y-auto p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-pca-border bg-pca-bg p-4 md:col-span-3">
              <div className="text-xs font-bold uppercase tracking-wider text-pca-muted">Result Category</div>
              <div className="mt-1 break-words text-lg font-black text-pca-green">
                {record.result || details?.recommendationTitle || "—"}
              </div>
              {record.date && <div className="mt-1 text-xs font-semibold text-pca-muted">{record.date}</div>}
            </div>
            <div className="rounded-xl border border-pca-border bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-pca-muted">Majority</div>
              <div className="mt-1 break-words text-lg font-black">{details?.majority || record.result || "—"}</div>
            </div>
            <div className="rounded-xl border border-pca-border bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-pca-muted">Confidence</div>
              <div className="mt-1 text-lg font-black text-pca-green">{confidence}</div>
            </div>
            <div className="rounded-xl border border-pca-border bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-wider text-pca-muted">Images</div>
              <div className="mt-1 text-lg font-black">{details?.imageCount ?? details?.perPhoto?.length ?? "—"}</div>
            </div>
          </div>

          {details?.recommendationText && (
            <div className="mt-4 rounded-xl border border-pca-green-soft bg-pca-green-light p-4">
              <div className="text-xs font-black uppercase tracking-widest text-pca-muted">
                {details.recommendationHeading || "Recommendation"}
              </div>
              {details.recommendationTitle && (
                <h4 className="mt-1 break-words text-lg font-black text-pca-green">{details.recommendationTitle}</h4>
              )}
              {details.recommendationDescription && (
                <p className="mt-2 text-sm font-medium leading-relaxed text-pca-text">{details.recommendationDescription}</p>
              )}
              <p className="mt-3 text-sm font-bold leading-relaxed text-pca-text">{details.recommendationText}</p>
            </div>
          )}

          {details?.breakdown?.length ? (
            <div className="mt-4 rounded-xl border border-pca-border bg-white p-4">
              <h4 className="mb-4 text-sm font-black uppercase tracking-wider">Breakdown by Condition</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                {details.breakdown.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <span className="break-words text-sm font-bold">{item.label}</span>
                      <span className="shrink-0 text-xs font-black">{item.count} photo{item.count === 1 ? "" : "s"}</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full border border-pca-border bg-pca-bg">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, item.share)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {details?.perPhoto?.length ? (
            <div className="mt-4 rounded-xl border border-pca-border bg-white p-4">
              <h4 className="mb-4 text-sm font-black uppercase tracking-wider">Per-Photo Analysis</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                {details.perPhoto.map((photo, index) => (
                  <div key={`${photo.fileName}-${index}`} className="flex items-center gap-3 rounded-xl border border-pca-border p-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pca-bg text-pca-green">
                      <IconPhoto size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-pca-muted">{photo.fileName}</div>
                      <div className="break-words text-sm font-bold">{photo.label}</div>
                      <div className="text-xs text-pca-muted">{photo.confidence.toFixed(photo.confidence % 1 === 0 ? 0 : 1)}% confidence</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!hasDetails(details) && (
            <p className="mt-4 rounded-xl border border-dashed border-pca-border bg-pca-bg p-5 text-center text-sm text-pca-muted">
              This older record only has summary data. New submissions will save the full breakdown.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
