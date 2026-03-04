import type { StudentScores, SchoolLevel, Student, Vendor, Room } from "./types";

// ─── Student Scoring (정시모집 평가점수 기준) ─────────────────────────────────
// 총 100점 만점 (가점 1점 별도)
// ① 재학중인 학교 40점  ② 부(모) 복무기간 40점
// ③ 시외 학생 주소지 10점  ④ 시외 부(모) 근무지역 10점
// ⑤ 가점: 세자녀이상/다문화/한부모 +1점

/** 재학중인 학교 배점: 초/중/고 = 40점, 대학 = 35점 */
export function calcSchoolScore(schoolLevel: SchoolLevel): number {
  return schoolLevel === "대학생" ? 35 : 40;
}

/**
 * 부(모) 복무기간 배점 (최대 40점)
 * 35년 이상 = 40점; 1년 미만마다 0.2점 차감 (임관일 기준 현역복무기간 합산)
 */
export function calcServiceScore(serviceYears: number): number {
  if (serviceYears >= 35) return 40;
  const deduction = (35 - serviceYears) * 0.2;
  return Math.max(0, Math.round((40 - deduction) * 10) / 10);
}

/**
 * 시외 거리 배점 (학생 주소지 또는 부모 근무지역, 각 최대 10점)
 * 기숙사 소재 시내 거주/근무 시 0점
 * 50km 미만: 5점 | 50~60: 6 | 60~70: 7 | 70~80: 8 | 80~90: 9 | 90km+: 10점
 */
export function calcDistanceScore(distanceKm: number, isInCity: boolean): number {
  if (isInCity) return 0;
  if (distanceKm >= 90) return 10;
  if (distanceKm >= 80) return 9;
  if (distanceKm >= 70) return 8;
  if (distanceKm >= 60) return 7;
  if (distanceKm >= 50) return 6;
  return 5;
}

export function calcStudentScores(
  schoolLevel: SchoolLevel,
  serviceYears: number,
  studentDistanceKm: number,
  parentDistanceKm: number,
  isStudentInCity: boolean,
  isParentInCity: boolean,
  isMultiChild: boolean,
  isMulticultural: boolean,
  isSingleParent: boolean
): StudentScores {
  const schoolScore = calcSchoolScore(schoolLevel);
  const serviceScore = calcServiceScore(serviceYears);
  const studentDistScore = calcDistanceScore(studentDistanceKm, isStudentInCity);
  const parentDistScore = calcDistanceScore(parentDistanceKm, isParentInCity);
  const bonusScore = isMultiChild || isMulticultural || isSingleParent ? 1 : 0;
  const total = Math.round((schoolScore + serviceScore + studentDistScore + parentDistScore + bonusScore) * 10) / 10;
  return { schoolScore, serviceScore, studentDistScore, parentDistScore, bonusScore, total };
}

// ─── Vendor Scoring (PX/BX 정기선정 방식) ────────────────────────────────────
// ⑧ 개찰/1차 선정: 적격심사 점수 80점 이상 → 개찰 대상
//    최종 합산 = 적격심사점수 + 할인율(%) → 높은 순으로 소분류별 1차 선정

export const QUALIFICATION_THRESHOLD = 80; // 적격심사 통과 기준

export function calcVendorTotal(qualificationScore: number, discountRate: number): number {
  return Math.round((qualificationScore + discountRate) * 10) / 10;
}

export function rankVendors(vendors: Vendor[]): Vendor[] {
  // PX/BX 업체만 순위 산정, WA-mall은 순위 없음
  const pxBx = vendors.filter((v) => v.vendorChannel === "PX/BX");
  const waMall = vendors.filter((v) => v.vendorChannel !== "PX/BX");

  const ranked = [...pxBx]
    .map((v) => ({
      ...v,
      passedQualification: (v.qualificationScore ?? 0) >= QUALIFICATION_THRESHOLD,
      totalScore: calcVendorTotal(v.qualificationScore ?? 0, v.discountRate ?? 0),
    }))
    .sort((a, b) => {
      if (a.passedQualification !== b.passedQualification)
        return a.passedQualification ? -1 : 1;
      return (b.totalScore ?? 0) - (a.totalScore ?? 0);
    });

  let rank = 1;
  const rankedPxBx = ranked.map((v) => ({
    ...v,
    rank: v.passedQualification ? rank++ : undefined,
  }));

  return [...rankedPxBx, ...waMall];
}

// ─── Auto Room Assignment ────────────────────────────────────────────────────

/**
 * Takes the current students + rooms and returns updated arrays
 * where unassigned pending students (sorted by score DESC) are
 * placed into available rooms.
 */
export function autoAssignRooms(
  students: Student[],
  rooms: Room[]
): { students: Student[]; rooms: Room[] } {
  // Deep-copy
  const updatedRooms: Room[] = rooms.map((r) => ({ ...r, studentIds: [...r.studentIds] }));
  const updatedStudents: Student[] = students.map((s) => ({ ...s }));

  // Students not yet assigned, pending, sorted by score DESC
  const queue = updatedStudents
    .filter((s) => !s.roomId && s.status === "pending")
    .sort((a, b) => b.scores.total - a.scores.total);

  let waitlistNum = 1;

  for (const student of queue) {
    const room = updatedRooms.find((r) => r.studentIds.length < r.capacity);
    const idx = updatedStudents.findIndex((s) => s.id === student.id);

    if (room) {
      room.studentIds.push(student.id);
      updatedStudents[idx] = {
        ...updatedStudents[idx],
        roomId: room.id,
        status: "approved",
        waitlistNumber: undefined,
      };
    } else {
      // No room available — assign waitlist (reserve) number
      updatedStudents[idx] = {
        ...updatedStudents[idx],
        waitlistNumber: waitlistNum++,
      };
    }
  }

  return { students: updatedStudents, rooms: updatedRooms };
}

// ─── Score Badge Color Helper ─────────────────────────────────────────────────
// 총점 100점 기준으로 우선순위 tier 산정

export function scoreTier(total: number): "high" | "medium" | "low" {
  if (total >= 80) return "high";
  if (total >= 55) return "medium";
  return "low";
}
