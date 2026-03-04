"use client";
import { useApp } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Users, Building2, ShoppingCart, ShieldCheck, TrendingUp, AlertTriangle,
  CheckCircle2, Clock, XCircle, Zap, ArrowRight,
} from "lucide-react";
import type { ActiveModule } from "@/lib/types";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-all" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
          </div>
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { state, dispatch } = useApp();

  const nav = (mod: ActiveModule) => dispatch({ type: "SET_MODULE", module: mod });

  // Dormitory stats
  const totalStudents = state.students.length;
  const approvedStudents = state.students.filter((s) => s.status === "approved").length;
  const pendingStudents = state.students.filter((s) => s.status === "pending").length;
  const rejectedStudents = state.students.filter((s) => s.status === "rejected").length;
  const assignedStudents = state.students.filter((s) => !!s.roomId).length;

  const totalCapacity = state.rooms.reduce((a, r) => a + r.capacity, 0);
  const totalOccupied = state.rooms.reduce((a, r) => a + r.studentIds.length, 0);
  const occupancyPct = Math.round((totalOccupied / totalCapacity) * 100);

  // Procurement stats
  const totalVendors = state.vendors.length;
  const approvedVendors = state.vendors.filter((v) => v.status === "final_selected" || v.status === "first_selected").length;
  const topVendor = state.vendors.find((v) => v.vendorChannel === "PX/BX" && v.rank === 1);

  // Audit stats
  const auditCount = state.auditLog.length;
  const manualAdjustments = state.auditLog.filter((l) =>
    ["ROOM_MANUAL_ASSIGN", "STATUS_OVERRIDE", "VENDOR_STATUS_OVERRIDE"].includes(l.action)
  ).length;

  const topStudents = [...state.students]
    .sort((a, b) => b.scores.total - a.scores.total)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Users} label="전체 신청 학생" value={totalStudents}
          sub={`배정 완료 ${assignedStudents}명`} color="bg-blue-500"
          onClick={() => nav("dormitory")} />
        <StatCard icon={Building2} label="기숙사 입실률" value={`${occupancyPct}%`}
          sub={`${totalOccupied}/${totalCapacity}명`} color="bg-emerald-500"
          onClick={() => nav("dormitory")} />
        <StatCard icon={ShoppingCart} label="입찰 참가 업체" value={totalVendors}
          sub={`낙찰 ${approvedVendors}개 업체`} color="bg-amber-500"
          onClick={() => nav("procurement")} />
        <StatCard icon={ShieldCheck} label="감사 기록" value={auditCount}
          sub={`수동 조정 ${manualAdjustments}건`} color={manualAdjustments > 0 ? "bg-red-500" : "bg-slate-500"}
          onClick={() => nav("audit")} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Dormitory Status */}
        <Card className="col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                기숙사 신청 현황
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => nav("dormitory")}>
                상세 보기 <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Status Pills */}
            <div className="flex gap-3 mb-4">
              <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 flex-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <div>
                  <p className="text-xs text-amber-600">대기</p>
                  <p className="font-bold text-amber-700">{pendingStudents}명</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 rounded-lg px-3 py-2 flex-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-xs text-emerald-600">승인</p>
                  <p className="font-bold text-emerald-700">{approvedStudents}명</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-red-50 rounded-lg px-3 py-2 flex-1">
                <XCircle className="w-4 h-4 text-red-400" />
                <div>
                  <p className="text-xs text-red-500">반려</p>
                  <p className="font-bold text-red-600">{rejectedStudents}명</p>
                </div>
              </div>
            </div>

            {/* Top 5 Students */}
            <p className="text-xs font-semibold text-slate-600 mb-2">점수 상위 5명</p>
            <div className="space-y-1.5">
              {topStudents.map((s, i) => {
                const room = state.rooms.find((r) => r.id === s.roomId);
                return (
                  <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="w-4 text-xs font-bold text-slate-400">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{s.school}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-blue-600">{s.scores.total}점</p>
                      {room ? (
                        <Badge variant="success" className="text-[9px] py-0">{room.number}호</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] py-0">미배정</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {pendingStudents > 0 && (
              <div className="mt-3">
                <Button onClick={() => dispatch({ type: "AUTO_ASSIGN_ROOMS" })} size="sm" className="w-full gap-1.5" variant="outline">
                  <Zap className="w-3.5 h-3.5 text-blue-500" />
                  대기 중인 {pendingStudents}명 자동 배정 실행
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Top Vendor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-amber-500" />
                조달 1순위 업체
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topVendor ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🥇</span>
                    <div>
                      <p className="font-semibold text-sm">{topVendor.name}</p>
                      <p className="text-xs text-slate-500">{topVendor.item}</p>
                    </div>
                  </div>
                  <div className="bg-amber-50 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">적격심사 점수</span>
                      <span className={`font-medium ${(topVendor.passedQualification) ? "text-emerald-600" : "text-red-500"}`}>
                        {topVendor.qualificationScore}점 {topVendor.passedQualification ? "✓ 통과" : "✗ 미달"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">할인율</span>
                      <span className="font-medium">{topVendor.discountRate}%</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>합산 점수</span>
                      <span className="text-amber-600 text-sm">{topVendor.totalScore}점</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => nav("procurement")}>
                    전체 업체 순위 <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-slate-400">등록된 업체가 없습니다.</p>
              )}
            </CardContent>
          </Card>

          {/* Audit Alert */}
          <Card className={manualAdjustments > 0 ? "border-red-200 bg-red-50" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {manualAdjustments > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                )}
                투명성 현황
              </CardTitle>
            </CardHeader>
            <CardContent>
              {manualAdjustments > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-red-700">
                    자동 배정 결과에 대한 <strong>{manualAdjustments}건</strong>의 수동 조정이 감지되었습니다.
                  </p>
                  <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => nav("audit")}>
                    감사 로그 확인 <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1" />
                  <p className="text-xs text-emerald-700 font-medium">수동 조정 없음</p>
                  <p className="text-[10px] text-slate-500">전 과정이 자동 알고리즘으로 처리됨</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Info Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-blue-300 uppercase tracking-widest mb-1">
              국군복지단 행정 신뢰도 제고 프로젝트
            </p>
            <h2 className="text-lg font-bold mb-1">「지능형 통합 복지행정 자동화 시스템」</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              납품 업체 선정 및 군자녀 기숙사 배정의 주관적 개입을 차단하고,
              객관적 점수 산출 근거를 실시간 제공하여 민원을 최소화하는 공정·투명 행정 실현 플랫폼.
            </p>
          </div>
          <div className="text-right shrink-0 ml-6">
            <p className="text-[10px] text-slate-500 uppercase mb-1">구현 로드맵</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] font-bold">1</span>
                <span className="text-emerald-400">Prototype — UI & 핵심 로직 개발</span>
                <span className="text-emerald-500">✓ 완료</span>
              </div>
              <div className="flex items-center gap-2 opacity-60">
                <span className="w-4 h-4 rounded-full bg-slate-600 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Testing — 실제 가점표 적용 시뮬레이션</span>
              </div>
              <div className="flex items-center gap-2 opacity-40">
                <span className="w-4 h-4 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Deployment — Vercel 배포 & 지휘부 시연</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
