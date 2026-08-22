import type {
  ApprovedFarmer,
  BookedSlot,
  FarmRow,
  OfficerRecord,
  PendingRegistration,
  PriorityVisit,
  QueueItem,
  ScheduledVisit,
  SectorDetail,
  SurveyRow,
} from "../types/demoStore";
import type { PestType } from "../types/demoStore";

export const SQ_METERS_PER_HECTARE = 10000;

export const OFFICER_ASSIGNED_BRGY: Record<string, string> = {
  "PCA-2024-0012": "Brgy. Conception",
};

export const OFFICER_BRGY_STATS: Record<string, { farms: number; surveysMonth: string; highRisk: number }> = {
  "Brgy. Conception": { farms: 62, surveysMonth: "412", highRisk: 2 },
};

export const OFFICER_ANALYTICS_BY_BRGY: Record<
  string,
  {
    pest: { healthy: number; yellowing: number; scale: number; beetle: number };
    surveyVolPct: number[];
    line: { thisYear: number[]; lastYear: number[] };
  }
> = {
  "Brgy. Conception": {
    pest: { healthy: 72, yellowing: 16, scale: 8, beetle: 4 },
    surveyVolPct: [38, 42, 40, 55, 58, 52],
    line: { thisYear: [52, 55, 58, 56, 60, 58], lastYear: [48, 50, 52, 51, 54, 52] },
  },
  "Brgy. Mandalagan": {
    pest: { healthy: 62, yellowing: 22, scale: 10, beetle: 6 },
    surveyVolPct: [42, 48, 44, 52, 68, 62],
    line: { thisYear: [50, 52, 54, 53, 57, 55], lastYear: [46, 48, 50, 49, 52, 51] },
  },
  "Brgy. Granada": {
    pest: { healthy: 80, yellowing: 10, scale: 6, beetle: 4 },
    surveyVolPct: [35, 40, 38, 48, 55, 50],
    line: { thisYear: [54, 56, 58, 57, 60, 59], lastYear: [50, 52, 54, 53, 56, 55] },
  },
  "Brgy. Alangilan": {
    pest: { healthy: 48, yellowing: 12, scale: 15, beetle: 25 },
    surveyVolPct: [45, 50, 48, 58, 72, 68],
    line: { thisYear: [44, 46, 45, 48, 52, 50], lastYear: [40, 42, 41, 44, 48, 46] },
  },
};

export const OFFICER_ANALYTICS_DEFAULT = {
  pest: { healthy: 65, yellowing: 15, scale: 12, beetle: 8 },
  surveyVolPct: [40, 55, 45, 70, 85, 78],
  line: {
    thisYear: [58, 61, 63, 60, 64, 62],
    lastYear: [52, 55, 58, 56, 59, 57],
  },
};

export const TREND_STACKED_DEFAULT = {
  labels: ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"],
  healthy: [58, 61, 63, 60, 64, 62],
  yellowing: [20, 18, 17, 19, 16, 18],
  scale: [12, 11, 10, 12, 11, 11],
  beetle: [6, 6, 7, 5, 5, 5],
};

export const RECOMMENDATIONS: Record<
  PestType,
  { hil: { title: string; desc: string; rec: string }; en: { title: string; desc: string; rec: string } }
> = {
  healthy: {
    hil: {
      title: "Maayo (Healthy)",
      desc: "Ang imo puno maayo pa. Padayon ang pag-atiman.",
      rec: "Mag-apply sang fertilizer kada 6 ka bulan. I-monitor ang mga bag-o nga dahon.",
    },
    en: {
      title: "Healthy",
      desc: "Your tree is healthy. Keep up the good care.",
      rec: "Apply fertilizer every 6 months. Monitor new leaves regularly.",
    },
  },
  yellowing: {
    hil: {
      title: "Nagdilaw (Yellowing)",
      desc: "Ang imo puno nagadilaw. Posible kulang abono o may sakit.",
      rec: "Mag-test sang duta. Mag-apply sang fertilizer. Tan-awa ang pag-agi sang tubig.",
    },
    en: {
      title: "Yellowing",
      desc: "Your tree is yellowing. Possible nutrient deficiency or disease.",
      rec: "Conduct soil test. Apply fertilizer. Check drainage around the tree.",
    },
  },
  "scale insect": {
    hil: {
      title: "Lisap (Scale Insect)",
      desc: "May lisap ang imo puno. Dali ini magdamo kung indi matapulan.",
      rec: "Mag-spray sang insecticide. Tangtangon ang grabe nga dahon.",
    },
    en: {
      title: "Scale Insect",
      desc: "Your tree has scale insect. This spreads fast if not treated.",
      rec: "Spray approved scale insecticide. Remove severely affected fronds.",
    },
  },
  "rhino beetle": {
    hil: {
      title: "Bagangan (Rhinoceros Beetle)",
      desc: "May bagangan ang imo puno. Ginasunog ang mga dahon sang bag-o.",
      rec: "Mag-install sang light traps. I-report sa PCA opisyal kung puro na ang pag-atake.",
    },
    en: {
      title: "Rhinoceros Beetle",
      desc: "Your tree has rhinoceros beetle. New fronds are being damaged.",
      rec: "Install light traps at night. Report to PCA officer if widespread.",
    },
  },
};

export const SECTOR_DATA: Record<string, SectorDetail> = {
  A: {
    label: "Sector A - North Area",
    brgy: "Brgy. Mandalagan",
    trees: 58,
    issues: 5,
    atRisk: 0,
    status: "caution",
    statusLabel: "Caution",
    report:
      "Sector A (north area of farms in Brgy. Mandalagan) is showing caution. Most trees are manageable but 5 trees have confirmed yellowing.",
    conditions: [
      { label: "Healthy", count: 53, color: "#166534", bg: "#f0fdf4" },
      { label: "Yellowing", count: 5, color: "#ea580c", bg: "#fff7ed" },
    ],
    imageLabels: ["North boundary row", "Yellowing leaf sample", "Tree overview"],
  },
  B: {
    label: "Sector B - South Area",
    brgy: "Brgy. Conception",
    trees: 62,
    issues: 2,
    atRisk: 0,
    status: "healthy",
    statusLabel: "Healthy",
    report: "Sector B (south area of farms in Brgy. Conception) is generally healthy.",
    conditions: [
      { label: "Healthy", count: 60, color: "#166534", bg: "#f0fdf4" },
      { label: "Yellowing", count: 2, color: "#ea580c", bg: "#fff7ed" },
    ],
    imageLabels: ["South row overview", "Healthy canopy", "Leaf inspection"],
  },
  C: {
    label: "Sector C - East Area",
    brgy: "Brgy. Granada",
    trees: 35,
    issues: 1,
    atRisk: 0,
    status: "healthy",
    statusLabel: "Healthy",
    report: "Sector C (east area of farms in Brgy. Granada) is healthy.",
    conditions: [
      { label: "Healthy", count: 34, color: "#166534", bg: "#f0fdf4" },
      { label: "Yellowing", count: 1, color: "#ea580c", bg: "#fff7ed" },
    ],
    imageLabels: ["East boundary", "Tree row check", "Canopy overview"],
  },
  D: {
    label: "Sector D - West Area",
    brgy: "Brgy. Alangilan",
    trees: 80,
    issues: 11,
    atRisk: 3,
    status: "risk",
    statusLabel: "At Risk",
    report:
      "Sector D (west area of farms in Brgy. Alangilan) is at high risk. Rhinoceros Beetle outbreak confirmed on 8 trees.",
    conditions: [
      { label: "Rhino Beetle", count: 8, color: "#dc2626", bg: "#fef2f2" },
      { label: "Yellowing", count: 3, color: "#ea580c", bg: "#fff7ed" },
    ],
    imageLabels: ["Beetle damage", "Frond damage", "Infested tree", "Farm overview", "Nesting site"],
  },
};

export const INITIAL_QUEUE: QueueItem[] = [
  { id: "q1", brgy: "Brgy. Mandalagan", title: "Yellowing vs. Heat Stress", sub: "Santos Farm, Sector E - May 4", conf: "52%" },
  { id: "q2", brgy: "Brgy. Conception", title: "Scale Insect vs. N-Deficiency", sub: "Bautista Farm, Sector B - May 3", conf: "48%" },
  { id: "q3", brgy: "Brgy. Mandalagan", title: "Rhinoceros Beetle - Uncertain", sub: "Lim Farm, Sector A - May 2", conf: "55%" },
  { id: "q4", brgy: "Brgy. Granada", title: "Yellowing - Possible nutrient deficiency", sub: "Mendoza Farm, Sector C - May 1", conf: "61%" },
  { id: "q5", brgy: "Brgy. Mandalagan", title: "Healthy vs. early scale signs", sub: "Ramos Farm, Sector A - Apr 30", conf: "43%" },
  { id: "q6", brgy: "Brgy. Alangilan", title: "Rhino beetle damage assessment", sub: "Flores Farm, Sector D - Apr 29", conf: "67%" },
  { id: "q7", brgy: "Brgy. Conception", title: "Multiple pest detection", sub: "Castro Farm, Sector B - Apr 28", conf: "38%" },
];

export const INITIAL_FARMS: FarmRow[] = [
  { name: "Dela Cruz Farm", owner: "R. Dela Cruz", sector: "D (West)", brgy: "Brgy. Alangilan", trees: 42, status: "risk", lastSurvey: "Apr 22" },
  { name: "Gonzales Farm", owner: "M. Gonzales", sector: "D (West)", brgy: "Brgy. Alangilan", trees: 38, status: "risk", lastSurvey: "Apr 25" },
  { name: "Reyes Farm", owner: "A. Reyes", sector: "B (South)", brgy: "Brgy. Conception", trees: 56, status: "caution", lastSurvey: "Apr 28" },
  { name: "Santos Farm", owner: "L. Santos", sector: "E (Central)", brgy: "Brgy. Mandalagan", trees: 64, status: "caution", lastSurvey: "May 4" },
  { name: "Bautista Farm", owner: "J. Bautista", sector: "B (South)", brgy: "Brgy. Conception", trees: 47, status: "caution", lastSurvey: "May 3" },
  { name: "Espinosa Homestead", owner: "J. Espinosa", sector: "B (South)", brgy: "Brgy. Conception", trees: 40, status: "healthy", lastSurvey: "May 8" },
  { name: "Lim Farm", owner: "P. Lim", sector: "A (North)", brgy: "Brgy. Mandalagan", trees: 52, status: "pending", lastSurvey: "May 2" },
  { name: "Espinosa Farm", owner: "J. Espinosa", sector: "C (East)", brgy: "Brgy. Granada", trees: 35, status: "healthy", lastSurvey: "May 3" },
  { name: "Tan Farm", owner: "S. Tan", sector: "A (North)", brgy: "Brgy. Mandalagan", trees: 48, status: "healthy", lastSurvey: "May 1" },
];

export const INITIAL_SURVEYS: SurveyRow[] = [
  { date: "May 9, 2026", farm: "Espinosa Farm", sector: "C (East)", brgy: "Brgy. Granada", images: 12, aiResult: "Healthy (94%)", officer: "M. Aguilar", status: "healthy" },
  { date: "May 8, 2026", farm: "Espinosa Homestead", sector: "B (South)", brgy: "Brgy. Conception", images: 6, aiResult: "Healthy (91%)", officer: "M. Aguilar", status: "healthy" },
  { date: "May 8, 2026", farm: "Tan Farm", sector: "A (North)", brgy: "Brgy. Mandalagan", images: 8, aiResult: "Healthy (87%)", officer: "M. Aguilar", status: "healthy" },
  { date: "May 7, 2026", farm: "Lim Farm", sector: "A (North)", brgy: "Brgy. Mandalagan", images: 15, aiResult: "Uncertain (55%)", officer: "—", status: "pending" },
  { date: "May 6, 2026", farm: "Bautista Farm", sector: "B (South)", brgy: "Brgy. Conception", images: 10, aiResult: "Scale Insect (48%)", officer: "R. Cruz", status: "review" },
  { date: "May 5, 2026", farm: "Reyes Farm", sector: "B (South)", brgy: "Brgy. Conception", images: 14, aiResult: "Yellowing (62%)", officer: "M. Aguilar", status: "caution" },
  { date: "May 4, 2026", farm: "Santos Farm", sector: "E (Central)", brgy: "Brgy. Mandalagan", images: 11, aiResult: "Heat Stress (52%)", officer: "—", status: "pending" },
  { date: "May 3, 2026", farm: "Dela Cruz Farm", sector: "D (West)", brgy: "Brgy. Alangilan", images: 18, aiResult: "Rhino Beetle (91%)", officer: "M. Aguilar", status: "risk" },
  { date: "May 2, 2026", farm: "Gonzales Farm", sector: "D (West)", brgy: "Brgy. Alangilan", images: 9, aiResult: "Scale Insect (73%)", officer: "R. Cruz", status: "risk" },
];

export const INITIAL_PENDING: PendingRegistration[] = [
  { id: "1", farmerId: "FARMER-045", applied: "May 7, 2026", firstName: "Maria", middleInitial: "L", lastName: "Santos", farmAddress: "Sitio Malihao", brgy: "Brgy. Conception", municipality: "Talisay City", province: "Negros Occidental", areaHectares: 1.8, areaInputUnit: "ha", areaInputValue: 1.8, farmStatus: "Bearing", phone: "0917 555 0145", altPhone: "", regPurposeType: "registration_only", regPurposeOtherText: "" },
  { id: "2", farmerId: "FARMER-046", applied: "May 8, 2026", firstName: "Roberto", middleInitial: "A", lastName: "Lim", farmAddress: "Phase 2, Mandalagan ridge", brgy: "Brgy. Mandalagan", municipality: "Bacolod City (Capital)", province: "Negros Occidental", areaHectares: 0.9, areaInputUnit: "ha", areaInputValue: 0.9, farmStatus: "Bearing", phone: "0926 555 0201", altPhone: "", regPurposeType: "other", regPurposeOtherText: "Fertilizer advisory visit" },
  { id: "3", farmerId: "FARMER-047", applied: "May 8, 2026", firstName: "Ana", middleInitial: "R", lastName: "Reyes", farmAddress: "Hda. Granada boundary", brgy: "Brgy. Granada", municipality: "Bago City", province: "Negros Occidental", areaHectares: 2.1, areaInputUnit: "ha", areaInputValue: 2.1, farmStatus: "Non-bearing", phone: "0998 555 0332", altPhone: "0998 555 0333", regPurposeType: "registration_only", regPurposeOtherText: "" },
  { id: "4", farmerId: "FARMER-048", applied: "May 9, 2026", firstName: "Carlos", middleInitial: "D", lastName: "Delos Reyes", farmAddress: "Upper Alangilan coconut roll", brgy: "Brgy. Alangilan", municipality: "Bago City", province: "Negros Occidental", areaHectares: 3.4, areaInputUnit: "ha", areaInputValue: 3.4, farmStatus: "Bearing", phone: "0919 555 0408", altPhone: "", regPurposeType: "other", regPurposeOtherText: "Neighbor reported beetle activity" },
];

export const INITIAL_APPROVED: ApprovedFarmer[] = [
  { name: "Elena Ramos", farmerId: "FARMER-042", brgy: "Brgy. Mandalagan", approvedDate: "May 5, 2026", approvedBy: "PCA Administrator" },
  { name: "Paolo Mendoza", farmerId: "FARMER-043", brgy: "Brgy. Conception", approvedDate: "May 6, 2026", approvedBy: "PCA Administrator" },
  { name: "Sofia Cruz", farmerId: "FARMER-044", brgy: "Brgy. Granada", approvedDate: "May 6, 2026", approvedBy: "PCA Administrator" },
];

export const INITIAL_VISITS: ScheduledVisit[] = [
  { id: "visit1", farm: "Reyes Farm", owner: "A. Reyes", brgy: "Brgy. Conception", date: "2026-05-14", slot: "AM", scheduledBy: "M. Aguilar", purpose: "Field check for low yield" },
  { id: "visit2", farm: "Bautista Farm", owner: "J. Bautista", brgy: "Brgy. Conception", date: "2026-05-15", slot: "PM", scheduledBy: "M. Aguilar", purpose: "Preventive pest follow-up" },
  { id: "visit3", farm: "Dela Cruz Farm", owner: "R. Dela Cruz", brgy: "Brgy. Alangilan", date: "2026-05-14", slot: "AM", scheduledBy: "J. Buenacosa", purpose: "Urgent beetle response" },
  { id: "visit4", farm: "Santos Farm", owner: "L. Santos", brgy: "Brgy. Mandalagan", date: "2026-05-16", slot: "PM", scheduledBy: "L. Flores", purpose: "Heat stress validation" },
];

export const INITIAL_BOOKED: BookedSlot[] = [
  { date: "2026-05-14", slot: "AM" },
  { date: "2026-05-21", slot: "PM" },
];

export const SCHEDULE_FULLY_BOOKED_DATES = ["2026-05-18"];

export const INITIAL_OFFICERS: OfficerRecord[] = [
  { empId: "PCA-2024-0012", name: "M. Aguilar", phone: "0917-345-8801", brgy: "Brgy. Conception", farmsCovered: "62", status: "Active", lastActive: "May 9" },
  { empId: "PCA-2024-0013", name: "R. Cruz", phone: "0917-220-1144", brgy: "Brgy. Granada", farmsCovered: "48", status: "Active", lastActive: "May 8" },
  { empId: "PCA-2024-0014", name: "J. Buenacosa", phone: "0917-441-9022", brgy: "Brgy. Alangilan", farmsCovered: "55", status: "Active", lastActive: "May 7" },
  { empId: "PCA-2024-0015", name: "L. Flores", phone: "0917-883-2011", brgy: "Brgy. Mandalagan", farmsCovered: "43", status: "Active", lastActive: "May 6" },
  { empId: "PCA-2024-0016", name: "K. Mendoza", phone: "0917-100-7788", brgy: "Unassigned", farmsCovered: "—", status: "Inactive", lastActive: "Apr 30" },
  { empId: "PCA-2024-0017", name: "T. Villanueva", phone: "0917-200-9901", brgy: "Unassigned", farmsCovered: "—", status: "Inactive", lastActive: "Apr 28" },
];

export const INITIAL_PRIORITY_VISITS: PriorityVisit[] = [
  { id: "pv1", farm: "Dela Cruz Farm - Sector D (West)", desc: "Rhinoceros Beetle outbreak — 3 trees severely damaged.", level: "urgent", due: "Today", assigned: "M. Aguilar", brgy: "Brgy. Alangilan" },
  { id: "pv2", farm: "Gonzales Farm - Sector D (West)", desc: "Scale Insect spreading. Needs biological control.", level: "urgent", due: "Today", assigned: "R. Cruz", brgy: "Brgy. Alangilan" },
  { id: "pv3", farm: "Reyes Farm - Sector B (South)", desc: "Yellowing spreading to upper fronds.", level: "high", due: "May 11", assigned: "M. Aguilar", brgy: "Brgy. Conception" },
  { id: "pv4", farm: "Santos Farm - Sector E (Central)", desc: "Heat stress — irrigation check required.", level: "high", due: "May 12", assigned: "R. Flores", brgy: "Brgy. Mandalagan" },
  { id: "pv5", farm: "Bautista Farm - Sector B (South)", desc: "Minor scale insect — preventive spray recommended.", level: "medium", due: "May 15", assigned: "—", brgy: "Brgy. Conception" },
];

export const OFFICER_SECTORS = [
  { code: "A", name: "Sector A - North", brgy: "Brgy. Conception", last: "May 1", pct: 78, color: "#22a355", tag: "Healthy", tagClass: "green" as const },
  { code: "B", name: "Sector B - South", brgy: "Brgy. Conception", last: "Apr 28", pct: 54, color: "#f59e0b", tag: "Caution", tagClass: "orange" as const },
  { code: "C", name: "Sector C - East", brgy: "Brgy. Conception", last: "May 3", pct: 82, color: "#22a355", tag: "Healthy", tagClass: "green" as const },
  { code: "D", name: "Sector D - West", brgy: "Brgy. Conception", last: "Apr 22", pct: 31, color: "#dc2626", tag: "At Risk", tagClass: "red" as const },
];

export const FARMER_NOTIFICATIONS_SEED = [
  { id: "seed1", dateLine: "May 10, 2026 | 2:00 PM", body: "Farm profile updated. Contact your officer if any detail is incorrect.", dot: "#166534", isNew: false },
  { id: "seed2", dateLine: "May 15, 2026 | 9:00 AM", body: "Farm visit scheduled by Officer M. Aguilar — field check for low yield.", dot: "#ea580c", isNew: true },
];

export const REPORT_ROWS_MONTHLY = [
  { title: "May 2026 - Monthly Summary", sub: "Generated May 9, 2026 | Brgy. Conception cluster", brgy: "Brgy. Conception", tone: "green" as const },
  { title: "April 2026 - Monthly Summary", sub: "Generated May 1, 2026 | Brgy. Mandalagan cluster", brgy: "Brgy. Mandalagan", tone: "blue" as const },
  { title: "Q1 2026 - Quarterly Report", sub: "Generated Apr 15, 2026 | Province-wide", brgy: "", tone: "green" as const },
];

export const REPORT_ROWS_INCIDENT = [
  { title: "Rhino Beetle Alert - Brgy. Alangilan", sub: "Incident report | May 3, 2026", brgy: "Brgy. Alangilan" },
  { title: "Scale Insect Cluster - Sector D", sub: "Field note | Apr 28, 2026", brgy: "Brgy. Alangilan" },
];

export const ADMIN_BARANGAYS = [
  { name: "Brgy. Conception", officer: "M. Aguilar", farms: 62, tag: "Stable", tagClass: "green" as const, color: "#22a355" },
  { name: "Brgy. Granada", officer: "R. Cruz", farms: 48, tag: "Stable", tagClass: "green" as const, color: "#22a355" },
  { name: "Brgy. Alangilan", officer: "J. Buenacosa", farms: 55, tag: "At Risk", tagClass: "red" as const, color: "#dc2626" },
  { name: "Brgy. Mandalagan", officer: "L. Flores", farms: 43, tag: "Watch", tagClass: "orange" as const, color: "#f59e0b" },
];
