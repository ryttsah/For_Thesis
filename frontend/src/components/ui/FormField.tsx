import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const baseInput =
  "w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors focus:border-pca-green focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)]";

export function fieldClass(invalid?: boolean) {
  return `${baseInput} ${invalid ? "border-pca-red bg-pca-red-light/30" : "border-pca-border bg-white"}`;
}

export function RequiredLabel({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] font-semibold text-pca-text">
      {children} <span className="font-normal text-pca-red">(required)</span>
    </label>
  );
}

export function FormInput({
  label,
  required,
  invalid,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
}) {
  return (
    <div>
      {required ? <RequiredLabel>{label}</RequiredLabel> : <label className="mb-1.5 block text-[13px] font-semibold">{label}</label>}
      <input className={fieldClass(invalid)} {...props} />
    </div>
  );
}

export function FormSelect({
  label,
  required,
  invalid,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  required?: boolean;
  invalid?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      {required ? <RequiredLabel>{label}</RequiredLabel> : <label className="mb-1.5 block text-[13px] font-semibold">{label}</label>}
      <select className={fieldClass(invalid)} {...props}>
        {children}
      </select>
    </div>
  );
}
