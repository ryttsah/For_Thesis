import { IconFileX, IconHistory, IconId, IconInfoCircle, IconUserPlus, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import RejectFarmerModal from "../../components/modals/RejectFarmerModal";
import { Card, CardHead } from "../../components/ui/Card";
import { formatAreaForAdmin, useDemoStore } from "../../context/DemoStoreContext";
import { isApiEnabled } from "../../services/api";
import { fetchAdminBootstrap } from "../../services/domain";
import {
  approveRegistrationApi,
  fetchAdminRegistrations,
  rejectRegistrationApi,
} from "../../services/registrations";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[132px_1fr] gap-3 border-b border-pca-border py-2.5 text-[13px] last:border-0">
      <span className="font-medium text-pca-muted">{label}</span>
      <span className="font-semibold leading-snug text-pca-text">{value}</span>
    </div>
  );
}

export default function AdminApprovals() {
  const {
    pendingRegistrations,
    approvedFarmers,
    rejectedAudit,
    selectedPendingId,
    pendingCount,
    selectPending,
    approveFarmer,
    rejectFarmer,
    syncRegistrationData,
    syncAdminDomain,
  } = useDemoStore();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [credentialNote, setCredentialNote] = useState<string | null>(null);
  const [selectedApproved, setSelectedApproved] = useState<typeof approvedFarmers[number] | null>(null);

  const refreshFromApi = useCallback(async () => {
    const data = await fetchAdminRegistrations();
    if (data) {
      syncRegistrationData(data);
      setLoadError(null);
      return true;
    }
    setLoadError("Could not load registrations from the API. Check that the backend is running.");
    return false;
  }, [syncRegistrationData]);

  useEffect(() => {
    if (!isApiEnabled()) return;
    void refreshFromApi();
  }, [refreshFromApi]);

  const selected = pendingRegistrations.find((p) => p.id === selectedPendingId);

  async function handleApprove(id: string) {
    setActionError(null);
    setCredentialNote(null);
    if (isApiEnabled()) {
      const result = await approveRegistrationApi(id);
      if (result.ok) {
        await refreshFromApi();
        const bootstrap = await fetchAdminBootstrap();
        if (bootstrap) syncAdminDomain(bootstrap);
        setCredentialNote(
          result.loginNote ??
            (result.initialPassword
              ? `Farmer login — ID: ${result.farmerId} / temp password: ${result.initialPassword}`
              : "Farmer approved and farm record created."),
        );
        return;
      }
      setActionError(result.message ?? "Approve failed on the server. Try again.");
      return;
    }
    approveFarmer(id);
  }

  async function handleReject(id: string, reason: string) {
    setActionError(null);
    if (isApiEnabled()) {
      const ok = await rejectRegistrationApi(id, reason);
      if (ok) {
        setRejectOpen(false);
        await refreshFromApi();
        return;
      }
      setActionError("Reject failed on the server. Try again.");
      return;
    }
    rejectFarmer(id, reason);
    setRejectOpen(false);
  }

  return (
    <div className="animate-fade-in">
      {loadError && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-[13px] text-orange-800"
        >
          {loadError}
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-pca-red-soft bg-pca-red-light px-3 py-2.5 text-[13px] text-pca-red"
        >
          {actionError}
        </div>
      )}
      {credentialNote && (
        <div
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-pca-green-light px-3 py-2.5 text-[13px] text-pca-green"
        >
          {credentialNote}
        </div>
      )}

      <div className="mb-4">
        <Card className="mb-0 max-w-2xl">
          <CardHead
            title="Pending registrations"
            icon={<IconUserPlus size={16} />}
            action={
              <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-[11px] font-semibold text-orange-600">
                {pendingCount} pending
              </span>
            }
          />
          <p className="mb-3 px-4 text-xs text-pca-muted">Tap a row to see farmer and farm details.</p>
          <div className="flex max-h-[420px] flex-col gap-2 overflow-y-auto px-4 pb-4">
            {pendingRegistrations.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => selectPending(p.id)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  selectedPendingId === p.id
                    ? "border-green-300 bg-pca-green-light"
                    : "border-pca-border hover:bg-pca-bg"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pca-green-light text-pca-green">
                  <IconUserPlus size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">
                    {[p.firstName, p.middleInitial, p.lastName].filter(Boolean).join(" ")}
                  </div>
                  <span className="text-xs text-pca-muted">
                    {p.farmerId} · {p.brgy} · {p.applied}
                  </span>
                </div>
              </button>
            ))}
            {pendingRegistrations.length === 0 && (
              <p className="py-8 text-center text-sm text-pca-muted">No pending registrations.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Sidebar for Registration Details */}
      {selected && (
        <div className="fixed inset-0 z-[1000] flex justify-end overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => selectPending(null)}
          />
          <div className="relative h-full w-full max-w-[520px] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-pca-border px-6 py-4.5">
                <div className="flex items-center gap-2">
                  <IconId size={20} className="text-pca-green" />
                  <h2 className="text-[17px] font-bold text-pca-text">Registration Details</h2>
                </div>
                <button
                  type="button"
                  onClick={() => selectPending(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-pca-border text-pca-muted hover:bg-pca-bg"
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-pca-muted">Farmer Profile</p>
                  <div className="mt-3 flex flex-col">
                    <DetailRow label="First name" value={selected.firstName} />
                    <DetailRow label="Middle initial" value={selected.middleInitial || "—"} />
                    <DetailRow label="Last name" value={selected.lastName} />
                    <DetailRow label="Farmer ID" value={selected.farmerId} />
                    <DetailRow label="Contact number" value={selected.phone} />
                    <DetailRow label="Alternative contact" value={selected.altPhone || "—"} />
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-pca-muted">Farm Information</p>
                  <div className="mt-3 flex flex-col">
                    <DetailRow label="Date applied" value={selected.applied} />
                    <DetailRow label="Farm address" value={selected.farmAddress} />
                    <DetailRow label="Barangay" value={selected.brgy} />
                    <DetailRow label="City / Municipality" value={selected.municipality} />
                    <DetailRow label="Province" value={selected.province} />
                    <DetailRow label="Farm area" value={formatAreaForAdmin(selected.areaHectares)} />
                    <DetailRow
                      label="Area as entered"
                      value={`${selected.areaInputValue} ${selected.areaInputUnit === "sqm" ? "m²" : "ha"}`}
                    />
                    <DetailRow label="Farm status" value={selected.farmStatus} />
                    <DetailRow
                      label="Purpose"
                      value={
                        selected.regPurposeType === "other"
                          ? `Other: ${selected.regPurposeOtherText || "—"}`
                          : "Registration only"
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-pca-border bg-pca-bg/50 px-6 py-5">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleApprove(selected.id)}
                    className="flex-1 rounded-xl bg-pca-green py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-pca-green-hover"
                  >
                    Approve Registration
                  </button>
                  <button
                    type="button"
                    onClick={() => setRejectOpen(true)}
                    className="flex-1 rounded-xl border-2 border-pca-red bg-white py-3 text-sm font-bold text-pca-red transition-colors hover:bg-pca-red-light"
                  >
                    Reject Application
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="mb-4">
        <CardHead title="Recently approved farmers" icon={<IconHistory size={16} />} />
        <p className="border-b border-pca-border px-4 py-2.5 text-[12px] leading-snug text-pca-muted">
          Default farmer password: <strong className="text-pca-text">Pca</strong> + last 6 digits of the
          farmer's phone number + <strong className="text-pca-text">!</strong> (e.g. <span className="font-mono">09123456789</span> → <span className="font-mono">Pca456789!</span>).
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                {["Name", "ID", "Barangay", "Approved Date", "Approved By"].map((h) => (
                  <th key={h} className="px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approvedFarmers.map((a) => (
                <tr key={a.farmerId} onClick={() => setSelectedApproved(a)} className="cursor-pointer border-b border-pca-border hover:bg-pca-bg">
                  <td className="px-4 py-3.5">{a.name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{a.farmerId}</td>
                  <td className="px-4 py-3.5">{a.brgy}</td>
                  <td className="px-4 py-3.5">{a.approvedDate}</td>
                  <td className="px-4 py-3.5">{a.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sidebar for Approved Registration Details */}
      {selectedApproved && (
        <div className="fixed inset-0 z-[1000] flex justify-end overflow-hidden">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity"
            onClick={() => setSelectedApproved(null)}
          />
          <div className="relative h-full w-full max-w-[520px] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-pca-border px-6 py-4.5">
                <div className="flex items-center gap-2">
                  <IconId size={20} className="text-pca-green" />
                  <h2 className="text-[17px] font-bold text-pca-text">Approved Registration</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedApproved(null)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-pca-border text-pca-muted hover:bg-pca-bg"
                >
                  <IconX size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-pca-muted">Farmer Profile</p>
                  <div className="mt-3 flex flex-col">
                    <DetailRow label="Full Name" value={selectedApproved.name} />
                    <DetailRow label="Farmer ID" value={selectedApproved.farmerId} />
                    <DetailRow label="First name" value={selectedApproved.firstName} />
                    <DetailRow label="Middle initial" value={selectedApproved.middleInitial || "—"} />
                    <DetailRow label="Last name" value={selectedApproved.lastName} />
                    <DetailRow label="Contact number" value={selectedApproved.phone} />
                    <DetailRow label="Alternative contact" value={selectedApproved.altPhone || "—"} />
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-pca-muted">Farm Information</p>
                  <div className="mt-3 flex flex-col">
                    <DetailRow label="Date applied" value={selectedApproved.applied} />
                    <DetailRow label="Farm address" value={selectedApproved.farmAddress} />
                    <DetailRow label="Barangay" value={selectedApproved.brgy} />
                    <DetailRow label="City / Municipality" value={selectedApproved.municipality} />
                    <DetailRow label="Province" value={selectedApproved.province} />
                    <DetailRow label="Farm area" value={formatAreaForAdmin(selectedApproved.areaHectares)} />
                    <DetailRow label="Farm status" value={selectedApproved.farmStatus} />
                    <DetailRow
                      label="Purpose"
                      value={
                        selectedApproved.regPurposeType === "other"
                          ? `Other: ${selectedApproved.regPurposeOtherText || "—"}`
                          : "Registration only"
                      }
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <p className="text-xs font-bold uppercase tracking-wider text-pca-muted">Approval Audit</p>
                  <div className="mt-3 flex flex-col">
                    <DetailRow label="Approved date" value={selectedApproved.approvedDate} />
                    <DetailRow label="Approved by" value={selectedApproved.approvedBy} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHead title="Rejected applications audit" icon={<IconFileX size={16} />} />
        <p className="mb-3 text-xs text-pca-muted">Every rejection reason is retained here for the admin-side demo.</p>
        <div className="flex flex-col gap-2">
          {rejectedAudit.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-pca-border p-3.5">
              <IconInfoCircle size={20} className="text-pca-muted" />
              <div>
                <div className="text-sm font-semibold">No rejected applications yet</div>
                <span className="text-xs text-pca-muted">Reasons will appear here after a rejection is submitted.</span>
              </div>
            </div>
          ) : (
            rejectedAudit.map((r) => (
              <div key={r.farmerId + r.whenLabel} className="flex items-start gap-3 rounded-xl border border-pca-border p-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-pca-red-light text-pca-red">
                  <IconX size={18} />
                </div>
                <div>
                  <div className="text-sm font-semibold">{r.farmerId}</div>
                  <span className="text-xs text-pca-muted">{r.whenLabel}</span>
                  <p className="mt-1 text-[13px] text-pca-text">{r.reason}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <RejectFarmerModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={(reason) => selected && void handleReject(selected.id, reason)}
      />
    </div>
  );
}
