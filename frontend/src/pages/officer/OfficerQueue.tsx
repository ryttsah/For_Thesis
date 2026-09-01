import { IconChecklist, IconPhotoCheck } from "@tabler/icons-react";
import { useEffect, useMemo } from "react";
import { useDemoStore } from "../../context/DemoStoreContext";
import { filterByBrgy, useOfficerScope } from "../../hooks/useOfficerScope";
import { Card, CardHead } from "../../components/ui/Card";
import { isApiEnabled } from "../../services/api";
import { fetchOfficerBootstrap, validateQueueApi } from "../../services/domain";

export default function OfficerQueue() {
  const { queue, queuePendingCount, validateQueueItem, syncOfficerDomain } = useDemoStore();
  const { assignedBrgy } = useOfficerScope();

  const scoped = useMemo(() => filterByBrgy(queue, assignedBrgy), [queue, assignedBrgy]);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void fetchOfficerBootstrap().then((data) => {
      if (data) syncOfficerDomain(data);
    });
  }, [syncOfficerDomain]);

  async function handleValidate(id: string) {
    if (isApiEnabled()) {
      const ok = await validateQueueApi(id);
      if (ok) {
        const data = await fetchOfficerBootstrap();
        if (data) syncOfficerDomain(data);
        return;
      }
    }
    validateQueueItem(id);
  }

  return (
    <div className="animate-fade-in">
      <Card>
        <CardHead
          title="Surveys Awaiting Validation"
          icon={<IconChecklist size={16} />}
          action={
            <span className="rounded-full bg-pca-green-light px-2.5 py-0.5 text-[11px] font-semibold text-pca-green">
              {queuePendingCount} pending
            </span>
          }
        />
        <div className="flex flex-col gap-2">
          {scoped.length === 0 ? (
            <p className="rounded-xl border border-dashed border-pca-border bg-pca-bg px-4 py-6 text-center text-sm text-pca-muted">
              {assignedBrgy
                ? `No farmer analysis records are awaiting validation in ${assignedBrgy}.`
                : "No farmer analysis records are awaiting validation. Ask admin to assign your officer account to a barangay."}
            </p>
          ) : scoped.map((q) => (
            <div
              key={q.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-pca-border p-3.5 hover:bg-pca-bg sm:flex-nowrap"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pca-green-light text-pca-green">
                <IconPhotoCheck size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{q.title}</div>
                <span className="text-xs text-pca-muted">
                  {q.sub} · {q.brgy}
                </span>
              </div>
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-bold text-orange-600">
                {q.conf}
              </span>
              <button
                type="button"
                disabled={q.validated}
                onClick={() => void handleValidate(q.id)}
                className={`rounded-lg border-[1.5px] px-3.5 py-1.5 text-xs font-semibold ${
                  q.validated
                    ? "cursor-default border-pca-green bg-pca-green-light text-pca-green"
                    : "border-pca-green text-pca-green hover:bg-pca-green-light"
                }`}
              >
                {q.validated ? "Validated" : "Validate"}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
