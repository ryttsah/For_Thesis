import type { ApprovedFarmer, PendingRegistration, RejectedAudit } from "../types/demoStore";
import { getApiBase, getAuthHeaders, isApiEnabled, parseErrorMessage } from "./api";

export interface RegistrationSubmitPayload {
  firstName: string;
  middleInitial: string;
  lastName: string;
  farmAddress: string;
  brgy: string;
  municipality: string;
  province: string;
  areaHectares: number;
  areaInputUnit: "ha" | "sqm";
  areaInputValue: number;
  farmStatus: string;
  phone: string;
  altPhone: string;
  regPurposeType: string;
  regPurposeOtherText: string;
}

export async function submitRegistration(
  payload: RegistrationSubmitPayload,
): Promise<{ success: true; farmerId: string } | { success: false; message: string }> {
  if (!isApiEnabled()) {
    return { success: false, message: "API URL is not configured." };
  }

  try {
    const response = await fetch(`${getApiBase()}/registrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: payload.firstName,
        middle_initial: payload.middleInitial,
        last_name: payload.lastName,
        farm_address: payload.farmAddress,
        brgy: payload.brgy,
        municipality: payload.municipality,
        province: payload.province,
        area_hectares: payload.areaHectares,
        area_input_unit: payload.areaInputUnit,
        area_input_value: payload.areaInputValue,
        farm_status: payload.farmStatus,
        phone: payload.phone,
        alt_phone: payload.altPhone,
        reg_purpose_type: payload.regPurposeType,
        reg_purpose_other_text: payload.regPurposeOtherText,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: await parseErrorMessage(response, "Could not submit registration."),
      };
    }

    const data = (await response.json()) as { farmer_id: string };
    return { success: true, farmerId: data.farmer_id };
  } catch {
    return { success: false, message: "Cannot reach the server. Try again later." };
  }
}

type ApiPending = {
  id: string;
  farmer_id: string;
  applied: string;
  first_name: string;
  middle_initial: string;
  last_name: string;
  farm_address: string;
  brgy: string;
  municipality: string;
  province: string;
  area_hectares: number;
  area_input_unit: "ha" | "sqm";
  area_input_value: number;
  farm_status: string;
  phone: string;
  alt_phone: string;
  reg_purpose_type: string;
  reg_purpose_other_text: string;
};

function mapPending(row: ApiPending): PendingRegistration {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    applied: row.applied,
    firstName: row.first_name,
    middleInitial: row.middle_initial,
    lastName: row.last_name,
    farmAddress: row.farm_address,
    brgy: row.brgy,
    municipality: row.municipality,
    province: row.province,
    areaHectares: row.area_hectares,
    areaInputUnit: row.area_input_unit,
    areaInputValue: row.area_input_value,
    farmStatus: row.farm_status,
    phone: row.phone,
    altPhone: row.alt_phone,
    regPurposeType: row.reg_purpose_type,
    regPurposeOtherText: row.reg_purpose_other_text,
  };
}

export async function fetchAdminRegistrations(): Promise<{
  pending: PendingRegistration[];
  approved: ApprovedFarmer[];
  rejected: RejectedAudit[];
} | null> {
  if (!isApiEnabled()) return null;

  const base = getApiBase();
  const headers = { ...getAuthHeaders(), "Content-Type": "application/json" };

  try {
    const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
      fetch(`${base}/registrations/pending`, { headers }),
      fetch(`${base}/registrations/approved`, { headers }),
      fetch(`${base}/registrations/rejected`, { headers }),
    ]);

    if (!pendingRes.ok || !approvedRes.ok || !rejectedRes.ok) {
      return null;
    }

    const pending = (await pendingRes.json()) as ApiPending[];
    const approved = (await approvedRes.json()) as {
      name: string;
      farmer_id: string;
      brgy: string;
      approved_date: string;
      approved_by: string;
    }[];
    const rejected = (await rejectedRes.json()) as {
      farmer_id: string;
      reason: string;
      when_label: string;
    }[];

    return {
      pending: pending.map(mapPending),
      approved: approved.map((a) => ({
        name: a.name,
        farmerId: a.farmer_id,
        brgy: a.brgy,
        approvedDate: a.approved_date,
        approvedBy: a.approved_by,
      })),
      rejected: rejected.map((r) => ({
        farmerId: r.farmer_id,
        reason: r.reason,
        whenLabel: r.when_label,
      })),
    };
  } catch {
    return null;
  }
}

export interface ApproveRegistrationResult {
  ok: boolean;
  farmerId?: string;
  initialPassword?: string;
  loginNote?: string;
  message?: string;
}

export async function approveRegistrationApi(
  registrationId: string,
): Promise<ApproveRegistrationResult> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };

  try {
    const response = await fetch(`${getApiBase()}/registrations/${registrationId}/approve`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      return { ok: false, message: await parseErrorMessage(response, "Approval failed.") };
    }
    const data = (await response.json()) as {
      farmer_id: string;
      initial_password?: string;
      login_note?: string;
    };
    return {
      ok: true,
      farmerId: data.farmer_id,
      initialPassword: data.initial_password,
      loginNote: data.login_note,
    };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

export async function rejectRegistrationApi(
  registrationId: string,
  reason: string,
): Promise<boolean> {
  if (!isApiEnabled()) return false;

  try {
    const response = await fetch(`${getApiBase()}/registrations/${registrationId}/reject`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    return response.ok;
  } catch {
    return false;
  }
}
