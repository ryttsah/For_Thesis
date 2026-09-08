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
    <div className="relative min-h-full overflow-hidden bg-[#f7fbf8] px-5 py-8 lg:py-14">
      <div className="relative mx-auto w-full max-w-[1180px]">
        <div className="mb-7 flex items-center gap-3 lg:ml-[12%]">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-pca-border bg-white shadow-sm">
            <IconLeaf size={27} stroke={1.8} className="text-pca-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-pca-text">CocoAnalytica</h1>
            <p className="text-sm text-pca-muted">{subtitle}</p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-pca-border bg-white shadow-[0_24px_65px_rgba(22,101,52,0.10)] lg:grid lg:grid-cols-[50%_50%]">
          <section className="relative hidden min-h-[590px] overflow-hidden lg:block">
            <img src="/images/login-coconut-palm.jpg" alt="Coconut palm" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-white/15" />
            <div className="absolute -right-36 -top-10 h-[420px] w-[560px] rounded-bl-[62%] bg-white/90" />
            <div className="relative z-10 flex h-full flex-col justify-between p-10">
              <div className="ml-auto mt-16 w-[250px] text-center">
                <h2 className="text-3xl font-bold leading-[1.02] text-pca-green">Smarter<br />Coconut Farming<br />with Data</h2>
                <p className="mt-4 text-sm leading-snug text-pca-muted">Real-time insights, healthier palms, and a more sustainable tomorrow.</p>
              </div>
              <div className="ml-auto w-[250px] rounded-lg bg-white/65 p-3 backdrop-blur-[1px]">
                <p className="text-xs font-bold uppercase tracking-wide text-pca-green">Secure access</p>
                <p className="mt-2 text-xs leading-relaxed text-pca-muted">Protecting coconut farm records through reliable monitoring and AI-assisted analysis.</p>
                <p className="mt-5 text-xs text-pca-muted">Version 1.0 · © 2026 CocoAnalytica</p>
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
                    footer={null}
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
                    footer={null}
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
