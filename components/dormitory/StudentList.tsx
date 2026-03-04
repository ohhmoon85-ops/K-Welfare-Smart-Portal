"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ScoringBreakdown from "./ScoringBreakdown";
import { Eye, MoreHorizontal, UserCheck, UserX, Home } from "lucide-react";
import type { Student } from "@/lib/types";

const statusConfig = {
  pending: { label: "대기 중", variant: "warning" as const },
  approved: { label: "승인", variant: "success" as const },
  rejected: { label: "반려", variant: "destructive" as const },
};

export default function StudentList() {
  const { state, dispatch } = useApp();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [adminName, setAdminName] = useState("관리자");
  const [reason, setReason] = useState("");
  const [targetRoom, setTargetRoom] = useState("");
  const [targetStatus, setTargetStatus] = useState<Student["status"]>("approved");
  const [search, setSearch] = useState("");

  const sorted = [...state.students]
    .filter((s) => s.name.includes(search) || s.school.includes(search) || s.parentUnit.includes(search))
    .sort((a, b) => b.scores.total - a.scores.total);

  const availableRooms = state.rooms; // show all rooms for manual override; capacity shown in dropdown

  const handleManualAssign = () => {
    if (!selectedStudent || !targetRoom || !adminName || !reason) return;
    dispatch({
      type: "MANUAL_ASSIGN_ROOM",
      studentId: selectedStudent.id,
      roomId: targetRoom,
      admin: adminName,
      reason,
    });
    setAssignOpen(false);
    setReason("");
    setTargetRoom("");
  };

  const handleStatusOverride = () => {
    if (!selectedStudent || !adminName || !reason) return;
    dispatch({
      type: "OVERRIDE_STUDENT_STATUS",
      studentId: selectedStudent.id,
      status: targetStatus,
      admin: adminName,
      reason,
    });
    setStatusOpen(false);
    setReason("");
  };

  const handleUnassign = (student: Student) => {
    const adminLabel = prompt("관리자 이름을 입력하세요") ?? "관리자";
    const reasonLabel = prompt("배정 취소 사유를 입력하세요") ?? "";
    if (!reasonLabel) return;
    dispatch({ type: "MANUAL_UNASSIGN_ROOM", studentId: student.id, admin: adminLabel, reason: reasonLabel });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          placeholder="이름, 학교, 부대로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <p className="text-sm text-slate-500">총 {sorted.length}명 (점수 순 정렬)</p>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-8">순위</TableHead>
              <TableHead>학생 / 학교</TableHead>
              <TableHead>부모 소속</TableHead>
              <TableHead className="text-center">총점</TableHead>
              <TableHead className="text-center">점수 상세</TableHead>
              <TableHead className="text-center">배정 호실</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((student, idx) => {
              const room = state.rooms.find((r) => r.id === student.roomId);
              const sc = statusConfig[student.status];
              return (
                <TableRow key={student.id}>
                  <TableCell className="text-center">
                    <span className={`text-xs font-bold ${idx === 0 ? "text-amber-500" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-slate-400"}`}>
                      {idx + 1}
                    </span>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.school}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{student.parentUnit}</p>
                    <p className="text-xs text-slate-500">{student.parentRank}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-bold text-blue-600">{student.scores.total}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-[10px] text-slate-500 space-y-0.5">
                      <div>학교 <span className="font-medium text-blue-500">{student.scores.schoolScore}</span></div>
                      <div>복무 <span className="font-medium text-emerald-500">{student.scores.serviceScore}</span></div>
                      <div>거리 <span className="font-medium text-amber-500">{student.scores.studentDistScore + student.scores.parentDistScore}</span></div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {room ? (
                      <Badge variant="success">{room.number}호</Badge>
                    ) : student.waitlistNumber ? (
                      <Badge variant="warning">예비 {student.waitlistNumber}번</Badge>
                    ) : (
                      <Badge variant="secondary">미배정</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={sc.variant}>{sc.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 justify-center">
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setSelectedStudent(student); setDetailOpen(true); }}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setSelectedStudent(student); setAssignOpen(true); }}>
                        <Home className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"
                        onClick={() => { setSelectedStudent(student); setTargetStatus("approved"); setStatusOpen(true); }}>
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedStudent?.name} — 점수 상세</DialogTitle>
            <DialogDescription>{selectedStudent?.school} · {selectedStudent?.parentRank} {selectedStudent?.parentUnit}</DialogDescription>
          </DialogHeader>
          {selectedStudent && <ScoringBreakdown student={selectedStudent} />}
        </DialogContent>
      </Dialog>

      {/* Manual Room Assign Modal */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>수동 호실 배정 (감사 기록됨)</DialogTitle>
            <DialogDescription>
              모든 수동 배정은 부패방지 감사 로그에 자동 기록됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>배정 대상</Label>
              <p className="text-sm font-medium">{selectedStudent?.name} ({selectedStudent?.scores.total}점)</p>
            </div>
            <div className="space-y-1.5">
              <Label>배정 호실 선택</Label>
              <Select value={targetRoom} onValueChange={setTargetRoom}>
                <SelectTrigger>
                  <SelectValue placeholder="호실 선택..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.map((r) => {
                    const remaining = r.capacity - r.studentIds.length;
                    return (
                      <SelectItem key={r.id} value={r.id}>
                        {r.number}호 — {remaining > 0 ? `잔여 ${remaining}자리` : "만실 (강제 배정)"}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>관리자 이름</Label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>수동 배정 사유 *</Label>
              <Textarea placeholder="사유를 반드시 입력하세요 (감사 기록됩니다)" value={reason}
                onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>취소</Button>
            <Button onClick={handleManualAssign} disabled={!targetRoom || !reason}>
              배정 확정 (감사 기록)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Override Modal */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>상태 수동 변경 (감사 기록됨)</DialogTitle>
            <DialogDescription>모든 상태 변경은 감사 로그에 기록됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>변경 상태</Label>
              <Select value={targetStatus} onValueChange={(v) => setTargetStatus(v as Student["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">승인</SelectItem>
                  <SelectItem value="rejected">반려</SelectItem>
                  <SelectItem value="pending">대기 중</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>관리자 이름</Label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>변경 사유 *</Label>
              <Textarea placeholder="변경 사유를 입력하세요" value={reason}
                onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>취소</Button>
            <Button onClick={handleStatusOverride} disabled={!reason}>변경 확정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
