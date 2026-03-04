// ─── Uploaded File ───────────────────────────────────────────────────────────

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;          // object URL (browser memory)
  uploadedAt: string;
}

// documents are keyed by RequiredDoc.key
export type DocMap = Record<string, UploadedFile[]>;

// ─── Student / Dormitory ────────────────────────────────────────────────────

export type SchoolLevel = "초등학생" | "중학생" | "고등학생" | "대학생";

export interface StudentScores {
  schoolScore: number;       // 재학중인 학교 배점 (초/중/고: 40점, 대학: 35점)
  serviceScore: number;      // 부(모) 복무기간 배점 (최대 40점)
  studentDistScore: number;  // 시외 학생 주소지 배점 (최대 10점)
  parentDistScore: number;   // 시외 부(모) 근무지역 배점 (최대 10점)
  bonusScore: number;        // 가점 (세자녀이상/다문화/한부모 = 1점)
  total: number;             // 합산 점수 (최대 101점)
}

export interface Student {
  id: string;
  name: string;
  school: string;             // 학교명
  schoolLevel: SchoolLevel;  // 학교급
  parentUnit: string;        // 부(모) 소속 부대
  parentRank: string;        // 부(모) 계급
  serviceYears: number;      // 부(모) 복무기간 (년)
  studentDistanceKm: number; // 기숙사 ↔ 학생 실거주지 직선거리 (km)
  parentDistanceKm: number;  // 기숙사 ↔ 부(모) 근무지 직선거리 (km)
  isStudentInCity: boolean;  // 기숙사 소재 시내 거주 여부 (해당 시: 0점)
  isParentInCity: boolean;   // 기숙사 소재 시내 근무 여부 (해당 시: 0점)
  isMultiChild: boolean;     // 세자녀 이상 부양가구
  isMulticultural: boolean;  // 다문화 가정
  isSingleParent: boolean;   // 한부모 가정
  scores: StudentScores;
  roomId?: string;           // 배정 호실 id
  waitlistNumber?: number;   // 예비(대기) 번호
  status: "pending" | "approved" | "rejected";
  appliedAt: string;         // ISO date string
  documents: DocMap;         // 첨부 서류
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

/** PX/BX 정기선정: 소분류 유형 */
export type VendorType = "일반" | "경쟁과열";

/** WA-mall: 판매사 유형 (신청자격) */
export type VendorSaleType = "직접제조판매" | "OEM" | "수입" | "판매대행";

/** 조달 채널 */
export type VendorChannel = "PX/BX" | "WA-mall";

export interface Vendor {
  id: string;
  name: string;
  item: string;                  // 위탁 품목 / 물품명
  subCategory: string;           // 소분류명

  // ─── 채널 구분 ───────────────────────────────────────────────
  vendorChannel: VendorChannel;

  // ─── PX/BX 전용 ──────────────────────────────────────────────
  vendorType?: VendorType;          // 일반 / 경쟁과열
  qualificationScore?: number;      // 적격심사 점수 (80점↑ 개찰)
  discountRate?: number;            // 할인율 (%)
  totalScore?: number;              // 적격심사 + 할인율
  passedQualification?: boolean;    // 80점 이상 여부
  rank?: number;

  // ─── WA-mall 전용 ────────────────────────────────────────────
  businessRegNumber?: string;       // 사업자등록번호
  vendorSaleType?: VendorSaleType;  // 신청자격 유형
  requestedPrice?: number;          // 복지단 판매 요청가 (원)
  marketLowestPrice?: number;       // 시중 온라인 최저가 (원)
  productCategory?: string;         // 대분류 카테고리

  // ─── 공통 ─────────────────────────────────────────────────────
  status: "pending" | "qualified" | "first_selected" | "final_selected" | "rejected";
  submittedAt: string;
  documents: DocMap;
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
