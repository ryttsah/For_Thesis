import { useState } from "react";
import Modal from "../ui/Modal";

interface RejectFarmerModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function RejectFarmerModal({ open, onClose, onConfirm }: RejectFarmerModalProps) {
  const [reason, setReason] = useState("");

  function handleConfirm() {
    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    onConfirm(reason.trim());
    setReason("");
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject farmer registration"
      description="Provide a clear reason. This is recorded with the decision (demo — wire to backend later)."
      footer={
        <>
          <button type="button" className="btn-sec rounded-[10px] border-[1.5px] border-pca-border px-4 py-2 text-sm font-semibold" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="rounded-[10px] bg-pca-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700" onClick={handleConfirm}>
            Reject application
          </button>
        </>
      }
    >
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection..."
        maxLength={500}
        className="reject-reason min-h-[100px] w-full resize-y rounded-[10px] border-[1.5px] border-pca-border p-3 text-sm outline-none focus:border-pca-green"
      />
    </Modal>
  );
}
