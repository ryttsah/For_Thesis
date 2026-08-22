import { DEMO_HELP } from "../../constants/demoAccounts";
import type { LoginTab } from "../../types/auth";

interface LoginHelpProps {
  role: LoginTab;
}

export default function LoginHelp({ role }: LoginHelpProps) {
  const demo = DEMO_HELP[role];

  return (
    <div className="mt-[22px] rounded-xl border border-pca-border bg-white px-4 py-3.5 text-[13px] leading-[1.55] text-pca-muted">
      <strong className="mb-1.5 block text-[13px] font-semibold text-pca-text">
        Trying the demo?
      </strong>
      {demo.idLabel} <code className="rounded-md border border-pca-border bg-pca-bg px-2 py-0.5 font-mono text-xs">{demo.id}</code>
      {" | "}
      Password <code className="rounded-md border border-pca-border bg-pca-bg px-2 py-0.5 font-mono text-xs">{demo.password}</code>
      <div className="mt-3 border-t border-pca-border pt-3 text-xs text-pca-muted">
        {role === "officer" ? (
          <>
            Problems signing in? Call <strong className="text-pca-text">0917-PCA-HELP</strong> or email{" "}
            <strong className="text-pca-text">support@pca.gov.ph</strong>.
          </>
        ) : (
          <>
            Need help? <strong className="text-pca-text">0917-PCA-HELP</strong> |{" "}
            <strong className="text-pca-text">support@pca.gov.ph</strong>
          </>
        )}
      </div>
    </div>
  );
}
