import { IconPencil, IconPlus, IconTrash, IconUsers } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import AddOfficerModal from "../../components/modals/AddOfficerModal";
import EditOfficerModal from "../../components/modals/EditOfficerModal";
import { useDemoStore } from "../../context/DemoStoreContext";
import { Card, CardHead } from "../../components/ui/Card";
import { FormInput, FormSelect } from "../../components/ui/FormField";
import { isApiEnabled } from "../../services/api";
import { useBarangayOptions } from "../../hooks/useBarangayOptions";
import { assignOfficerApi, fetchAdminBootstrap, removeOfficerApi } from "../../services/domain";
import { displayBrgyLabel, normalizeBrgyLabel } from "../../utils/pcaFormat";
import type { OfficerRecord } from "../../types/demoStore";

export default function AdminOfficers() {
  const { officers, assignOfficer, removeOfficer, assignToast, syncAdminDomain } = useDemoStore();
  const barangayOptions = useBarangayOptions();
  const [selectedEmp, setSelectedEmp] = useState(officers[0]?.empId ?? "");
  const [selectedBrgy, setSelectedBrgy] = useState("");
  const [customBrgy, setCustomBrgy] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOfficer, setEditOfficer] = useState<OfficerRecord | null>(null);
  const [successNote, setSuccessNote] = useState<string | null>(null);

  useEffect(() => {
    if (!officers.some((o) => o.empId === selectedEmp) && officers[0]) {
      setSelectedEmp(officers[0].empId);
    }
  }, [officers, selectedEmp]);

  useEffect(() => {
    if (barangayOptions.length === 0) return;
    setSelectedBrgy((prev) => {
      if (prev === "__CUSTOM__") return prev;
      if (prev && barangayOptions.includes(prev)) return prev;
      return barangayOptions[0];
    });
  }, [barangayOptions]);

  async function refresh() {
    const data = await fetchAdminBootstrap();
    if (data) syncAdminDomain(data);
  }

  function resolveBrgy(): string {
    if (selectedBrgy === "__CUSTOM__") return customBrgy.trim();
    return selectedBrgy;
  }

  async function handleAssign(empId: string, brgy: string) {
    setActionError(null);
    let target = brgy === "__CUSTOM__" ? customBrgy.trim() : brgy;
    if (brgy === "__UNASSIGN__") {
      target = "__UNASSIGN__";
    } else if (target && target !== "__UNASSIGN__") {
      target = normalizeBrgyLabel(target);
    }
    if (!target) {
      setActionError("Choose or type a barangay name.");
      return;
    }
    if (isApiEnabled()) {
      const ok = await assignOfficerApi(empId, target);
      if (ok) {
        await refresh();
        return;
      }
      setActionError("Could not update officer on the server.");
      return;
    }
    assignOfficer(empId, target === "__UNASSIGN__" ? "Unassigned" : target);
  }

  async function handleRemove(empId: string, name: string) {
    if (!confirm(`Remove ${name}?`)) return;
    setActionError(null);
    if (isApiEnabled()) {
      const ok = await removeOfficerApi(empId);
      if (ok) {
        await refresh();
        return;
      }
      setActionError("Could not remove officer on the server.");
      return;
    }
    removeOfficer(empId);
  }

  return (
    <div className="animate-fade-in">
      {successNote && (
        <div className="mb-4 rounded-lg border border-green-200 bg-pca-green-light px-3 py-2.5 text-[13px] text-pca-green">
          {successNote}
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

      <Card className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pca-border px-4 py-3">
          <div className="flex items-center gap-2 text-[15px] font-bold text-pca-text">
            <IconUsers size={16} className="text-pca-green" />
            Registered Officers
          </div>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="relative inline-flex min-h-[40px] items-center gap-2 rounded-[10px] border-2 border-pca-green/30 bg-pca-green-light px-3.5 py-2 text-[13px] font-semibold text-pca-green shadow-sm transition-colors hover:border-pca-green hover:bg-pca-green hover:text-white"
          >
            <IconPlus size={18} stroke={2} />
            Add Officer
          </button>
        </div>
        <p className="border-b border-pca-border px-4 py-2.5 text-[12px] leading-snug text-pca-muted">
          Default officer password: <strong className="text-pca-text">PCAOFFICER</strong> + last 4 digits of the
          Employee ID (e.g. <span className="font-mono">PCA-2026-0001</span> →{" "}
          <span className="font-mono">PCAOFFICER0001</span>). New officers start as <strong>None</strong> (unassigned)
          until you use Assign/Reassign below.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-pca-border bg-pca-bg text-left text-xs font-semibold uppercase text-pca-muted">
                {["Officer Name", "Employee ID", "Phone", "Assigned Brgy.", "Farms Covered", "Status", "Last Active", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {officers.map((o) => (
                <tr key={o.empId} className="border-b border-pca-border hover:bg-pca-bg">
                  <td className="px-4 py-3.5 font-semibold">{o.name}</td>
                  <td className="px-4 py-3.5 font-mono text-xs">{o.empId}</td>
                  <td className="px-4 py-3.5">{o.phone}</td>
                  <td className="px-4 py-3.5">{displayBrgyLabel(o.brgy)}</td>
                  <td className="px-4 py-3.5">{o.farmsCovered}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${o.status === "Active" ? "bg-pca-green-light text-pca-green" : "bg-yellow-50 text-amber-600"}`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">{o.lastActive}</td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <button
                      type="button"
                      onClick={() => setEditOfficer(o)}
                      className="mr-2 inline-flex items-center gap-1 text-xs font-semibold text-pca-muted hover:text-pca-text hover:underline"
                    >
                      <IconPencil size={12} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAssign(o.empId, "__UNASSIGN__")}
                      className="mr-2 text-xs font-semibold text-pca-green hover:underline"
                    >
                      Unassign
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRemove(o.empId, o.name)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-pca-red hover:underline"
                    >
                      <IconTrash size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title="Assign/Reassign Officer" icon={<IconUsers size={16} />} />
        <p className="mb-3.5 px-4 text-[13px] text-pca-muted">
          Reassign posting or unassign an officer. Barangay list includes registered farms (e.g. Brgy. Daga).
        </p>
        <div className="grid grid-cols-1 items-end gap-3 px-4 pb-4 md:grid-cols-2 lg:grid-cols-[minmax(160px,1fr)_minmax(160px,1fr)_auto_auto]">
          <FormSelect label="Select officer" value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
            {officers.map((o) => (
              <option key={o.empId} value={o.empId}>
                {o.name}
              </option>
            ))}
          </FormSelect>
          <div>
            <FormSelect label="Brgy." value={selectedBrgy} onChange={(e) => setSelectedBrgy(e.target.value)}>
              {barangayOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
              <option value="__CUSTOM__">Other Brgys</option>
            </FormSelect>
            {selectedBrgy === "__CUSTOM__" && (
              <FormInput
                label="Other brgy. name"
                required
                value={customBrgy}
                onChange={(e) => setCustomBrgy(e.target.value)}
                placeholder="e.g. Daga"
                className="mt-2"
              />
            )}
          </div>
          <button
            type="button"
            onClick={() => void handleAssign(selectedEmp, resolveBrgy())}
            className="h-[42px] rounded-[10px] bg-pca-green px-4 text-sm font-semibold text-white"
          >
            Assign/Reassign
          </button>
          <button
            type="button"
            onClick={() => void handleAssign(selectedEmp, "__UNASSIGN__")}
            className="h-[42px] rounded-[10px] border border-pca-border px-4 text-sm font-semibold"
          >
            Unassign selected
          </button>
        </div>
        {assignToast && (
          <div className="mx-4 mb-4 rounded-lg border border-green-200 bg-pca-green-light px-3 py-2 text-[13px] font-semibold text-pca-green">
            {assignToast}
          </div>
        )}
      </Card>

      <AddOfficerModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onCreated={(note) => {
          setSuccessNote(note);
          void refresh();
        }}
      />

      <EditOfficerModal
        open={Boolean(editOfficer)}
        officer={editOfficer}
        onClose={() => setEditOfficer(null)}
        onSaved={() => void refresh()}
      />
    </div>
  );
}
