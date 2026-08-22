export type FarmStatus = "healthy" | "caution" | "risk" | "pending";
export type PestType = "healthy" | "yellowing" | "scale insect" | "rhino beetle";

export interface QueueItem {
  id: string;
  brgy: string;
  title: string;
  sub: string;
  conf: string;
  validated?: boolean;
}

export interface FarmRow {
  name: string;
  owner: string;
  sector: string;
  brgy: string;
  trees: number;
  status: FarmStatus;
  lastSurvey: string;
}

export interface SurveyRow {
  date: string;
  farm: string;
  sector: string;
  brgy: string;
  images: number;
  aiResult: string;
  officer: string;
  status: FarmStatus | "review";
}

export interface PendingRegistration {
  id: string;
  farmerId: string;
  applied: string;
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

export interface ApprovedFarmer {
  name: string;
  farmerId: string;
  brgy: string;
  approvedDate: string;
  approvedBy: string;
}

export interface RejectedAudit {
  farmerId: string;
  reason: string;
  whenLabel: string;
}

export interface ScheduledVisit {
  id: string;
  farm: string;
  owner: string;
  brgy: string;
  date: string;
  slot: "AM" | "PM";
  scheduledBy: string;
  purpose: string;
}

export interface BookedSlot {
  date: string;
  slot: "AM" | "PM";
}

export interface FarmerNotification {
  id: string;
  dateLine: string;
  body: string;
  dot: string;
  isNew: boolean;
}

export interface OfficerRecord {
  empId: string;
  name: string;
  phone: string;
  brgy: string;
  farmsCovered: string;
  status: "Active" | "Inactive";
  lastActive: string;
}

export interface PriorityVisit {
  id: string;
  farm: string;
  desc: string;
  level: "urgent" | "high" | "medium";
  due: string;
  assigned: string;
  brgy: string;
  completed?: boolean;
}

export interface SectorDetail {
  label: string;
  brgy: string;
  trees: number;
  issues: number;
  atRisk: number;
  status: FarmStatus;
  statusLabel: string;
  report: string;
  conditions: { label: string; count: number; color: string; bg: string }[];
  imageLabels: string[];
}

export interface FarmerSubmission {
  date: string;
  sector: string;
  tag: string;
  tagClass: "green" | "orange" | "red";
  color: string;
}
