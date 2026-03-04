import { Student, SchoolLevel, Vendor, VendorType, VendorSaleType, Room, AuditEntry } from "./types";
import { calcStudentScores, calcVendorTotal, QUALIFICATION_THRESHOLD } from "./scoring";

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
  schoolLevel: SchoolLevel,
  parentUnit: string,
  parentRank: string,
  serviceYears: number,
  studentDistanceKm: number,
  parentDistanceKm: number,
  isStudentInCity: boolean,
  isParentInCity: boolean,
  isMultiChild: boolean,
  isMulticultural: boolean,
  isSingleParent: boolean,
  appliedAt: string
): Student {
  return {
    id,
    name,
    school,
    schoolLevel,
    parentUnit,
    parentRank,
    serviceYears,
    studentDistanceKm,
    parentDistanceKm,
    isStudentInCity,
    isParentInCity,
    isMultiChild,
    isMulticultural,
    isSingleParent,
    scores: calcStudentScores(
      schoolLevel, serviceYears,
      studentDistanceKm, parentDistanceKm,
      isStudentInCity, isParentInCity,
      isMultiChild, isMulticultural, isSingleParent
    ),
    status: "pending",
    appliedAt,
    documents: {},
  };
}

// makeStudent(id, name, school, schoolLevel, parentUnit, parentRank,
//             serviceYears, studentDistKm, parentDistKm,
//             isStudentInCity, isParentInCity,
//             isMultiChild, isMulticultural, isSingleParent, appliedAt)
export const SEED_STUDENTS: Student[] = [
  makeStudent("S001", "김지수", "육군부사관학교부설고", "고등학생", "육군 1군단", "중령",
    28, 95, 85, false, false, true, false, false, "2026-02-10T09:00:00"),
  makeStudent("S002", "이민준", "한국외국어대학교", "대학생", "공군 5전술비행단", "대령",
    32, 75, 60, false, false, false, false, false, "2026-02-11T10:30:00"),
  makeStudent("S003", "박서연", "대방중학교", "중학생", "해군 2함대", "소령",
    20, 55, 70, false, false, false, true, false, "2026-02-12T11:00:00"),
  makeStudent("S004", "최현우", "육군사관학교", "대학생", "육군 3군단", "준장",
    35, 110, 95, false, false, true, false, false, "2026-02-13T08:45:00"),
  makeStudent("S005", "정유진", "용산초등학교", "초등학생", "해병대 2사단", "대위",
    15, 45, 40, false, false, false, false, true, "2026-02-14T14:00:00"),
  makeStudent("S006", "강도현", "연세대학교", "대학생", "육군 특수전사령부", "중위",
    10, 90, 80, false, false, false, false, false, "2026-02-15T09:30:00"),
  makeStudent("S007", "오수아", "계성고등학교", "고등학생", "공군 방공포병여단", "상사",
    22, 65, 55, false, false, false, false, false, "2026-02-16T13:00:00"),
  makeStudent("S008", "홍지원", "서울대학교", "대학생", "해군 항공사령부", "원사",
    30, 100, 90, false, false, true, false, false, "2026-02-17T10:00:00"),
];

// ─── Seed Vendors (PX/BX 정기선정 방식) ──────────────────────────────────────

function makePxVendor(
  id: string,
  name: string,
  subCategory: string,
  vendorType: VendorType,
  qualificationScore: number,
  discountRate: number,
  submittedAt: string
): Vendor {
  return {
    id,
    name,
    item: "PX/BX 위탁운영",
    subCategory,
    vendorChannel: "PX/BX",
    vendorType,
    qualificationScore,
    discountRate,
    totalScore: calcVendorTotal(qualificationScore, discountRate),
    passedQualification: qualificationScore >= QUALIFICATION_THRESHOLD,
    rank: undefined,
    status: "pending",
    submittedAt,
    documents: {},
  };
}

function makeWaVendor(
  id: string,
  name: string,
  subCategory: string,
  productCategory: string,
  vendorSaleType: VendorSaleType,
  businessRegNumber: string,
  requestedPrice: number,
  marketLowestPrice: number,
  submittedAt: string
): Vendor {
  return {
    id,
    name,
    item: "WA-mall 일반상품",
    subCategory,
    vendorChannel: "WA-mall",
    vendorSaleType,
    businessRegNumber,
    productCategory,
    requestedPrice,
    marketLowestPrice,
    rank: undefined,
    status: "pending",
    submittedAt,
    documents: {},
  };
}

export const SEED_VENDORS: Vendor[] = [
  // ─── PX/BX 정기선정 ───────────────────────────────────────────────
  makePxVendor("V001", "(주)맛나식품",  "과자류", "일반",    87, 12.5, "2026-04-15T09:00:00"),
  makePxVendor("V002", "(주)대한제과",  "과자류", "일반",    82, 15.0, "2026-04-15T10:00:00"),
  makePxVendor("V003", "(주)한국스낵",  "과자류", "일반",    76, 18.0, "2026-04-15T11:00:00"),
  makePxVendor("V004", "(주)청정음료",  "음료류", "경쟁과열", 91,  8.0, "2026-04-16T09:00:00"),
  makePxVendor("V005", "(주)국방음료",  "음료류", "경쟁과열", 85, 10.5, "2026-04-16T10:30:00"),
  makePxVendor("V006", "(주)용사음료",  "음료류", "경쟁과열", 78, 14.0, "2026-04-16T11:00:00"),

  // ─── WA-mall 일반상품 정기 선정 ('26-1차) ─────────────────────────
  makeWaVendor("W001", "(주)뷰티라인",   "스킨케어",   "화장품",        "직접제조판매", "123-45-67890", 28000, 35000, "2026-03-06T10:00:00"),
  makeWaVendor("W002", "(주)스포츠코리아","스포츠패션",  "스포츠/레저",   "OEM",          "234-56-78901", 45000, 58000, "2026-03-07T11:00:00"),
  makeWaVendor("W003", "(주)홈쿡",       "밀키트/간편식","식품",          "직접제조판매", "345-67-89012", 9800,  12000, "2026-03-08T09:30:00"),
  makeWaVendor("W004", "(주)유아세상",   "유아동용품",  "유아동",        "판매대행",     "456-78-90123", 32000, 40000, "2026-03-09T14:00:00"),
  makeWaVendor("W005", "(주)글로벌임포트","화장품/수입",  "화장품",        "수입",         "567-89-01234", 55000, 72000, "2026-03-10T10:00:00"),
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
