import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import { FormInput } from "../ui/FormField";
import { updateOfficerDetailsApi } from "../../services/domain";
import type { OfficerRecord } from "../../types/demoStore";

interface EditOfficerModalProps {
  open: boolean;
  officer: OfficerRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditOfficerModal({ open, officer, onClose, onSaved }: EditOfficerModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!officer) return;
    setName(officer.name);
    setPhone(officer.phone);
    setFormError(null);
    setFieldErrors({});
  }, [officer, open]);

  async function submit() {
    if (!officer) return;
    const errors: Record<string, boolean> = {};
    if (!name.trim()) errors.name = true;
    if (!phone.trim()) errors.phone = true;
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      setFormError("Please fill all the required information.");
      return;
    }
    setBusy(true);
    const result = await updateOfficerDetailsApi(officer.empId, { name: name.trim(), phone: phone.trim() });
    setBusy(false);
    if (!result.ok) {
      setFormError(result.message ?? "Could not save changes.");
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit officer" description="Update name and phone. Assign barangay below the table.">
      <div className="flex flex-col gap-3">
        <FormInput label="Employee ID" value={officer?.empId ?? ""} disabled readOnly />
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
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
