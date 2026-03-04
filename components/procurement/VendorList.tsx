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
import { Award, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { Vendor } from "@/lib/types";

const statusConfig = {
  pending: { label: "검토 중", variant: "warning" as const },
  approved: { label: "낙찰", variant: "success" as const },
  rejected: { label: "탈락", variant: "destructive" as const },
};

function RankBadge({ rank }: { rank?: number }) {
  if (!rank) return null;
  if (rank === 1) return <span className="text-amber-500 font-bold text-sm">🥇 1위</span>;
  if (rank === 2) return <span className="text-slate-400 font-bold text-sm">🥈 2위</span>;
  if (rank === 3) return <span className="text-amber-700 font-bold text-sm">🥉 3위</span>;
  return <span className="text-slate-500 text-sm font-medium">{rank}위</span>;
}

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium w-8">{score}</span>
    </div>
  );
}

export default function VendorList() {
  const { state, dispatch } = useApp();
  const [statusOpen, setStatusOpen] = useState(false);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [adminName, setAdminName] = useState("관리자");
  const [reason, setReason] = useState("");
  const [targetStatus, setTargetStatus] = useState<Vendor["status"]>("approved");

  const grouped = state.vendors.reduce<Record<string, Vendor[]>>((acc, v) => {
    if (!acc[v.item]) acc[v.item] = [];
    acc[v.item].push(v);
    return acc;
  }, {});

  const handleOverride = () => {
    if (!selected || !reason) return;
    dispatch({ type: "OVERRIDE_VENDOR_STATUS", vendorId: selected.id, status: targetStatus, admin: adminName, reason });
    setStatusOpen(false);
    setReason("");
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([item, vendors]) => {
        const ranked = [...vendors].sort((a, b) => b.totalScore - a.totalScore);
        return (
          <div key={item} className="rounded-lg border overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-sm text-slate-700">{item}</span>
              <Badge variant="secondary" className="ml-auto text-[10px]">{vendors.length}개 업체 참가</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-white">
                  <TableHead className="w-16">순위</TableHead>
                  <TableHead>업체명</TableHead>
                  <TableHead>가격 점수 (70%)</TableHead>
                  <TableHead>기술 점수 (30%)</TableHead>
                  <TableHead className="text-center">종합 점수</TableHead>
                  <TableHead className="text-center">상태</TableHead>
                  <TableHead className="text-center">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranked.map((vendor) => {
                  const sc = statusConfig[vendor.status];
                  return (
                    <TableRow key={vendor.id} className={vendor.rank === 1 ? "bg-amber-50" : ""}>
                      <TableCell><RankBadge rank={vendor.rank} /></TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{vendor.name}</p>
                        <p className="text-[10px] text-slate-500">{formatDateTime(vendor.submittedAt)}</p>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <ScoreBar score={vendor.priceScore} color="bg-amber-500" />
                          <p className="text-[10px] text-slate-400">반영: {(vendor.priceScore * 0.7).toFixed(1)}점</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5">
                          <ScoreBar score={vendor.technicalScore} color="bg-blue-500" />
                          <p className="text-[10px] text-slate-400">반영: {(vendor.technicalScore * 0.3).toFixed(1)}점</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-bold text-lg ${vendor.rank === 1 ? "text-amber-600" : "text-blue-600"}`}>
                          {vendor.totalScore}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button variant="ghost" size="sm" className="text-xs h-7"
                          onClick={() => { setSelected(vendor); setTargetStatus("approved"); setStatusOpen(true); }}>
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

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>업체 상태 변경 (감사 기록됨)</DialogTitle>
            <DialogDescription>모든 수동 상태 변경은 감사 로그에 기록됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm font-medium">{selected?.name} — 현재 점수: {selected?.totalScore}점</p>
            <div className="space-y-1.5">
              <Label>변경 상태</Label>
              <Select value={targetStatus} onValueChange={(v) => setTargetStatus(v as Vendor["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">낙찰</SelectItem>
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
