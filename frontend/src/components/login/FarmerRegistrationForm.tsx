import { IconCheck, IconSend, IconUserPlus } from "@tabler/icons-react";
import { useState, type FormEvent } from "react";
import { SQ_METERS_PER_HECTARE } from "../../constants/demoData";
import { useDemoStore } from "../../context/DemoStoreContext";
import { isApiEnabled } from "../../services/api";
import { submitRegistration } from "../../services/registrations";

const CITY_MUNICIPALITY_OPTIONS = {
  City: [
    "Bacolod City (Capital)",
    "Bago City",
    "Cadiz City",
    "Escalante City",
    "Himamaylan City",
    "Kabankalan City",
    "La Carlota City",
    "Sagay City",
    "San Carlos City",
    "Silay City",
    "Sipalay City",
    "Talisay City",
    "Victorias City",
  ],
  Municipality: [
    "Binalbagan",
    "Calatrava",
    "Candoni",
    "Cauayan",
    "Don Salvador Benedicto",
    "Enrique B. Magalona",
    "Hinigaran",
    "Hinoba-an",
    "Ilog",
    "Isabela",
    "La Castellana",
    "Manapla",
    "Moises Padilla",
    "Murcia",
    "Pontevedra",
    "Pulupandan",
    "San Enrique",
    "Toboso",
    "Valladolid",
  ],
};

interface FarmerRegistrationFormProps {
  onBackToSignIn: () => void;
}

function computeHectares(raw: string, unit: string) {
  const n = Number(raw.replace(",", "."));
  if (!isFinite(n) || n <= 0) return null;
  return unit === "sqm" ? n / SQ_METERS_PER_HECTARE : n;
}

function sanitizeLetters(raw: string) {
  // Letters + spaces + common name punctuation only (no digits/special symbols).
  return raw.replace(/[^A-Za-zÀ-ÿ.' -]/g, "");
}

function sanitizeBrgy(raw: string) {
  // Allow letters, spaces, dot, hyphen, apostrophe.
  return raw.replace(/[^A-Za-zÀ-ÿ.' -]/g, "");
}

function formatMiddleInitial(raw: string) {
  return sanitizeLetters(raw).trim().slice(0, 1).toUpperCase();
}

function formatPhonePH(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  // Prefer 11-digit PH mobile numbers (09xx-xxx-xxxx)
  const a = digits.slice(0, 4);
  const b = digits.slice(4, 7);
  const c = digits.slice(7, 11);
  if (!digits) return "";
  if (digits.length <= 4) return a;
  if (digits.length <= 7) return `${a}-${b}`;
  return `${a}-${b}-${c}`;
}

function clampTwoDecimals(raw: string) {
  const cleaned = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "");
  const [intPart, decPart = ""] = cleaned.split(".");
  const dec = decPart.slice(0, 2);
  return dec.length ? `${intPart || "0"}.${dec}` : intPart;
}

export default function FarmerRegistrationForm({ onBackToSignIn }: FarmerRegistrationFormProps) {
  const { addPendingRegistration } = useDemoStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState("");
  const [showPurposeOther, setShowPurposeOther] = useState(false);
  const [noMiddleInitial, setNoMiddleInitial] = useState(false);
  const [middleInitial, setMiddleInitial] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");
  const [areaUnit, setAreaUnit] = useState<"ha" | "sqm">("ha");
  const [areaValue, setAreaValue] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const brgy = String(data.get("brgy") ?? "").trim();
    const municipality = String(data.get("municipality") ?? "").trim();
    const farmStatus = data.get("farmStatus");
    const area = areaValue.trim();

    if (!firstName || !lastName || !brgy || !municipality || !phone || !farmStatus || !area) {
      setError("Please fill in all required fields marked with *.");
      return;
    }

    if (showPurposeOther && !String(data.get("regPurposeOther") ?? "").trim()) {
      setError("Please specify your registration purpose.");
      return;
    }

    const hectares = computeHectares(area, areaUnit);
    if (!hectares) {
      setError("Please enter a valid farm area.");
      return;
    }

    setIsSubmitting(true);

    const payload = {
      firstName,
      middleInitial: noMiddleInitial ? "" : middleInitial.trim(),
      lastName,
      farmAddress: String(data.get("farmAddress") ?? "").trim(),
      brgy,
      municipality,
      province: String(data.get("province") ?? "Negros Occidental"),
      areaHectares: hectares,
      areaInputUnit: areaUnit,
      areaInputValue: Number(area.replace(",", ".")),
      farmStatus: String(farmStatus),
      phone,
      altPhone,
      regPurposeType: String(data.get("regPurpose") ?? "registration_only"),
      regPurposeOtherText: String(data.get("regPurposeOther") ?? "").trim(),
    };

    let farmerId: string;

    if (isApiEnabled()) {
      const apiResult = await submitRegistration(payload);
      if (!apiResult.success) {
        setIsSubmitting(false);
        setError(apiResult.message);
        return;
      }
      farmerId = apiResult.farmerId;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 900));
      farmerId = addPendingRegistration(payload);
    }

    setIsSubmitting(false);

    const fullName = `${firstName} ${lastName}`;
    const areaDisp = `${area} ${areaUnit === "sqm" ? "m²" : "ha"}`;

    setDoneMessage(
      `Thanks, ${fullName}. We received your farm registration in ${brgy}, ${municipality} (${areaDisp}, ${farmStatus}). PCA will contact you at ${phone} after review. Your application reference is ${farmerId}.`,
    );
    setIsDone(true);
    form.reset();
    setNoMiddleInitial(false);
    setMiddleInitial("");
    setPhone("");
    setAltPhone("");
    setAreaUnit("ha");
    setAreaValue("");
  }

  if (isDone) {
    return (
      <div className="animate-fade-in px-8 pb-8 text-center">
        <div className="mx-auto mb-3.5 flex h-[52px] w-[52px] animate-done-pop items-center justify-center rounded-full bg-pca-green-light text-pca-green">
          <IconCheck size={26} stroke={2.5} />
        </div>
        <p className="mb-4 text-sm leading-relaxed text-pca-muted">{doneMessage}</p>
        <button
          type="button"
          onClick={() => {
            setIsDone(false);
            onBackToSignIn();
          }}
          className="w-full rounded-[10px] border-[1.5px] border-pca-border bg-white px-3 py-3 text-[13px] font-semibold text-pca-text transition-colors hover:border-[#d1d5db] hover:bg-pca-bg"
        >
          Back to farmer sign-in
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-8 pb-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pca-green-light text-pca-green">
        <IconUserPlus size={24} stroke={2} />
      </div>

      <div className="mb-[18px]">
        <h1 className="text-[21px] font-bold tracking-tight text-pca-text">Farmer registration</h1>
        <p className="mt-2 text-sm leading-normal text-pca-muted">
          Tell us who you are and where your coconut farm is. PCA staff review every signup.
        </p>
      </div>

      <p className="-mt-2 mb-[18px] rounded-[10px] border border-pca-border bg-pca-bg px-3 py-2.5 text-xs leading-[1.45] text-pca-muted">
        You&apos;re on the farmer signup page only — officer and administrator sign-in stays hidden until you tap{" "}
        <strong className="text-pca-text">Back</strong>.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-3 rounded-lg border border-pca-red-soft bg-pca-red-light px-3 py-2.5 text-[13px] text-pca-red"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={isSubmitting ? "pointer-events-none opacity-80" : ""}>
        <Field
          label="First name"
          name="firstName"
          required
          placeholder="e.g. Juan"
          onValue={(v) => sanitizeLetters(v)}
        />

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">
          Middle initial{!noMiddleInitial && <span className="text-pca-red">*</span>}
        </label>
        <div className="mb-2 flex items-center gap-3">
          <input
            name="middleInitial"
            value={middleInitial}
            onChange={(e) => setMiddleInitial(formatMiddleInitial(e.target.value))}
            disabled={noMiddleInitial}
            required={!noMiddleInitial}
            placeholder={noMiddleInitial ? "N/A" : "e.g. S"}
            maxLength={1}
            className="w-[120px] rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] uppercase outline-none transition-all placeholder:text-[13px] placeholder:text-[#9ca3af] focus:border-pca-green focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)] disabled:opacity-60"
          />
          <label className="flex items-center gap-2 text-[13px] text-pca-muted">
            <input
              type="checkbox"
              checked={noMiddleInitial}
              onChange={(e) => {
                const checked = e.target.checked;
                setNoMiddleInitial(checked);
                if (checked) setMiddleInitial("");
              }}
              className="h-4 w-4 accent-pca-green"
            />
            No middle initial
          </label>
        </div>

        <Field
          label="Last name"
          name="lastName"
          required
          placeholder="e.g. Dela Cruz"
          onValue={(v) => sanitizeLetters(v)}
        />
        <Field
          label="Farm address (Street / Sitio / Purok)"
          name="farmAddress"
          required
          placeholder="e.g. Sitio Proper, Purok 4"
        />
        <Field
          label="Barangay"
          name="brgy"
          required
          placeholder="Type your barangay name"
          onValue={(v) => sanitizeBrgy(v)}
        />

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">
          City / Municipality<span className="text-pca-red">*</span>
        </label>
        <select
          name="municipality"
          required
          defaultValue=""
          className="mb-4 w-full appearance-none rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg bg-[length:16px] bg-[position:right_12px_center] bg-no-repeat px-3.5 py-3 pr-10 text-[15px] outline-none focus:border-pca-green focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.08)]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
          }}
        >
          <option value="">Select city or municipality</option>
          {Object.entries(CITY_MUNICIPALITY_OPTIONS).map(([category, places]) => (
            <optgroup key={category} label={category}>
              {places.map((place) => (
                <option key={place} value={place}>
                  {place}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">Province</label>
        <input
          name="province"
          type="text"
          readOnly
          defaultValue="Negros Occidental"
          className="mb-4 w-full rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] text-pca-muted"
        />

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">
          Farm area<span className="text-pca-red">*</span>
        </label>
        <div className="mb-1 flex gap-2.5">
          <input
            name="area"
            type="text"
            inputMode="decimal"
            required
            placeholder="Enter area"
            value={areaValue}
            onChange={(e) => setAreaValue(clampTwoDecimals(e.target.value))}
            className="min-w-0 flex-1 rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] outline-none focus:border-pca-green focus:bg-white"
          />
          <select
            name="areaUnit"
            value={areaUnit}
            onChange={(e) => {
              const next = (e.target.value as "ha" | "sqm") ?? "ha";
              if (!areaValue) {
                setAreaUnit(next);
                return;
              }
              const n = Number(areaValue.replace(",", "."));
              if (!isFinite(n) || n <= 0) {
                setAreaUnit(next);
                return;
              }
              const converted = next === "sqm" ? n * SQ_METERS_PER_HECTARE : n / SQ_METERS_PER_HECTARE;
              setAreaUnit(next);
              setAreaValue(String(Math.round(converted * 100) / 100));
            }}
            className="w-[140px] shrink-0 rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-2 py-3 text-sm outline-none"
          >
            <option value="ha">Hectares (ha)</option>
            <option value="sqm">Square meters (m²)</option>
          </select>
        </div>
        <p className="mb-4 text-xs text-pca-muted">
          1 ha = 10,000 m² (exact). Up to 2 decimals. Switching units converts automatically.
        </p>

        <p className="mb-2 text-[13px] font-semibold text-pca-text">
          Farm status<span className="text-pca-red">*</span>
        </p>
        <div className="mb-4 grid gap-2">
          <RadioCard name="farmStatus" value="Bearing" title="Bearing" subtitle="Trees are currently producing coconuts." />
          <RadioCard
            name="farmStatus"
            value="Non-bearing"
            title="Non-bearing"
            subtitle="Trees are not yet producing."
          />
        </div>

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">
          Contact number<span className="text-pca-red">*</span>
        </label>
        <input
          name="phone"
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(formatPhonePH(e.target.value))}
          placeholder="0912-345-6789"
          inputMode="tel"
          className="mb-4 w-full rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] outline-none transition-all placeholder:text-[13px] placeholder:text-[#9ca3af] focus:border-pca-green focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)]"
        />

        <label className="mb-2 block text-[13px] font-semibold text-pca-text">
          Alternative contact number (optional)
        </label>
        <input
          name="altPhone"
          type="tel"
          value={altPhone}
          onChange={(e) => setAltPhone(formatPhonePH(e.target.value))}
          placeholder="0912-345-6789"
          inputMode="tel"
          className="mb-4 w-full rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] outline-none transition-all placeholder:text-[13px] placeholder:text-[#9ca3af] focus:border-pca-green focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)]"
        />

        <p className="mb-2 text-[13px] font-semibold text-pca-text">
          Purpose of registration<span className="text-pca-red">*</span>
        </p>
        <div className="mb-4 grid gap-2">
          <RadioCard
            name="regPurpose"
            value="registration_only"
            title="Registration only"
            subtitle="You are signing up for a farmer account only."
            defaultChecked
            onSelect={() => setShowPurposeOther(false)}
          />
          <RadioCard
            name="regPurpose"
            value="other"
            title="Other reason(s)"
            subtitle="PCA staff will read your note when reviewing."
            onSelect={() => setShowPurposeOther(true)}
          />
        </div>

        {showPurposeOther && (
          <Field
            label="Please specify"
            name="regPurposeOther"
            required
            placeholder="e.g. Request advisory visit, report pest outbreak"
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-pca-green px-3.5 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-pca-green-hover disabled:opacity-70"
        >
          {isSubmitting ? (
            <>
              <span className="flex gap-1" aria-hidden="true">
                <span className="login-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                <span className="login-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
                <span className="login-dot inline-block h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              Sending...
            </>
          ) : (
            <>
              <IconSend size={18} stroke={2} />
              Send registration
            </>
          )}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
  maxLength,
  onValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  maxLength?: number;
  onValue?: (value: string) => string;
}) {
  return (
    <>
      <label className="mb-2 block text-[13px] font-semibold text-pca-text">
        {label}
        {required && <span className="text-pca-red">*</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        maxLength={maxLength}
        onInput={(e) => {
          if (!onValue) return;
          const el = e.currentTarget;
          const next = onValue(el.value);
          if (next !== el.value) el.value = next;
        }}
        className="mb-4 w-full rounded-[10px] border-[1.5px] border-pca-border bg-pca-bg px-3.5 py-3 text-[15px] outline-none transition-all placeholder:text-[13px] placeholder:text-[#9ca3af] focus:border-pca-green focus:bg-white focus:shadow-[0_0_0_3px_rgba(22,101,52,0.12)]"
      />
    </>
  );
}

function RadioCard({
  name,
  value,
  title,
  subtitle,
  defaultChecked,
  onSelect,
}: {
  name: string;
  value: string;
  title: string;
  subtitle: string;
  defaultChecked?: boolean;
  onSelect?: () => void;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border-[1.5px] border-pca-border bg-pca-bg p-3 transition-colors has-[:checked]:border-pca-green has-[:checked]:bg-pca-green-light">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        required
        onChange={onSelect}
        className="mt-1 accent-pca-green"
      />
      <span>
        <span className="block text-sm font-semibold text-pca-text">{title}</span>
        <span className="block text-xs text-pca-muted">{subtitle}</span>
      </span>
    </label>
  );
}
