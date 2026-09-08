import { IconArrowLeft } from "@tabler/icons-react";
import FarmerRegistrationForm from "./FarmerRegistrationForm";
import RoleLoginForm from "./RoleLoginForm";

interface FarmerPanelProps {
  isActive: boolean;
  onEnterRegister: () => void;
  onExitRegister: () => void;
  isRegisterMode: boolean;
}

export default function FarmerPanel({
  isActive,
  onEnterRegister,
  onExitRegister,
  isRegisterMode,
}: FarmerPanelProps) {
  if (!isActive) return null;

  return (
    <div className={isActive ? "block" : "hidden"}>
      {isRegisterMode && (
        <div className="flex px-8 pb-0 pt-0">
          <button
            type="button"
            onClick={onExitRegister}
            className="inline-flex items-center gap-1.5 py-2 text-[13px] font-semibold text-pca-green hover:text-pca-green-hover hover:underline hover:underline-offset-[3px]"
          >
            <IconArrowLeft size={16} stroke={2} />
            Back
          </button>
        </div>
      )}

      {!isRegisterMode ? (
        <>
          <RoleLoginForm
            role="farmer"
            title="Farmer sign in"
            lead="Upload photos from your farm and see AI-assisted health notes from PCA."
            idLabel="Farmer ID"
            idPlaceholder="e.g. FARMER-001"
          />
          <p className="-mt-2 px-8 pb-8 text-center text-[13px] text-pca-muted">
            First time here?{" "}
            <button
              type="button"
              onClick={onEnterRegister}
              className="ml-1 font-semibold text-pca-green hover:underline"
            >
              Register as a farmer
            </button>
          </p>
        </>
      ) : (
        <FarmerRegistrationForm onBackToSignIn={onExitRegister} />
      )}
    </div>
  );
}
