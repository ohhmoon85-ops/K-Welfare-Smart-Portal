// ─── Student / Dormitory ────────────────────────────────────────────────────

export interface StudentScores {
  distance: number;   // distanceKm * 1.5
  multiChild: number; // siblings * 10
  hardship: number;   // relocationCount * 5
  total: number;
}

export interface Student {
  id: string;
  name: string;
  school: string;
  parentUnit: string;
  parentRank: string;
  distanceKm: number;
  siblings: number;          // total number of children in family
  relocationCount: number;   // parent's transfer/relocation count
  scores: StudentScores;
  roomId?: string;           // assigned room id
  waitlistNumber?: number;   // reserve/waitlist queue number if no room available
  status: "pending" | "approved" | "rejected";
  appliedAt: string;         // ISO date string
  note?: string;
}

// ─── Room ────────────────────────────────────────────────────────────────────

export interface Room {
  id: string;
  number: string;   // "101", "102", …
  capacity: number;
  studentIds: string[];
}

// ─── Vendor / Procurement ────────────────────────────────────────────────────

export interface Vendor {
  id: string;
  name: string;
  item: string;
  priceScore: number;      // 0-100
  technicalScore: number;  // 0-100
  totalScore: number;      // priceScore*0.7 + technicalScore*0.3
  rank?: number;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  note?: string;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export type AuditTarget = "student" | "vendor" | "room";
export type AuditAction =
  | "ROOM_MANUAL_ASSIGN"
  | "ROOM_MANUAL_UNASSIGN"
  | "STATUS_OVERRIDE"
  | "SCORE_OVERRIDE"
  | "VENDOR_STATUS_OVERRIDE"
  | "NOTE_ADDED";

export interface AuditEntry {
  id: string;
  timestamp: string;       // ISO date string
  adminName: string;
  action: AuditAction;
  targetType: AuditTarget;
  targetId: string;
  targetName: string;
  before: string;
  after: string;
  reason: string;
}

// ─── App-wide State ──────────────────────────────────────────────────────────

export type ActiveModule = "dashboard" | "dormitory" | "procurement" | "audit";
