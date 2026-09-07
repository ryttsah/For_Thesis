import { IconLeaf, IconPlant2, IconShieldLock, IconUserShield } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FarmerPanel from "../components/login/FarmerPanel";
import RoleLoginForm from "../components/login/RoleLoginForm";
import type { LoginTab } from "../types/auth";

const TABS: { id: LoginTab; label: string; icon: typeof IconUserShield }[] = [
  { id: "officer", label: "Officer", icon: IconUserShield },
  { id: "farmer", label: "Farmer", icon: IconPlant2 },
  { id: "admin", label: "Admin", icon: IconShieldLock },
];

export default function LoginPage() {
  const { user, homePath } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<LoginTab>("officer");
  const [farmerRegisterMode, setFarmerRegisterMode] = useState(false);

  useEffect(() => {
    if (user && homePath) {
      navigate(homePath, { replace: true });
    }
  }, [user, homePath, navigate]);

  function switchTab(tab: LoginTab) {
    setFarmerRegisterMode(false);
    setActiveTab(tab);
  }

  const subtitle = farmerRegisterMode ? "Farmer registration" : "Sign in to continue";

  return (
    <div className="min-h-full bg-[#f6faf7] px-5 py-8 lg:py-14">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="mb-7 flex items-center gap-3 lg:ml-[11%]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pca-border bg-white shadow-sm">
            <IconLeaf size={27} stroke={1.8} className="text-pca-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-pca-text">CocoAnalytica</h1>
            <p className="text-sm text-pca-muted">{subtitle}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-pca-border bg-white shadow-[0_24px_65px_rgba(22,101,52,0.10)] lg:grid lg:grid-cols-[45%_55%]">
          <section className="relative hidden min-h-[590px] overflow-hidden lg:block">
            <img src="/images/dwarf-coconut-tree.png" alt="Dwarf coconut tree" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-white/55" />
            <div className="relative z-10 flex h-full max-w-[320px] flex-col justify-between p-10">
              <div className="pt-20">
                <h2 className="text-4xl font-bold leading-tight text-pca-green">Smarter Coconut Farming with Data</h2>
                <p className="mt-4 text-base leading-relaxed text-pca-muted">Capture coconut leaf conditions, receive AI-assisted results, and keep farm records connected with PCA.</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-pca-green">Secure access</p>
                <p className="mt-2 text-xs leading-relaxed text-pca-muted">Coconut monitoring, field visits, and officer feedback in one system.</p>
                <p className="mt-6 text-xs text-pca-muted">© 2026 CocoAnalytica</p>
              </div>
            </div>
          </section>

          <section className="p-4 sm:p-7 lg:p-10">
            {!farmerRegisterMode && (
              <div className="mb-6 rounded-xl border border-pca-border bg-pca-bg/50 p-1.5">
              <div className="flex gap-1.5">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchTab(id)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-bold transition-all ${
                      activeTab === id
                        ? "bg-white text-pca-green shadow-md ring-1 ring-black/5"
                        : "text-pca-muted hover:bg-white/50 hover:text-pca-text"
                    }`}
                  >
                    <Icon size={18} stroke={2} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
            <div>
              {activeTab === "officer" && (
                <div className="animate-fade-in">
                  <RoleLoginForm
                    role="officer"
                    title="Officer Access"
                    lead="Sign in to your officer account to manage farm records and monitoring."
                    idLabel="Employee ID"
                    idPlaceholder="PCA-XXXX-XXXX"
                  />
                </div>
              )}

              <div className="animate-fade-in">
                <FarmerPanel
                  isActive={activeTab === "farmer"}
                  isRegisterMode={farmerRegisterMode}
                  onEnterRegister={() => setFarmerRegisterMode(true)}
                  onExitRegister={() => setFarmerRegisterMode(false)}
                />
              </div>

              {activeTab === "admin" && (
                <div className="animate-fade-in">
                  <RoleLoginForm
                    role="admin"
                    title="Admin Access"
                    lead="Authorized personnel only. Access system configuration and analytics."
                    idLabel="Administrator ID"
                    idPlaceholder="PCA-ADMIN-XXX"
                  />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs font-medium text-pca-muted/70 md:text-left">
          CocoAnalytica · Coconut Farm Monitoring System
        </p>
      </div>
    </div>
  );
}
