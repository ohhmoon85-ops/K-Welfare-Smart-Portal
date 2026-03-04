"use client";
import React, { createContext, useContext, useReducer, useCallback } from "react";
import type { Student, Room, Vendor, AuditEntry, ActiveModule, DocMap } from "./types";
import { SEED_STUDENTS, SEED_ROOMS, SEED_VENDORS, SEED_AUDIT } from "./seed";
import { calcStudentScores, calcVendorTotal, autoAssignRooms, rankVendors } from "./scoring";
import { generateId } from "./utils";

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  activeModule: ActiveModule;
  students: Student[];
  rooms: Room[];
  vendors: Vendor[];
  auditLog: AuditEntry[];
}

// ─── Action Types ─────────────────────────────────────────────────────────────

type Action =
  | { type: "SET_MODULE"; module: ActiveModule }
  | { type: "ADD_STUDENT"; student: Omit<Student, "id" | "scores" | "status" | "appliedAt"> }
  | { type: "AUTO_ASSIGN_ROOMS" }
  | { type: "MANUAL_ASSIGN_ROOM"; studentId: string; roomId: string; admin: string; reason: string }
  | { type: "MANUAL_UNASSIGN_ROOM"; studentId: string; admin: string; reason: string }
  | { type: "OVERRIDE_STUDENT_STATUS"; studentId: string; status: Student["status"]; admin: string; reason: string }
  | { type: "UPDATE_STUDENT_DOCS"; studentId: string; documents: DocMap }
  | { type: "ADD_VENDOR"; vendor: Omit<Vendor, "id" | "totalScore" | "rank" | "status" | "submittedAt"> }
  | { type: "OVERRIDE_VENDOR_STATUS"; vendorId: string; status: Vendor["status"]; admin: string; reason: string }
  | { type: "UPDATE_VENDOR_DOCS"; vendorId: string; documents: DocMap }
  | { type: "RANK_VENDORS" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_MODULE":
      return { ...state, activeModule: action.module };

    case "ADD_STUDENT": {
      const scores = calcStudentScores(
        action.student.schoolLevel,
        action.student.serviceYears,
        action.student.studentDistanceKm,
        action.student.parentDistanceKm,
        action.student.isStudentInCity,
        action.student.isParentInCity,
        action.student.isMultiChild,
        action.student.isMulticultural,
        action.student.isSingleParent
      );
      const newStudent: Student = {
        ...action.student,
        id: "S" + generateId(),
        scores,
        status: "pending",
        appliedAt: new Date().toISOString(),
      };
      return { ...state, students: [...state.students, newStudent] };
    }

    case "AUTO_ASSIGN_ROOMS": {
      const { students, rooms } = autoAssignRooms(state.students, state.rooms);
      return { ...state, students, rooms };
    }

    case "MANUAL_ASSIGN_ROOM": {
      const { studentId, roomId, admin, reason } = action;
      const student = state.students.find((s) => s.id === studentId);
      const room = state.rooms.find((r) => r.id === roomId);
      if (!student || !room) return state;

      const prevRoom = student.roomId;
      const prevRoomLabel = prevRoom
        ? `Room ${state.rooms.find((r) => r.id === prevRoom)?.number ?? prevRoom}`
        : "미배정";

      // Remove from previous room if any
      const updatedRooms = state.rooms.map((r) => {
        if (r.id === prevRoom) return { ...r, studentIds: r.studentIds.filter((id) => id !== studentId) };
        if (r.id === roomId) return { ...r, studentIds: [...r.studentIds, studentId] };
        return r;
      });

      const updatedStudents = state.students.map((s) =>
        s.id === studentId ? { ...s, roomId, status: "approved" as const } : s
      );

      const entry: AuditEntry = {
        id: "A" + generateId(),
        timestamp: new Date().toISOString(),
        adminName: admin,
        action: "ROOM_MANUAL_ASSIGN",
        targetType: "student",
        targetId: studentId,
        targetName: student.name,
        before: prevRoomLabel,
        after: `Room ${room.number}`,
        reason,
      };

      return {
        ...state,
        students: updatedStudents,
        rooms: updatedRooms,
        auditLog: [entry, ...state.auditLog],
      };
    }

    case "MANUAL_UNASSIGN_ROOM": {
      const { studentId, admin, reason } = action;
      const student = state.students.find((s) => s.id === studentId);
      if (!student || !student.roomId) return state;

      const prevRoom = state.rooms.find((r) => r.id === student.roomId);
      const updatedRooms = state.rooms.map((r) =>
        r.id === student.roomId
          ? { ...r, studentIds: r.studentIds.filter((id) => id !== studentId) }
          : r
      );
      const updatedStudents = state.students.map((s) =>
        s.id === studentId ? { ...s, roomId: undefined, status: "pending" as const } : s
      );

      const entry: AuditEntry = {
        id: "A" + generateId(),
        timestamp: new Date().toISOString(),
        adminName: admin,
        action: "ROOM_MANUAL_UNASSIGN",
        targetType: "student",
        targetId: studentId,
        targetName: student.name,
        before: `Room ${prevRoom?.number ?? student.roomId}`,
        after: "미배정",
        reason,
      };

      return {
        ...state,
        students: updatedStudents,
        rooms: updatedRooms,
        auditLog: [entry, ...state.auditLog],
      };
    }

    case "OVERRIDE_STUDENT_STATUS": {
      const { studentId, status, admin, reason } = action;
      const student = state.students.find((s) => s.id === studentId);
      if (!student) return state;

      const updatedStudents = state.students.map((s) =>
        s.id === studentId ? { ...s, status } : s
      );

      const entry: AuditEntry = {
        id: "A" + generateId(),
        timestamp: new Date().toISOString(),
        adminName: admin,
        action: "STATUS_OVERRIDE",
        targetType: "student",
        targetId: studentId,
        targetName: student.name,
        before: student.status,
        after: status,
        reason,
      };

      return {
        ...state,
        students: updatedStudents,
        auditLog: [entry, ...state.auditLog],
      };
    }

    case "UPDATE_STUDENT_DOCS": {
      const updatedStudents = state.students.map((s) =>
        s.id === action.studentId ? { ...s, documents: action.documents } : s
      );
      return { ...state, students: updatedStudents };
    }

    case "ADD_VENDOR": {
      const isPxBx = action.vendor.vendorChannel === "PX/BX";
      const totalScore = isPxBx && action.vendor.qualificationScore != null && action.vendor.discountRate != null
        ? calcVendorTotal(action.vendor.qualificationScore, action.vendor.discountRate)
        : undefined;
      const newVendor: Vendor = {
        ...action.vendor,
        id: "V" + generateId(),
        ...(isPxBx ? {
          totalScore,
          passedQualification: (action.vendor.qualificationScore ?? 0) >= 80,
        } : {}),
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
      const vendors = rankVendors([...state.vendors, newVendor]);
      return { ...state, vendors };
    }

    case "UPDATE_VENDOR_DOCS": {
      const updatedVendors = state.vendors.map((v) =>
        v.id === action.vendorId ? { ...v, documents: action.documents } : v
      );
      return { ...state, vendors: updatedVendors };
    }

    case "RANK_VENDORS": {
      return { ...state, vendors: rankVendors(state.vendors) };
    }

    case "OVERRIDE_VENDOR_STATUS": {
      const { vendorId, status, admin, reason } = action;
      const vendor = state.vendors.find((v) => v.id === vendorId);
      if (!vendor) return state;

      const updatedVendors = state.vendors.map((v) =>
        v.id === vendorId ? { ...v, status } : v
      );

      const entry: AuditEntry = {
        id: "A" + generateId(),
        timestamp: new Date().toISOString(),
        adminName: admin,
        action: "VENDOR_STATUS_OVERRIDE",
        targetType: "vendor",
        targetId: vendorId,
        targetName: vendor.name,
        before: vendor.status,
        after: status,
        reason,
      };

      return {
        ...state,
        vendors: updatedVendors,
        auditLog: [entry, ...state.auditLog],
      };
    }

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initialState: AppState = {
    activeModule: "dashboard",
    students: SEED_STUDENTS,
    rooms: SEED_ROOMS,
    vendors: rankVendors(SEED_VENDORS),
    auditLog: SEED_AUDIT,
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
