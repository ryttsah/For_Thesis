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
    <div className="flex min-h-full items-center justify-center bg-pca-bg p-6 lg:p-12">
      {/* Container that allows the card to grow horizontally on large screens */}
      <div className="w-full max-w-[440px] md:max-w-[800px] lg:max-w-[1000px]">

        {/* Simple Branding Header - Stays centered or aligns left on desktop */}
        <div className="mb-10 text-center md:text-left md:flex md:items-center md:gap-4">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-pca-border md:mx-0 md:mb-0">
            <IconLeaf size={32} stroke={1.5} className="text-pca-green" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-pca-text md:text-3xl">PCA Negros Occidental</h1>
            <p className="mt-1.5 text-[15px] font-medium text-pca-muted">{subtitle}</p>
          </div>
        </div>

        {/* The Card: Expands to a multi-column feel on desktop */}
        <div className="overflow-hidden rounded-[32px] border border-pca-border bg-white shadow-[0_20px_50px_rgba(0,0,0,0.04)]">
          {!farmerRegisterMode && (
            <div className="border-b border-pca-border bg-pca-bg/30 p-2 md:p-3">
              <div className="mx-auto flex max-w-[500px] gap-2 md:max-w-none">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchTab(id)}
                    className={`flex flex-1 items-center justify-center gap-3 rounded-2xl py-3 text-[14px] font-bold transition-all ${
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

          <div className="md:flex md:items-stretch">
            {/* Optional visual/info area for desktop to make card feel "fuller" */}
            <div className="hidden w-1/3 border-r border-pca-border bg-pca-bg/20 p-8 md:flex flex-col justify-center">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-pca-green">Secure Access</h4>
                  <p className="mt-2 text-sm text-pca-muted leading-relaxed">
                    Protecting the coconut industry through data-driven insights and AI diagnostics.
                  </p>
                </div>
                <div className="h-px bg-pca-border w-12" />
                <div className="text-xs text-pca-muted font-medium">
                  Version 0.1.0-beta <br/>
                  © 2024 PCA Negros Occidental
                </div>
              </div>
            </div>

            {/* Form Area: Widens on desktop */}
            <div className="flex-1 py-4 md:py-8 lg:px-4">
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
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs font-medium text-pca-muted/70 md:text-left">
          Philippine Coconut Authority · Negros Occidental Regional Office
        </p>
      </div>
    </div>
  );
}
