/** Normalize barangay labels to Brgy. prefix (display + storage). */
export function normalizeBrgyLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower === "unassigned" || lower === "none") return "Unassigned";
  if (lower.startsWith("brgy.")) {
    return `Brgy. ${trimmed.slice(trimmed.indexOf(".") + 1).trim()}`;
  }
  if (lower.startsWith("brgy ")) {
    return `Brgy. ${trimmed.slice(4).trim()}`;
  }
  if (lower.startsWith("baranggay ")) {
    return `Brgy. ${trimmed.slice(10).trim()}`;
  }
  if (lower.startsWith("barangay ")) {
    return `Brgy. ${trimmed.slice(9).trim()}`;
  }
  return `Brgy. ${trimmed}`;
}

export function displayBrgyLabel(brgy: string): string {
  if (!brgy || brgy === "Unassigned" || brgy === "—") return "None";
  return normalizeBrgyLabel(brgy);
}

export function formatUpperPassword(raw: string): string {
  return raw.toUpperCase().replace(/\s/g, "");
}

function cleanId(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

/**
 * Officer login ID format: LETTERS-####-####
 * - Letters section: max 3 letters, defaults to PCA when only digits are entered
 * - After letters: up to 4 digits, dash, up to 4 digits
 * - Typing stops at 8 total digits
 * Example: PCA-2024-0012
 */
export function formatOfficerLoginId(raw: string): string {
  const up = cleanId(raw);
  const typedLetters = up.replace(/[^A-Z]/g, "").slice(0, 3);
  const letters = typedLetters || (up.replace(/\D/g, "") ? "PCA" : "");
  const digits = up.replace(/[^0-9]/g, "").slice(0, 8);
  const a = digits.slice(0, 4);
  const b = digits.slice(4, 8);
  if (!letters && !digits) return "";
  if (!digits) return letters;
  if (digits.length <= 4) return `${letters}-${a}`;
  return `${letters}-${a}-${b}`;
}

/**
 * Admin login ID format: LETTERS-WORD-###
 * - First letters segment is inferred from the first 3 letters when dashes are omitted
 * - Second letters segment is max 5 letters
 * - Digits at the end: max 3 digits
 * Example: PCA-ADMIN-001
 */
export function formatAdminLoginId(raw: string): string {
  const up = cleanId(raw);
  if (!up) return "";

  const hasDash = up.includes("-");
  const digits = up.replace(/\D/g, "").slice(0, 3);

  if (hasDash) {
    const parts = up.split("-");
    const seg0 = (parts[0] ?? "").replace(/[^A-Z]/g, "").slice(0, 3);
    const rawSeg1 = parts[1] ?? "";
    const seg1 = rawSeg1.replace(/[^A-Z]/g, "").slice(0, 5);
    const implicitSeg2 = rawSeg1.replace(/[^0-9]/g, "");
    const explicitSeg2 = parts.slice(2).join("").replace(/[^0-9]/g, "");
    const seg2 = (explicitSeg2 || implicitSeg2).slice(0, 3);
    if (!seg0) return "";
    if (parts.length === 1) return seg0;
    if (!seg1) return seg2 ? `${seg0}-ADMIN-${seg2}` : `${seg0}-`;
    if (parts.length === 2 && !implicitSeg2) return `${seg0}-${seg1}`;
    if (parts.length === 2) return `${seg0}-${seg1}-${seg2}`;
    return seg2 ? `${seg0}-${seg1}-${seg2}` : `${seg0}-${seg1}-`;
  }

  const letters = up.replace(/[^A-Z]/g, "");
  if (!letters && digits) return `PCA-ADMIN-${digits}`;

  const seg0 = letters.slice(0, 3);
  const seg1 = letters.slice(3, 8);
  if (!seg0) return "";
  if (seg0.length < 3) return seg0;
  if (!seg1 && !digits) return seg0;
  if (!seg1 && digits) return `${seg0}-ADMIN-${digits}`;
  if (!digits) return `${seg0}-${seg1}`;
  return `${seg0}-${seg1}-${digits}`;
}

/**
 * Farmer login ID format: WORD-###
 * - First letters segment (e.g. FARMER): max 6 letters, uppercase
 * - Digits-only entry defaults to FARMER
 * - Digits at the end: max 3 digits
 * Example: FARMER-001
 */
export function formatFarmerId(raw: string): string {
  const up = cleanId(raw);
  if (!up) return "";

  const parts = up.split("-");
  const letters = (parts[0] ?? "").replace(/[^A-Z]/g, "").slice(0, 6);
  const allDigits = up.replace(/\D/g, "").slice(0, 3);
  const seg0 = letters || (allDigits ? "FARMER" : "");
  const seg1 = ((parts.length > 1 ? parts.slice(1).join("") : up).replace(/[^0-9]/g, "") || allDigits).slice(0, 3);
  if (!seg0) return "";
  if (!seg1 && parts.length === 1) return seg0;
  if (!seg1) return `${seg0}-`;
  return `${seg0}-${seg1}`;
}

/** Format typing into PCA-YYYY-NNNN for Add Officer modal (keeps existing behavior). */
export function formatPcaEmployeeId(raw: string): string {
  return formatOfficerLoginId(raw);
}

export function defaultOfficerPassword(empId: string): string {
  const digits = empId.replace(/\D/g, "");
  const last4 = digits.slice(-4).padStart(4, "0");
  return `PCAOFFICER${last4}`;
}
