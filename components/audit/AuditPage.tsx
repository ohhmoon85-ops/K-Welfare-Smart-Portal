"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScoringBreakdown from "@/components/dormitory/ScoringBreakdown";
import { ShieldAlert, Search, FileBarChart, BarChart3, AlertTriangle } from "lucide-react";
import type { AuditAction } from "@/lib/types";

const actionConfig: Record<AuditAction, { label: string; variant: "destructive" | "warning" | "info" | "secondary" }> = {
  ROOM_MANUAL_ASSIGN: { label: "호실 수동 배정", variant: "warning" },
  ROOM_MANUAL_UNASSIGN: { label: "호실 배정 취소", variant: "destructive" },
  STATUS_OVERRIDE: { label: "상태 수동 변경", variant: "warning" },
  SCORE_OVERRIDE: { label: "점수 수동 조정", variant: "destructive" },
  VENDOR_STATUS_OVERRIDE: { label: "업체 상태 변경", variant: "warning" },
  NOTE_ADDED: { label: "비고 추가", variant: "secondary" },
};

export default function AuditPage() {
  const { state } = useApp();
  const [search, setSearch] = useState("");

  const filteredLogs = state.auditLog.filter(
    (log) =>
      log.targetName.includes(search) ||
      log.adminName.includes(search) ||
      log.reason.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-red-700">부패방지 감사 시스템 (Anti-Corruption Audit)</p>
          <p className="text-xs text-red-600 mt-0.5">
            모든 수동 조정(호실 배정, 상태 변경 등)은 자동으로 이 페이지에 기록됩니다.
            자동 산정 결과를 임의로 변경할 경우 반드시 사유가 기재되어야 합니다.
          </p>
        </div>
      </div>

      <Tabs defaultValue="log">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="log" className="gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" />
            부패방지 로그
          </TabsTrigger>
          <TabsTrigger value="scores" className="gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            점수 상세 내역
          </TabsTrigger>
        </TabsList>

        {/* ─── Audit Log Tab ─────────────────────────────────────────── */}
        <TabsContent value="log" className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input className="pl-9" placeholder="이름, 관리자, 사유 검색..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Badge variant="secondary">{filteredLogs.length}건</Badge>
            {filteredLogs.length > 0 && (
              <span className="text-xs text-slate-500">최신순 정렬</span>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed p-12 text-center text-slate-400">
              <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">수동 조정 기록 없음</p>
              <p className="text-sm mt-1">모든 배정이 자동 알고리즘으로 처리되었습니다.</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-red-50">
                    <TableHead>일시</TableHead>
                    <TableHead>관리자</TableHead>
                    <TableHead>조치 유형</TableHead>
                    <TableHead>대상</TableHead>
                    <TableHead>변경 전</TableHead>
                    <TableHead>변경 후</TableHead>
                    <TableHead>사유</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const cfg = actionConfig[log.action];
                    return (
                      <TableRow key={log.id} className="text-sm">
                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(log.timestamp)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="font-medium text-xs">{log.adminName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cfg.variant as any} className="text-[10px]">
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{log.targetName}</p>
                          <p className="text-[10px] text-slate-400">{log.targetId}</p>
                        </TableCell>
                        <TableCell>
                          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-xs">
                            {log.before}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded text-xs">
                            {log.after}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <p className="text-xs text-slate-600 line-clamp-2">{log.reason}</p>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ─── Scoring Breakdown Tab ─────────────────────────────────── */}
        <TabsContent value="scores" className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <FileBarChart className="w-4 h-4 text-blue-500" />
              학생 기숙사 — 전체 점수 상세 내역
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[...state.students]
                .sort((a, b) => b.scores.total - a.scores.total)
                .map((student) => {
                  const room = state.rooms.find((r) => r.id === student.roomId);
                  return (
                    <Card key={student.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-sm">{student.name}</CardTitle>
                            <CardDescription>{student.school}</CardDescription>
                          </div>
                          <div className="text-right">
                            {room ? (
                              <Badge variant="success">{room.number}호</Badge>
                            ) : (
                              <Badge variant="secondary">미배정</Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-slate-500">
                          <span>{student.parentRank} · {student.parentUnit}</span>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="bg-slate-50 rounded p-3 text-xs space-y-1 mb-3">
                          <div className="flex justify-between">
                            <span className="text-slate-500">학교급</span>
                            <span className="font-medium">{student.schoolLevel}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">복무기간</span>
                            <span className="font-medium">{student.serviceYears}년</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">가점</span>
                            <span className="font-medium">
                              {student.isMultiChild || student.isMulticultural || student.isSingleParent ? "+1점" : "없음"}
                            </span>
                          </div>
                        </div>
                        <ScoringBreakdown student={student} />
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-amber-500" />
              조달·입찰 — PX/BX 업체 평가 상세 내역
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-amber-50">
                    <TableHead>순위</TableHead>
                    <TableHead>업체명</TableHead>
                    <TableHead>소분류</TableHead>
                    <TableHead className="text-center">적격심사</TableHead>
                    <TableHead className="text-center">할인율(%)</TableHead>
                    <TableHead className="text-center">합산 점수</TableHead>
                    <TableHead className="text-center">개찰 여부</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...state.vendors]
                    .filter((v) => v.vendorChannel === "PX/BX")
                    .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
                    .map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-bold text-sm text-amber-500">
                          {vendor.rank ? `${vendor.rank}위` : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell className="text-slate-500 text-sm">{vendor.subCategory}</TableCell>
                        <TableCell className="text-center">{vendor.qualificationScore ?? "—"}</TableCell>
                        <TableCell className="text-center">{vendor.discountRate ?? "—"}%</TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-blue-700">{vendor.totalScore ?? "—"}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {vendor.passedQualification
                            ? <Badge variant="success" className="text-[10px]">개찰 대상</Badge>
                            : <Badge variant="destructive" className="text-[10px]">80점 미달</Badge>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mt-5 mb-3">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              WA-mall 업체 평가 상세 내역
            </h2>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-50">
                    <TableHead>업체명</TableHead>
                    <TableHead>대분류</TableHead>
                    <TableHead>소분류</TableHead>
                    <TableHead>신청유형</TableHead>
                    <TableHead className="text-right">시중최저가</TableHead>
                    <TableHead className="text-right">판매요청가</TableHead>
                    <TableHead className="text-center">할인율</TableHead>
                    <TableHead className="text-center">가격요건</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {state.vendors
                    .filter((v) => v.vendorChannel === "WA-mall")
                    .map((vendor) => {
                      const discountPct = vendor.marketLowestPrice && vendor.requestedPrice
                        ? Math.round((1 - vendor.requestedPrice / vendor.marketLowestPrice) * 1000) / 10
                        : 0;
                      const ok = vendor.marketLowestPrice != null && vendor.requestedPrice != null
                        && vendor.requestedPrice <= vendor.marketLowestPrice * 0.9;
                      return (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell className="text-slate-500 text-sm">{vendor.productCategory ?? "—"}</TableCell>
                          <TableCell className="text-slate-500 text-sm">{vendor.subCategory}</TableCell>
                          <TableCell className="text-sm">{vendor.vendorSaleType ?? "—"}</TableCell>
                          <TableCell className="text-right text-sm">
                            {vendor.marketLowestPrice?.toLocaleString() ?? "—"}원
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            {vendor.requestedPrice?.toLocaleString() ?? "—"}원
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {discountPct.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-center">
                            {ok
                              ? <Badge variant="success" className="text-[10px]">충족</Badge>
                              : <Badge variant="destructive" className="text-[10px]">미충족</Badge>
                            }
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
