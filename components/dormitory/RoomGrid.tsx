"use client";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function RoomGrid() {
  const { state, dispatch } = useApp();

  const handleAutoAssign = () => {
    dispatch({ type: "AUTO_ASSIGN_ROOMS" });
  };

  const totalCapacity = state.rooms.reduce((a, r) => a + r.capacity, 0);
  const totalOccupied = state.rooms.reduce((a, r) => a + r.studentIds.length, 0);
  const occupancyRate = Math.round((totalOccupied / totalCapacity) * 100);

  return (
    <div className="space-y-4">
      {/* Summary + Auto Assign */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>전체 수용: <strong>{totalCapacity}명</strong></span>
          <span>배정 완료: <strong className="text-emerald-600">{totalOccupied}명</strong></span>
          <span>잔여: <strong className="text-blue-600">{totalCapacity - totalOccupied}명</strong></span>
          <div className="flex items-center gap-1">
            <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
            <span className="text-xs">{occupancyRate}%</span>
          </div>
        </div>
        <Button onClick={handleAutoAssign} size="sm" className="gap-1.5">
          <Zap className="w-3.5 h-3.5" />
          자동 배정 실행
        </Button>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-3 gap-3">
        {state.rooms.map((room) => {
          const occupied = room.studentIds.length;
          const isFull = occupied >= room.capacity;
          const pct = Math.round((occupied / room.capacity) * 100);
          const studentsInRoom = state.students.filter((s) => room.studentIds.includes(s.id));

          return (
            <Card key={room.id} className={cn("transition-all", isFull ? "border-emerald-300 bg-emerald-50" : "hover:shadow-md")}>
              <CardHeader className="p-3 pb-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-blue-500" />
                    {room.number}호
                  </CardTitle>
                  {isFull ? (
                    <Badge variant="success" className="text-[10px]">만실</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      {room.capacity - occupied}자리 남음
                    </Badge>
                  )}
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                  <div
                    className={cn("h-full rounded-full", isFull ? "bg-emerald-500" : "bg-blue-500")}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                  <Users className="w-3 h-3" />
                  {occupied}/{room.capacity}명
                </div>
                <div className="space-y-1">
                  {studentsInRoom.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">배정된 학생 없음</p>
                  )}
                  {studentsInRoom.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-[10px] bg-white rounded px-2 py-1 border">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-blue-600 font-bold">{s.scores.total}점</span>
                    </div>
                  ))}
                  {Array.from({ length: room.capacity - occupied }).map((_, i) => (
                    <div key={i} className="h-5 border border-dashed border-slate-200 rounded text-[10px] text-slate-300 flex items-center justify-center">
                      빈 자리
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
