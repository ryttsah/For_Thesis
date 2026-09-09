import type {
  ApprovedFarmer,
  AnalysisBreakdownItem,
  AnalysisPhotoDetail,
  BookedSlot,
  FarmRow,
  FarmerNotification,
  FarmerSubmission,
  OfficerRecord,
  PendingRegistration,
  PriorityVisit,
  QueueItem,
  RejectedAudit,
  ScheduledVisit,
  VisitLog,
  SurveyRow,
} from "../types/demoStore";
import { getApiBase, getAuthHeaders, isApiEnabled, parseErrorMessage } from "./api";

type ApiFarm = {
  farmer_id?: string | null;
  name: string;
  owner: string;
  phone?: string | null;
  sector: string;
  brgy: string;
  trees: number;
  status: string;
  last_survey: string;
};

type ApiQueue = {
  id: string;
  brgy: string;
  title: string;
  sub: string;
  conf: string;
  validated?: boolean;
};

type ApiSurvey = {
  id?: string;
  date: string;
  farm: string;
  sector: string;
  brgy: string;
  images: number;
  ai_result: string;
  officer: string;
  status: string;
  confidence_pct?: number;
  majority?: string;
  breakdown?: Record<string, unknown>[];
  per_photo?: Record<string, unknown>[];
  recommendation_title?: string;
  recommendation_description?: string;
  recommendation_heading?: string;
  recommendation_text?: string;
};

type ApiVisit = {
  id: string;
  farm: string;
  owner: string;
  brgy: string;
  date: string;
  slot: "AM" | "PM";
  scheduled_by: string;
  purpose: string;
};

type ApiOfficer = {
  emp_id: string;
  name: string;
  phone: string;
  brgy: string;
  farms_covered: string;
  status: string;
  last_active: string;
};

type ApiPriority = {
  id: string;
  farm: string;
  desc: string;
  level: "urgent" | "high" | "medium";
  due: string;
  assigned: string;
  brgy: string;
  completed?: boolean;
};

type ApiNotification = {
  id: string;
  date_line: string;
  body: string;
  dot: string;
  is_new: boolean;
};

type ApiSubmission = {
  id?: string;
  date: string;
  sector: string;
  tag: string;
  tag_class: "green" | "orange" | "red";
  color: string;
  confidence_pct?: number;
  image_count?: number;
  majority?: string;
  breakdown?: Record<string, unknown>[];
  per_photo?: Record<string, unknown>[];
  recommendation_title?: string;
  recommendation_description?: string;
  recommendation_heading?: string;
  recommendation_text?: string;
};

type ApiVisitLog = {
  id: string; visit_id: string; farm: string; brgy: string; officer_id: string; officer_name: string;
  visited: boolean; officer_comment: string; not_visited_reason: string; recorded_at: string;
  farmer_confirmed: boolean | null; farmer_rating: number | null; farmer_comment: string;
  farmer_report: string; admin_feedback: string; admin_rating: number | null;
  evidence_image?: string;
};

export interface FarmerProfile {
  farmerId: string;
  name: string;
  farm: string;
  sector: string;
  brgy: string;
  municipality: string;
  phone: string;
}

type ApiFarmerProfile = {
  farmer_id: string;
  name: string;
  farm: string;
  sector: string;
  brgy: string;
  municipality: string;
  phone: string;
};

function mapFarm(f: ApiFarm): FarmRow {
  return {
    farmerId: f.farmer_id ?? null,
    name: f.name,
    owner: f.owner,
    phone: f.phone ?? null,
    sector: f.sector,
    brgy: f.brgy,
    trees: f.trees,
    status: f.status as FarmRow["status"],
    lastSurvey: f.last_survey,
  };
}

function mapQueue(q: ApiQueue): QueueItem {
  return {
    id: q.id,
    brgy: q.brgy,
    title: q.title,
    sub: q.sub,
    conf: q.conf,
    validated: q.validated,
  };
}

function mapSurvey(s: ApiSurvey): SurveyRow {
  return {
    id: s.id,
    date: s.date,
    farm: s.farm,
    sector: s.sector,
    brgy: s.brgy,
    images: s.images,
    aiResult: s.ai_result,
    officer: s.officer,
    status: s.status as SurveyRow["status"],
    details: {
      confidencePct: s.confidence_pct ?? 0,
      imageCount: s.images,
      majority: s.majority ?? "",
      breakdown: (s.breakdown ?? []) as unknown as AnalysisBreakdownItem[],
      perPhoto: (s.per_photo ?? []) as unknown as AnalysisPhotoDetail[],
      recommendationTitle: s.recommendation_title ?? "",
      recommendationDescription: s.recommendation_description ?? "",
      recommendationHeading: s.recommendation_heading ?? "",
      recommendationText: s.recommendation_text ?? "",
    },
  };
}

function mapVisit(v: ApiVisit): ScheduledVisit {
  return {
    id: v.id,
    farm: v.farm,
    owner: v.owner,
    brgy: v.brgy,
    date: v.date,
    slot: v.slot,
    scheduledBy: v.scheduled_by,
    purpose: v.purpose,
  };
}

function mapOfficer(o: ApiOfficer): OfficerRecord {
  return {
    empId: o.emp_id,
    name: o.name,
    phone: o.phone,
    brgy: o.brgy,
    farmsCovered: o.farms_covered,
    status: o.status as OfficerRecord["status"],
    lastActive: o.last_active,
  };
}

function mapPriority(p: ApiPriority): PriorityVisit {
  return {
    id: p.id,
    farm: p.farm,
    desc: p.desc,
    level: p.level,
    due: p.due,
    assigned: p.assigned,
    brgy: p.brgy,
    completed: p.completed,
  };
}

function mapNotification(n: ApiNotification): FarmerNotification {
  return {
    id: n.id,
    dateLine: n.date_line,
    body: n.body,
    dot: n.dot,
    isNew: n.is_new,
  };
}

function mapSubmission(s: ApiSubmission): FarmerSubmission {
  return {
    id: s.id,
    date: s.date,
    sector: s.sector,
    tag: s.tag,
    tagClass: s.tag_class,
    color: s.color,
    details: {
      confidencePct: s.confidence_pct ?? 0,
      imageCount: s.image_count ?? 1,
      majority: s.majority ?? "",
      breakdown: (s.breakdown ?? []) as unknown as AnalysisBreakdownItem[],
      perPhoto: (s.per_photo ?? []) as unknown as AnalysisPhotoDetail[],
      recommendationTitle: s.recommendation_title ?? "",
      recommendationDescription: s.recommendation_description ?? "",
      recommendationHeading: s.recommendation_heading ?? "",
      recommendationText: s.recommendation_text ?? "",
    },
  };
}

function mapVisitLog(v: ApiVisitLog): VisitLog {
  return { id: v.id, visitId: v.visit_id, farm: v.farm, brgy: v.brgy, officerId: v.officer_id,
    officerName: v.officer_name, visited: v.visited, officerComment: v.officer_comment,
    notVisitedReason: v.not_visited_reason, recordedAt: v.recorded_at, farmerConfirmed: v.farmer_confirmed,
    farmerRating: v.farmer_rating, farmerComment: v.farmer_comment, farmerReport: v.farmer_report,
    adminFeedback: v.admin_feedback, adminRating: v.admin_rating, evidenceImage: v.evidence_image ?? "" };
}

export interface OfficerDomainData {
  farms: FarmRow[];
  surveys: SurveyRow[];
  queue: QueueItem[];
  scheduledVisits: ScheduledVisit[];
  bookedSlots: BookedSlot[];
  priorityVisits: PriorityVisit[];
  officers: OfficerRecord[];
  visitLogs: VisitLog[];
}

export interface AdminDomainData {
  farms: FarmRow[];
  surveys: SurveyRow[];
  officers: OfficerRecord[];
  scheduledVisits: ScheduledVisit[];
  visitLogs: VisitLog[];
}

export interface FarmerDomainData {
  profile: FarmerProfile | null;
  notifications: FarmerNotification[];
  submissions: FarmerSubmission[];
  visits: ScheduledVisit[];
  visitLogs: VisitLog[];
}

export async function fetchOfficerBootstrap(): Promise<OfficerDomainData | null> {
  if (!isApiEnabled()) return null;
  try {
    const response = await fetch(`${getApiBase()}/bootstrap/officer`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      farms: (data.farms as ApiFarm[]).map(mapFarm),
      surveys: (data.surveys as ApiSurvey[]).map(mapSurvey),
      queue: (data.queue as ApiQueue[]).map(mapQueue),
      scheduledVisits: (data.scheduled_visits as ApiVisit[]).map(mapVisit),
      bookedSlots: (data.booked_slots as { date: string; slot: "AM" | "PM" }[]).map((b) => ({
        date: b.date,
        slot: b.slot,
      })),
      priorityVisits: (data.priority_visits as ApiPriority[]).map(mapPriority),
      officers: (data.officers as ApiOfficer[]).map(mapOfficer),
      visitLogs: ((data.visit_logs ?? []) as ApiVisitLog[]).map(mapVisitLog),
    };
  } catch {
    return null;
  }
}

export async function fetchAdminBootstrap(): Promise<AdminDomainData | null> {
  if (!isApiEnabled()) return null;
  try {
    const response = await fetch(`${getApiBase()}/bootstrap/admin`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      farms: (data.farms as ApiFarm[]).map(mapFarm),
      surveys: (data.surveys as ApiSurvey[]).map(mapSurvey),
      officers: (data.officers as ApiOfficer[]).map(mapOfficer),
      scheduledVisits: (data.scheduled_visits as ApiVisit[]).map(mapVisit),
      visitLogs: ((data.visit_logs ?? []) as ApiVisitLog[]).map(mapVisitLog),
    };
  } catch {
    return null;
  }
}

export async function fetchFarmerBootstrap(): Promise<FarmerDomainData | null> {
  if (!isApiEnabled()) return null;
  try {
    const response = await fetch(`${getApiBase()}/bootstrap/farmer`, {
      headers: getAuthHeaders(),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      profile: data.profile
        ? {
            farmerId: (data.profile as ApiFarmerProfile).farmer_id,
            name: (data.profile as ApiFarmerProfile).name,
            farm: (data.profile as ApiFarmerProfile).farm,
            sector: (data.profile as ApiFarmerProfile).sector,
            brgy: (data.profile as ApiFarmerProfile).brgy,
            municipality: (data.profile as ApiFarmerProfile).municipality,
            phone: (data.profile as ApiFarmerProfile).phone,
          }
        : null,
      notifications: (data.notifications as ApiNotification[]).map(mapNotification),
      submissions: (data.submissions as ApiSubmission[]).map(mapSubmission),
      visits: ((data.visits ?? []) as ApiVisit[]).map(mapVisit),
      visitLogs: ((data.visit_logs ?? []) as ApiVisitLog[]).map(mapVisitLog),
    };
  } catch {
    return null;
  }
}

export async function validateQueueApi(itemId: string): Promise<boolean> {
  if (!isApiEnabled()) return false;
  try {
    const response = await fetch(`${getApiBase()}/queue/${itemId}/validate`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function scheduleVisitApi(payload: {
  farm: string;
  owner: string;
  brgy: string;
  date: string;
  slot: "AM" | "PM";
  scheduledBy: string;
  purpose: string;
  notifyFarmerId?: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/visits/scheduled`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        farm: payload.farm,
        owner: payload.owner,
        brgy: payload.brgy,
        date: payload.date,
        slot: payload.slot,
        scheduled_by: payload.scheduledBy,
        purpose: payload.purpose,
        notify_farmer_id: payload.notifyFarmerId ?? null,
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: await parseErrorMessage(response, "Could not book this visit."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

export async function completePriorityVisitApi(visitId: string): Promise<boolean> {
  if (!isApiEnabled()) return false;
  try {
    const response = await fetch(`${getApiBase()}/visits/priority/${visitId}/complete`, {
      method: "PATCH",
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function updateOfficerDetailsApi(
  empId: string,
  payload: UpdateOfficerPayload,
): Promise<{ ok: boolean; message?: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/officers/${empId}/details`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ name: payload.name, phone: payload.phone }),
    });
    if (!response.ok) {
      return { ok: false, message: await parseErrorMessage(response, "Could not update officer.") };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

export async function assignOfficerApi(empId: string, brgy: string): Promise<boolean> {
  if (!isApiEnabled()) return false;
  try {
    const response = await fetch(`${getApiBase()}/officers/${empId}`, {
      method: "PATCH",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ brgy }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function removeOfficerApi(empId: string): Promise<boolean> {
  if (!isApiEnabled()) return false;
  try {
    const response = await fetch(`${getApiBase()}/officers/${empId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function createFarmerSubmissionApi(
  payload: FarmerSubmission,
  extras?: {
    confidencePct?: number;
    uncertain?: boolean;
    imageCount?: number;
    majority?: string;
    breakdown?: AnalysisBreakdownItem[];
    perPhoto?: AnalysisPhotoDetail[];
    recommendationTitle?: string;
    recommendationDescription?: string;
    recommendationHeading?: string;
    recommendationText?: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  const confidencePct = Math.max(0, Math.min(100, Math.round((extras?.confidencePct ?? 0) * 10) / 10));
  try {
    const response = await fetch(`${getApiBase()}/farmers/me/submissions`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        date_label: payload.date,
        sector: payload.sector,
        tag: payload.tag,
        tag_class: payload.tagClass,
        color: payload.color,
        confidence_pct: confidencePct,
        uncertain: extras?.uncertain ?? false,
        image_count: extras?.imageCount ?? 1,
        majority: extras?.majority ?? payload.details?.majority ?? "",
        breakdown: extras?.breakdown ?? payload.details?.breakdown ?? [],
        per_photo: extras?.perPhoto ?? payload.details?.perPhoto ?? [],
        recommendation_title: extras?.recommendationTitle ?? payload.details?.recommendationTitle ?? "",
        recommendation_description: extras?.recommendationDescription ?? payload.details?.recommendationDescription ?? "",
        recommendation_heading: extras?.recommendationHeading ?? payload.details?.recommendationHeading ?? "",
        recommendation_text: extras?.recommendationText ?? payload.details?.recommendationText ?? "",
      }),
    });
    if (!response.ok) {
      return {
        ok: false,
        message: await parseErrorMessage(response, "Could not send this result to PCA."),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Cannot reach the server. Please try again." };
  }
}

export async function recordVisitOutcomeApi(visitId: string, payload: { visited: boolean; officerComment: string; notVisitedReason: string; evidenceImage?: string }): Promise<{ ok: boolean; message?: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/visits/${visitId}/outcome`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ visited: payload.visited, officer_comment: payload.officerComment, not_visited_reason: payload.notVisitedReason, evidence_image: payload.evidenceImage ?? "" }) });
    return response.ok ? { ok: true } : { ok: false, message: await parseErrorMessage(response, "Could not save the visit log.") };
  } catch { return { ok: false, message: "Could not reach the server." }; }
}

export async function submitFarmerVisitFeedbackApi(visitId: string, payload: { farmerConfirmed: boolean; rating?: number; comment: string; report: string }): Promise<{ ok: boolean; message?: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/visits/${visitId}/farmer-feedback`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify({ farmer_confirmed: payload.farmerConfirmed, rating: payload.rating ?? null, comment: payload.comment, report: payload.report }) });
    return response.ok ? { ok: true } : { ok: false, message: await parseErrorMessage(response, "Could not save your feedback.") };
  } catch { return { ok: false, message: "Could not reach the server." }; }
}

export async function submitAdminVisitFeedbackApi(visitId: string, payload: { feedback: string; rating: number }): Promise<{ ok: boolean; message?: string }> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/visits/${visitId}/admin-feedback`, { method: "POST", headers: { ...getAuthHeaders(), "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    return response.ok ? { ok: true } : { ok: false, message: await parseErrorMessage(response, "Could not save admin feedback.") };
  } catch { return { ok: false, message: "Could not reach the server." }; }
}

export interface CreateOfficerPayload {
  empId: string;
  name: string;
  phone: string;
  password?: string;
}

export interface UpdateOfficerPayload {
  name: string;
  phone: string;
}

export interface CreateOfficerResult {
  ok: boolean;
  initialPassword?: string;
  loginNote?: string;
  message?: string;
}

export async function createOfficerApi(payload: CreateOfficerPayload): Promise<CreateOfficerResult> {
  if (!isApiEnabled()) return { ok: false, message: "API not configured." };
  try {
    const response = await fetch(`${getApiBase()}/officers`, {
      method: "POST",
      headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        emp_id: payload.empId,
        name: payload.name,
        phone: payload.phone,
        brgy: "Unassigned",
        password: payload.password,
      }),
    });
    if (!response.ok) {
      return { ok: false, message: await parseErrorMessage(response, "Could not add officer.") };
    }
    const data = (await response.json()) as { initial_password: string; login_note: string };
    return { ok: true, initialPassword: data.initial_password, loginNote: data.login_note };
  } catch {
    return { ok: false, message: "Could not reach the server." };
  }
}

/** Refresh officer + admin shared lists after a mutation. */
export async function refreshOfficerDomain(): Promise<OfficerDomainData | null> {
  return fetchOfficerBootstrap();
}

export type RegistrationBundle = {
  pending: PendingRegistration[];
  approved: ApprovedFarmer[];
  rejected: RejectedAudit[];
};
