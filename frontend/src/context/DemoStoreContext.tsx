import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SQ_METERS_PER_HECTARE } from "../constants/demoData";
import type {
  ApprovedFarmer,
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
} from "../types/demoStore";

interface DemoStoreValue {
  queue: QueueItem[];
  farms: FarmRow[];
  surveys: SurveyRow[];
  pendingRegistrations: PendingRegistration[];
  approvedFarmers: ApprovedFarmer[];
  rejectedAudit: RejectedAudit[];
  scheduledVisits: ScheduledVisit[];
  bookedSlots: BookedSlot[];
  farmerNotifications: FarmerNotification[];
  officers: OfficerRecord[];
  priorityVisits: PriorityVisit[];
  farmerSubmissions: FarmerSubmission[];
  adminFarmFilter: string | null;
  selectedPendingId: string | null;
  assignToast: string | null;
  pendingCount: number;
  queuePendingCount: number;
  validateQueueItem: (id: string) => void;
  addPendingRegistration: (reg: Omit<PendingRegistration, "id" | "farmerId" | "applied">) => string;
  approveFarmer: (id: string) => void;
  rejectFarmer: (id: string, reason: string) => void;
  selectPending: (id: string | null) => void;
  bookVisit: (visit: Omit<ScheduledVisit, "id">, slot: BookedSlot) => void;
  completePriorityVisit: (id: string) => void;
  assignOfficer: (empId: string, brgy: string) => void;
  unassignOfficer: (empId: string) => void;
  removeOfficer: (empId: string) => void;
  setAdminFarmFilter: (brgy: string | null) => void;
  addFarmerNotification: (n: Omit<FarmerNotification, "id">) => void;
  addFarmerSubmission: (s: FarmerSubmission) => void;
  appendFarmFromRegistration: (reg: PendingRegistration) => void;
  syncRegistrationData: (data: {
    pending: PendingRegistration[];
    approved: ApprovedFarmer[];
    rejected: RejectedAudit[];
  }) => void;
  syncOfficerDomain: (data: {
    farms: FarmRow[];
    surveys: SurveyRow[];
    queue: QueueItem[];
    scheduledVisits: ScheduledVisit[];
    bookedSlots: BookedSlot[];
    priorityVisits: PriorityVisit[];
    officers: OfficerRecord[];
  }) => void;
  syncAdminDomain: (data: {
    farms: FarmRow[];
    surveys: SurveyRow[];
    officers: OfficerRecord[];
    scheduledVisits: ScheduledVisit[];
  }) => void;
  syncFarmerDomain: (data: {
    notifications: FarmerNotification[];
    submissions: FarmerSubmission[];
  }) => void;
}

type SurveyRow = import("../types/demoStore").SurveyRow;

const DemoStoreContext = createContext<DemoStoreValue | null>(null);

let nextPendingId = 100;
let nextFarmerId = 49;

function formatArea(ha: number) {
  const sq = ha * SQ_METERS_PER_HECTARE;
  return `${ha.toFixed(2)} ha (${sq.toLocaleString("en-PH", { maximumFractionDigits: 0 })} m²)`;
}

export function DemoStoreProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [farms, setFarms] = useState<FarmRow[]>([]);
  const [surveys, setSurveys] = useState<SurveyRow[]>([]);
  const [pendingRegistrations, setPending] = useState<PendingRegistration[]>([]);
  const [approvedFarmers, setApproved] = useState<ApprovedFarmer[]>([]);
  const [rejectedAudit, setRejectedAudit] = useState<RejectedAudit[]>([]);
  const [scheduledVisits, setVisits] = useState<ScheduledVisit[]>([]);
  const [bookedSlots, setBooked] = useState<BookedSlot[]>([]);
  const [farmerNotifications, setNotifs] = useState<FarmerNotification[]>([]);
  const [officers, setOfficers] = useState<OfficerRecord[]>([]);
  const [priorityVisits, setPriority] = useState<PriorityVisit[]>([]);
  const [farmerSubmissions, setSubmissions] = useState<FarmerSubmission[]>([]);
  const [adminFarmFilter, setAdminFarmFilter] = useState<string | null>(null);
  const [selectedPendingId, setSelectedPendingId] = useState<string | null>(null);
  const [assignToast, setAssignToast] = useState<string | null>(null);

  const pendingCount = pendingRegistrations.length;
  const queuePendingCount = queue.filter((q) => !q.validated).length;

  const validateQueueItem = useCallback((id: string) => {
    setQueue((prev) =>
      prev.map((q) => (q.id === id ? { ...q, validated: true } : q)),
    );
  }, []);

  const addPendingRegistration = useCallback(
    (data: Omit<PendingRegistration, "id" | "farmerId" | "applied">) => {
      const id = String(nextPendingId++);
      const farmerId = `FARMER-${String(nextFarmerId++).padStart(3, "0")}`;
      const reg: PendingRegistration = {
        ...data,
        id,
        farmerId,
        applied: new Date().toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      };
      setPending((p) => [...p, reg]);
      return farmerId;
    },
    [],
  );

  const appendFarmFromRegistration = useCallback((reg: PendingRegistration) => {
    const name = `${reg.lastName} Farm`;
    setFarms((f) => [
      {
        farmerId: reg.farmerId,
        name,
        owner: `${reg.firstName} ${reg.lastName.charAt(0)}.`,
        phone: reg.phone,
        sector: "— (survey pending)",
        brgy: reg.brgy,
        trees: Math.max(10, Math.round(reg.areaHectares * 45)),
        status: "pending",
        lastSurvey: "—",
      },
      ...f,
    ]);
  }, []);

  const approveFarmer = useCallback((id: string) => {
    setPending((p) => {
      const reg = p.find((x) => x.id === id);
      if (!reg) return p;
      setApproved((a) => [
        {
          name: [reg.firstName, reg.middleInitial, reg.lastName].filter(Boolean).join(" "),
          farmerId: reg.farmerId,
          brgy: reg.brgy,
          approvedDate: new Date().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          approvedBy: "PCA Administrator",
        },
        ...a,
      ]);
      setFarms((f) => [
        {
          farmerId: reg.farmerId,
          name: `${reg.lastName} Farm`,
          owner: `${reg.firstName} ${reg.lastName.charAt(0)}.`,
          phone: reg.phone,
          sector: "— (survey pending)",
          brgy: reg.brgy,
          trees: Math.max(10, Math.round(reg.areaHectares * 45)),
          status: "pending",
          lastSurvey: "—",
        },
        ...f,
      ]);
      setSelectedPendingId(null);
      return p.filter((x) => x.id !== id);
    });
  }, []);

  const rejectFarmer = useCallback((id: string, reason: string) => {
    setPending((p) => {
      const reg = p.find((x) => x.id === id);
      if (!reg) return p;
      setRejectedAudit((r) => [
        {
          farmerId: reg.farmerId,
          reason,
          whenLabel: new Date().toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        },
        ...r,
      ]);
      setSelectedPendingId(null);
      return p.filter((x) => x.id !== id);
    });
  }, []);

  const selectPending = useCallback((id: string | null) => {
    setSelectedPendingId(id);
  }, []);

  const addFarmerNotification = useCallback((n: Omit<FarmerNotification, "id">) => {
    setNotifs((list) => [{ ...n, id: `n${Date.now()}` }, ...list]);
  }, []);

  const bookVisit = useCallback(
    (visit: Omit<ScheduledVisit, "id">, slot: BookedSlot) => {
      setVisits((v) => [{ ...visit, id: `visit${Date.now()}` }, ...v]);
      setBooked((b) => [...b, slot]);
      const dateDisp = new Date(visit.date + "T12:00:00").toLocaleDateString("en-PH", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const slotLabel = visit.slot === "AM" ? "8:00 AM - 11:30 AM" : "1:00 PM - 4:30 PM";
      addFarmerNotification({
        dateLine: `${dateDisp} | ${slotLabel}`,
        body: `Farm visit scheduled by your PCA officer for ${visit.farm}. Please prepare access to the plot.`,
        dot: "#ea580c",
        isNew: true,
      });
    },
    [addFarmerNotification],
  );

  const completePriorityVisit = useCallback((id: string) => {
    setPriority((p) => p.map((v) => (v.id === id ? { ...v, completed: true } : v)));
  }, []);

  const assignOfficer = useCallback((empId: string, brgy: string) => {
    setOfficers((o) =>
      o.map((row) =>
        row.empId === empId
          ? {
              ...row,
              brgy: brgy === "__UNASSIGN__" ? "Unassigned" : brgy,
              farmsCovered: brgy === "__UNASSIGN__" ? "—" : "—",
              status: brgy === "__UNASSIGN__" ? "Inactive" : "Active",
            }
          : row,
      ),
    );
    setAssignToast(
      brgy === "__UNASSIGN__"
        ? "Officer posting cleared (unassigned)."
        : `Officer assigned to ${brgy}.`,
    );
    setTimeout(() => setAssignToast(null), 4000);
  }, []);

  const unassignOfficer = useCallback(
    (empId: string) => assignOfficer(empId, "__UNASSIGN__"),
    [assignOfficer],
  );

  const removeOfficer = useCallback((empId: string) => {
    setOfficers((o) => o.filter((row) => row.empId !== empId));
    setAssignToast("Officer removed from the roster.");
    setTimeout(() => setAssignToast(null), 4000);
  }, []);

  const addFarmerSubmission = useCallback((s: FarmerSubmission) => {
    setSubmissions((list) => [s, ...list]);
  }, []);

  const syncRegistrationData = useCallback(
    (data: {
      pending: PendingRegistration[];
      approved: ApprovedFarmer[];
      rejected: RejectedAudit[];
    }) => {
      setPending(data.pending);
      setApproved(data.approved);
      setRejectedAudit(data.rejected);
      setSelectedPendingId((current) =>
        current && data.pending.some((p) => p.id === current) ? current : null,
      );
    },
    [],
  );

  const syncOfficerDomain = useCallback(
    (data: {
      farms: FarmRow[];
      surveys: SurveyRow[];
      queue: QueueItem[];
      scheduledVisits: ScheduledVisit[];
      bookedSlots: BookedSlot[];
      priorityVisits: PriorityVisit[];
      officers: OfficerRecord[];
    }) => {
      setFarms(data.farms);
      setSurveys(data.surveys);
      setQueue(data.queue);
      setVisits(data.scheduledVisits);
      setBooked(data.bookedSlots);
      setPriority(data.priorityVisits);
      setOfficers(data.officers);
    },
    [],
  );

  const syncAdminDomain = useCallback(
    (data: {
      farms: FarmRow[];
      surveys: SurveyRow[];
      officers: OfficerRecord[];
      scheduledVisits: ScheduledVisit[];
    }) => {
      setFarms(data.farms);
      setSurveys(data.surveys);
      setOfficers(data.officers);
      setVisits(data.scheduledVisits);
    },
    [],
  );

  const syncFarmerDomain = useCallback(
    (data: { notifications: FarmerNotification[]; submissions: FarmerSubmission[] }) => {
      setNotifs(data.notifications);
      setSubmissions(data.submissions);
    },
    [],
  );

  const value = useMemo(
    () => ({
      queue,
      farms,
      surveys,
      pendingRegistrations,
      approvedFarmers,
      rejectedAudit,
      scheduledVisits,
      bookedSlots,
      farmerNotifications,
      officers,
      priorityVisits,
      farmerSubmissions,
      adminFarmFilter,
      selectedPendingId,
      assignToast,
      pendingCount,
      queuePendingCount,
      validateQueueItem,
      addPendingRegistration,
      approveFarmer,
      rejectFarmer,
      selectPending,
      bookVisit,
      completePriorityVisit,
      assignOfficer,
      unassignOfficer,
      removeOfficer,
      setAdminFarmFilter,
      addFarmerNotification,
      addFarmerSubmission,
      appendFarmFromRegistration,
      syncRegistrationData,
      syncOfficerDomain,
      syncAdminDomain,
      syncFarmerDomain,
    }),
    [
      queue,
      farms,
      surveys,
      pendingRegistrations,
      approvedFarmers,
      rejectedAudit,
      scheduledVisits,
      bookedSlots,
      farmerNotifications,
      officers,
      priorityVisits,
      farmerSubmissions,
      adminFarmFilter,
      selectedPendingId,
      assignToast,
      pendingCount,
      queuePendingCount,
      validateQueueItem,
      addPendingRegistration,
      approveFarmer,
      rejectFarmer,
      selectPending,
      bookVisit,
      completePriorityVisit,
      assignOfficer,
      unassignOfficer,
      removeOfficer,
      addFarmerNotification,
      addFarmerSubmission,
      appendFarmFromRegistration,
      syncRegistrationData,
      syncOfficerDomain,
      syncAdminDomain,
      syncFarmerDomain,
    ],
  );

  return <DemoStoreContext.Provider value={value}>{children}</DemoStoreContext.Provider>;
}

export function useDemoStore() {
  const ctx = useContext(DemoStoreContext);
  if (!ctx) throw new Error("useDemoStore must be used within DemoStoreProvider");
  return ctx;
}

export function formatAreaForAdmin(ha: number) {
  return formatArea(ha);
}
