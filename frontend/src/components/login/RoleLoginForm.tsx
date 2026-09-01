import { IconEye, IconEyeOff, IconLogin } from "@tabler/icons-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { hasAuthToken, isApiEnabled } from "../../services/api";
import { fetchCurrentUser, login as apiLogin } from "../../services/auth";
import type { LoginTab, UserRole } from "../../types/auth";
import {
  formatAdminLoginId,
  formatFarmerId,
  formatOfficerLoginId,
} from "../../utils/pcaFormat";
import LoginHelp from "./LoginHelp";

const ROLE_PATH: Record<UserRole, string> = {
  officer: "/officer",
  farmer: "/farmer",
  admin: "/admin",
};

interface RoleLoginFormProps {
  role: UserRole;
  title: string;
  lead: string;
  idLabel: string;
  idPlaceholder: string;
  headerIcon?: ReactNode;
}

export default function RoleLoginForm({
  role,
  title,
  lead,
  idLabel,
  idPlaceholder,
  headerIcon,
}: RoleLoginFormProps) {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ id: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const usesPcaId = role === "officer" || role === "admin";
  const idMaxLength = role === "farmer" ? 10 : role === "officer" || role === "admin" ? 13 : undefined;

  function onIdChange(raw: string) {
    setFieldErrors((e) => ({ ...e, id: false }));
    const formatted =
      role === "officer"
        ? formatOfficerLoginId(raw)
        : role === "admin"
          ? formatAdminLoginId(raw)
          : role === "farmer"
            ? formatFarmerId(raw)
            : raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setUserId(formatted);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedId = userId.trim();
    const trimmedPass = password.trim();
    const submitId =
      role === "officer"
        ? formatOfficerLoginId(trimmedId)
        : role === "admin"
          ? formatAdminLoginId(trimmedId)
          : role === "farmer"
            ? formatFarmerId(trimmedId)
            : trimmedId;
    const submitPass = trimmedPass;
    const missingId = !submitId;
    const missingPass = !submitPass;
    setFieldErrors({ id: missingId, password: missingPass });
    if (missingId || missingPass) {
      setError("Please fill all the required information.");
      return;
    }

    setIsSubmitting(true);

    const apiResult = await apiLogin({
      id: submitId,
      password: submitPass,
      role,
    });

    if (apiResult.success) {
      if (isApiEnabled() && !hasAuthToken()) {
        setError("Sign-in succeeded but no access token was returned. Try again.");
        setIsSubmitting(false);
        return;
      }
      const me = await fetchCurrentUser();
      if (!me?.userId) {
        setError("Could not load your account. Check the server and try again.");
        setIsSubmitting(false);
        return;
      }
      establishSession(me.userId, role, me?.displayName, me?.assignedBrgy);
      navigate(ROLE_PATH[role], { replace: true });
      setIsSubmitting(false);
      return;
    }

    setError(apiResult.message ?? "That ID or password doesn't match. Check and try again.");
    setIsSubmitting(false);
  }

  const inputClass = (invalid: boolean) =>
    `w-full rounded-[10px] border-[1.5px] bg-pca-bg px-3.5 py-3 text-[15px] outline-none transition-all placeholder:text-[13px] placeholder:text-[#9ca3af] focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)] ${
      invalid
        ? "border-pca-red bg-pca-red-light/30 focus:border-pca-red"
        : "border-pca-border focus:border-pca-green"
    }`;

  return (
    <div className="animate-fade-in px-8 pb-8">
      {headerIcon}
      <div className="mb-[18px]">
        <h1 className="text-[21px] font-bold tracking-tight text-pca-text">{title}</h1>
        <p className="mt-2 text-sm leading-normal text-pca-muted">{lead}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <label className="mb-2 block text-[13px] font-semibold leading-tight text-pca-text">
          {idLabel} <span className="text-pca-red">*</span>
        </label>
        <input
          type="text"
          value={userId}
          onChange={(event) => onIdChange(event.target.value)}
          placeholder={idPlaceholder}
          autoComplete="username"
          maxLength={idMaxLength}
          className={`mb-4 ${inputClass(fieldErrors.id)} ${usesPcaId ? "font-mono uppercase" : ""}`}
        />

        <label className="mb-2 block text-[13px] font-semibold leading-tight text-pca-text">
          Password <span className="text-pca-red">*</span>
        </label>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setFieldErrors((e) => ({ ...e, password: false }));
              setPassword(event.target.value);
            }}
            placeholder="Your password"
            autoComplete="current-password"
            className={`${inputClass(fieldErrors.password)} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-pca-muted hover:bg-pca-bg hover:text-pca-text"
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
          </button>
        </div>
        <p className="-mt-2 mb-4 text-[11px] leading-snug text-pca-muted">
          Use the eye icon to show or hide what you type. Passwords are stored as secure hashes only.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-pca-green px-3.5 py-3.5 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-pca-green-hover hover:shadow-[0_6px_15px_rgba(22,101,52,0.3)] active:translate-y-px active:shadow-[0_2px_5px_rgba(22,101,52,0.2)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          <IconLogin size={18} stroke={2} />
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-pca-red-soft bg-pca-red-light px-3 py-2.5 text-[13px] text-pca-red"
        >
          {error}
        </div>
      )}

      <LoginHelp role={role as LoginTab} />
    </div>
  );
}
