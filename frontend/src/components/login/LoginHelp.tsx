import type { LoginTab } from "../../types/auth";

interface LoginHelpProps {
  role: LoginTab;
}

export default function LoginHelp({ role }: LoginHelpProps) {
  return (
    <div
      aria-label={`${role} login support`}
      className="mt-[22px] rounded-xl border border-pca-border bg-white px-4 py-3.5 text-xs leading-[1.55] text-pca-muted"
    >
      Need help? <strong className="text-pca-text">0917-PCA-HELP</strong> |{" "}
      <strong className="text-pca-text">support@pca.gov.ph</strong>
    </div>
  );
}
