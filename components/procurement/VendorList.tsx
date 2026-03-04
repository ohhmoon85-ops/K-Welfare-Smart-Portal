"use client";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Award, CheckCircle2, XCircle, ShoppingCart, Globe } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

const statusConfig: Record<Vendor["status"], { label: string; variant: "success" | "warning" | "destructive" | "secondary" }> = {
  pending:        { label: "검토 중",   variant: "warning" },
  qualified:      { label: "적격",      variant: "secondary" },
  first_selected: { label: "1차 선정",  variant: "success" },
  final_selected: { label: "최종 선정", variant: "success" },
  rejected:       { label: "탈락",      variant: "destructive" },
};

function RankBadge({ rank }: { rank?: number }) {
  if (!rank) return null;
  if (rank === 1) return <span className="font-bold text-sm">🥇 1위</span>;
  if (rank === 2) return <span className="font-bold text-sm">🥈 2위</span>;
  if (rank === 3) return <span className="font-bold text-sm">🥉 3위</span>;
  return <span className="text-slate-500 text-sm font-medium">{rank}위</span>;
}

function PxBxTable({ vendors, onStatusChange }: { vendors: Vendor[]; onStatusChange: (v: Vendor) => void }) {
  const grouped = vendors.reduce<Record<string, Vendor[]>>((acc, v) => {
    if (!acc[v.subCategory]) acc[v.subCategory] = [];
    acc[v.subCategory].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([sub, vList]) => {
        const sorted = [...vList].sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
        return (
          <div key={sub} className="rounded-lg border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-sm text-slate-700">소분류: {sub}</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{vList.length}개 업체</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-16">순위</TableHead>
                  <TableHead>업체명</TableHead>
                  <TableHead className="text-center">유형</TableHead>
                  <TableHead className="text-center">적격심사</TableHead>
                  <TableHead className="text-center">할인율</TableHead>
                  <TableHead className="text-center">합산점수</TableHead>
                  <TableHead className="text-center">개찰</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((v) => {
                  const sc = statusConfig[v.status];
                  const passed = v.passedQualification ?? false;
                  return (
                    <TableRow key={v.id} className={v.rank === 1 ? "bg-amber-50" : !passed ? "bg-red-50/40 opacity-70" : ""}>
                      <TableCell><RankBadge rank={v.rank} /></TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{v.name}</p>
                        <p className="text-[10px] text-slate-500">{formatDateTime(v.submittedAt)}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-[10px]">{v.vendorType}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`font-bold text-sm ${passed ? "text-emerald-600" : "text-red-500"}`}>
                            {v.qualificationScore}점
                          </span>
                          {passed
                            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            : <XCircle className="w-3 h-3 text-red-400" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium text-blue-600">{v.discountRate}%</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-lg ${v.rank === 1 ? "text-amber-600" : passed ? "text-blue-600" : "text-slate-400"}`}>
                          {v.totalScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {passed
                          ? <Badge variant="success" className="text-[10px]">개찰 대상</Badge>
                          : <Badge variant="destructive" className="text-[10px]">개찰 제외</Badge>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onStatusChange(v)}>
                          상태 변경
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}

function WaMallTable({ vendors, onStatusChange }: { vendors: Vendor[]; onStatusChange: (v: Vendor) => void }) {
  const grouped = vendors.reduce<Record<string, Vendor[]>>((acc, v) => {
    const key = v.productCategory ?? "기타";
    if (!acc[key]) acc[key] = [];
    acc[key].push(v);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([cat, vList]) => (
        <div key={cat} className="rounded-lg border overflow-hidden">
          <div className="bg-slate-50 px-4 py-2.5 border-b flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span className="font-semibold text-sm text-slate-700">카테고리: {cat}</span>
            <Badge variant="secondary" className="ml-auto text-[10px]">{vList.length}개 업체</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-white">
                <TableHead>업체명</TableHead>
                <TableHead>소분류 / 신청유형</TableHead>
                <TableHead className="text-right">시중 최저가</TableHead>
                <TableHead className="text-right">복지단 요청가</TableHead>
                <TableHead className="text-center">할인율</TableHead>
                <TableHead className="text-center">조건충족</TableHead>
                <TableHead className="text-center">상태</TableHead>
                <TableHead className="text-center">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vList.map((v) => {
                const sc = statusConfig[v.status];
                const discountOk = v.marketLowestPrice && v.requestedPrice
                  ? v.requestedPrice <= v.marketLowestPrice * 0.9
                  : null;
                const discountPct = v.marketLowestPrice && v.requestedPrice
                  ? Math.round((1 - v.requestedPrice / v.marketLowestPrice) * 100)
                  : null;
                return (
                  <TableRow key={v.id} className={discountOk === false ? "bg-red-50/40" : ""}>
                    <TableCell>
                      <p className="font-medium text-sm">{v.name}</p>
                      <p className="text-[10px] text-slate-500">{v.businessRegNumber}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{v.subCategory}</p>
                      <Badge variant="secondary" className="text-[10px] mt-0.5">{v.vendorSaleType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-sm">{v.marketLowestPrice?.toLocaleString()}원</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold text-sm ${discountOk ? "text-emerald-600" : "text-red-500"}`}>
                        {v.requestedPrice?.toLocaleString()}원
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {discountPct !== null && (
                        <span className={`font-bold text-sm ${discountOk ? "text-emerald-600" : "text-red-500"}`}>
                          {discountPct}%
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {discountOk === null ? (
                        <Badge variant="secondary" className="text-[10px]">미입력</Badge>
                      ) : discountOk ? (
                        <Badge variant="success" className="text-[10px]">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />10%↑ 충족
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          <XCircle className="w-2.5 h-2.5 mr-0.5" />가격 미달
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => onStatusChange(v)}>
                        상태 변경
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ))}
    </div>
  );
}

export default function VendorList() {
  const { state, dispatch } = useApp();
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [adminName, setAdminName] = useState("관리자");
  const [reason, setReason] = useState("");
  const [targetStatus, setTargetStatus] = useState<Vendor["status"]>("qualified");

  const pxVendors = state.vendors.filter((v) => v.vendorChannel === "PX/BX");
  const waVendors = state.vendors.filter((v) => v.vendorChannel === "WA-mall");

  const handleStatusChange = (v: Vendor) => {
    setSelected(v);
    setTargetStatus("qualified");
    setStatusOpen(true);
  };

  const handleOverride = () => {
    if (!selected || !reason) return;
    dispatch({ type: "OVERRIDE_VENDOR_STATUS", vendorId: selected.id, status: targetStatus, admin: adminName, reason });
    setStatusOpen(false);
    setReason("");
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="px">
        <TabsList>
          <TabsTrigger value="px" className="gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" />
            PX/BX 정기선정 ({pxVendors.length})
          </TabsTrigger>
          <TabsTrigger value="wa" className="gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            WA-mall 일반상품 ({waVendors.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="px" className="mt-4">
          {pxVendors.length === 0
            ? <p className="text-sm text-slate-400 py-6 text-center">등록된 PX/BX 업체가 없습니다.</p>
            : <PxBxTable vendors={pxVendors} onStatusChange={handleStatusChange} />}
        </TabsContent>
        <TabsContent value="wa" className="mt-4">
          {waVendors.length === 0
            ? <p className="text-sm text-slate-400 py-6 text-center">등록된 WA-mall 업체가 없습니다.</p>
            : <WaMallTable vendors={waVendors} onStatusChange={handleStatusChange} />}
        </TabsContent>
      </Tabs>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업체 상태 변경 (감사 기록됨)</DialogTitle>
            <DialogDescription>모든 수동 상태 변경은 감사 로그에 기록됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">{selected?.name} ({selected?.vendorChannel})</p>
            <div className="space-y-1.5">
              <Label>변경 상태</Label>
              <Select value={targetStatus} onValueChange={(v) => setTargetStatus(v as Vendor["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="qualified">적격</SelectItem>
                  <SelectItem value="first_selected">1차 선정</SelectItem>
                  <SelectItem value="final_selected">최종 선정</SelectItem>
                  <SelectItem value="rejected">탈락</SelectItem>
                  <SelectItem value="pending">검토 중</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>관리자 이름</Label>
              <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>변경 사유 *</Label>
              <Textarea placeholder="사유를 반드시 기재하세요 (감사 기록됩니다)" value={reason}
                onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>취소</Button>
            <Button onClick={handleOverride} disabled={!reason}>확정 (감사 기록)</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
