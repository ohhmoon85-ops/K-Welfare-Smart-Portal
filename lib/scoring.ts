import type { StudentScores, Student, Vendor, Room } from "./types";

// ─── Student Scoring ─────────────────────────────────────────────────────────

export function calcStudentScores(
  distanceKm: number,
  siblings: number,
  relocationCount: number
): StudentScores {
  const distance = Math.round(distanceKm * 1.5 * 10) / 10;
  const multiChild = siblings * 10;
  const hardship = relocationCount * 5;
  const total = Math.round((distance + multiChild + hardship) * 10) / 10;
  return { distance, multiChild, hardship, total };
}

// ─── Vendor Scoring ──────────────────────────────────────────────────────────

export function calcVendorTotal(priceScore: number, technicalScore: number): number {
  return Math.round((priceScore * 0.7 + technicalScore * 0.3) * 10) / 10;
}

export function rankVendors(vendors: Vendor[]): Vendor[] {
  const sorted = [...vendors].sort((a, b) => b.totalScore - a.totalScore);
  return sorted.map((v, i) => ({ ...v, rank: i + 1 }));
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

export function scoreTier(total: number): "high" | "medium" | "low" {
  if (total >= 80) return "high";
  if (total >= 40) return "medium";
  return "low";
}
