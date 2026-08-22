import { useState } from "react";
import Modal from "../ui/Modal";
import { FormInput } from "../ui/FormField";
import { createOfficerApi } from "../../services/domain";
import { formatPcaEmployeeId } from "../../utils/pcaFormat";

interface AddOfficerModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (note: string) => void;
}

export default function AddOfficerModal({ open, onClose, onCreated }: AddOfficerModalProps) {
  const [empId, setEmpId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  async function submit() {
    const errors: Record<string, boolean> = {};
    const formattedId = formatPcaEmployeeId(empId);
    if (!formattedId || formattedId.length < 10) errors.empId = true;
    if (!name.trim()) errors.name = true;
    if (!phone.trim()) errors.phone = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError("Please fill all the required information.");
      return;
    }

    setFormError(null);
    setBusy(true);
    const result = await createOfficerApi({
      empId: formattedId,
      name: name.trim(),
      phone: phone.trim(),
    });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.message ?? "Could not add officer.");
      return;
    }
    onCreated(
      result.loginNote ??
        `Officer added as Unassigned. Login: ${formattedId} / password ${result.initialPassword}`,
    );
    setEmpId("");
    setName("");
    setPhone("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add PCA officer"
      description="New officers start as Unassigned. Use Assign/Reassign below to set their barangay."
    >
      <div className="flex flex-col gap-3">
        <FormInput
          label="Employee ID"
          required
          invalid={fieldErrors.empId}
          value={empId}
          onChange={(e) => setEmpId(formatPcaEmployeeId(e.target.value))}
          placeholder="PCA-2026-0001"
          className="font-mono uppercase"
        />
        <FormInput
          label="Full name"
          required
          invalid={fieldErrors.name}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormInput
          label="Phone"
          required
          invalid={fieldErrors.phone}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {formError && <p className="text-[13px] text-pca-red">{formError}</p>}
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="rounded-[10px] bg-pca-green px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Add officer"}
        </button>
      </div>
    </Modal>
  );
}
