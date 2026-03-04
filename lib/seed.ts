import { Student, Vendor, Room, AuditEntry } from "./types";
import { calcStudentScores, calcVendorTotal } from "./scoring";

// ─── Seed Rooms ───────────────────────────────────────────────────────────────

export const SEED_ROOMS: Room[] = [
  { id: "R101", number: "101", capacity: 4, studentIds: [] },
  { id: "R102", number: "102", capacity: 4, studentIds: [] },
  { id: "R103", number: "103", capacity: 4, studentIds: [] },
  { id: "R201", number: "201", capacity: 2, studentIds: [] },
  { id: "R202", number: "202", capacity: 2, studentIds: [] },
  { id: "R203", number: "203", capacity: 4, studentIds: [] },
];

// ─── Seed Students ────────────────────────────────────────────────────────────

function makeStudent(
  id: string,
  name: string,
  school: string,
  parentUnit: string,
  parentRank: string,
  distanceKm: number,
  siblings: number,
  relocationCount: number,
  appliedAt: string
): Student {
  return {
    id,
    name,
    school,
    parentUnit,
    parentRank,
    distanceKm,
    siblings,
    relocationCount,
    scores: calcStudentScores(distanceKm, siblings, relocationCount),
    status: "pending",
    appliedAt,
  };
}

export const SEED_STUDENTS: Student[] = [
  makeStudent("S001", "김지수", "육군부사관학교", "육군 1군단", "중령", 85, 3, 7, "2026-02-10T09:00:00"),
  makeStudent("S002", "이민준", "공군사관학교", "공군 5전술비행단", "대령", 42, 2, 4, "2026-02-11T10:30:00"),
  makeStudent("S003", "박서연", "해군사관학교", "해군 2함대", "소령", 130, 1, 2, "2026-02-12T11:00:00"),
  makeStudent("S004", "최현우", "육군사관학교", "육군 3군단", "준장", 67, 4, 9, "2026-02-13T08:45:00"),
  makeStudent("S005", "정유진", "한국외국어대학교", "해병대 2사단", "대위", 20, 2, 3, "2026-02-14T14:00:00"),
  makeStudent("S006", "강도현", "연세대학교", "육군 특수전사령부", "중위", 95, 3, 6, "2026-02-15T09:30:00"),
  makeStudent("S007", "오수아", "고려대학교", "공군 방공포병여단", "상사", 55, 1, 1, "2026-02-16T13:00:00"),
  makeStudent("S008", "홍지원", "서울대학교", "해군 항공사령부", "원사", 110, 5, 8, "2026-02-17T10:00:00"),
];

// ─── Seed Vendors ─────────────────────────────────────────────────────────────

function makeVendor(
  id: string,
  name: string,
  item: string,
  priceScore: number,
  technicalScore: number,
  submittedAt: string
): Vendor {
  return {
    id,
    name,
    item,
    priceScore,
    technicalScore,
    totalScore: calcVendorTotal(priceScore, technicalScore),
    status: "pending",
    submittedAt,
  };
}

export const SEED_VENDORS: Vendor[] = [
  makeVendor("V001", "(주)한국군수산업", "전투식량 3개월분", 88, 72, "2026-02-20T09:00:00"),
  makeVendor("V002", "(주)대한방산", "전투식량 3개월분", 75, 91, "2026-02-20T10:00:00"),
  makeVendor("V003", "(주)국방물자", "전투식량 3개월분", 92, 65, "2026-02-20T11:00:00"),
  makeVendor("V004", "(주)청진군수", "사무용 비품 일체", 80, 85, "2026-02-21T09:30:00"),
  makeVendor("V005", "(주)용사물자", "사무용 비품 일체", 95, 70, "2026-02-21T11:00:00"),
];

// ─── Seed Audit Log ──────────────────────────────────────────────────────────

export const SEED_AUDIT: AuditEntry[] = [
  {
    id: "A001",
    timestamp: "2026-02-18T14:23:00",
    adminName: "관리자 김철수",
    action: "STATUS_OVERRIDE",
    targetType: "student",
    targetId: "S003",
    targetName: "박서연",
    before: "pending",
    after: "approved",
    reason: "학교장 추천 특례 적용",
  },
  {
    id: "A002",
    timestamp: "2026-02-19T09:10:00",
    adminName: "관리자 이영희",
    action: "ROOM_MANUAL_ASSIGN",
    targetType: "student",
    targetId: "S007",
    targetName: "오수아",
    before: "미배정",
    after: "Room 201",
    reason: "의료적 사유로 1층 배정 필요",
  },
];
