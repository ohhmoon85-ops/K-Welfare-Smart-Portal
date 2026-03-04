"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import VendorForm from "./VendorForm";
import VendorList from "./VendorList";
import { List, PlusCircle, ClipboardList, Globe } from "lucide-react";

// ─── PX/BX 10단계 선정절차 타임라인 ────────────────────────────────────────────

const PX_TIMELINE = [
  { step: "①", label: "사업계획 수립",       period: "1~2월",  done: true },
  { step: "②", label: "수요조사",             period: "2~3월",  done: true },
  { step: "③", label: "선정공고",             period: "3월",    done: true },
  { step: "④", label: "전산 신청",            period: "3~4월",  done: true },
  { step: "⑤", label: "서류 접수",            period: "4월",    done: true },
  { step: "⑥", label: "적격심사",             period: "4~5월",  done: false, note: "" },
  { step: "⑦", label: "소분류별 가중치 산출", period: "5월",    done: false, note: "" },
  { step: "⑧", label: "개찰 / 1차 선정",      period: "5~6월",  done: false, note: "적격심사 80점 이상 + 할인율 합산 → 소분류별 1차 선정" },
  { step: "⑨", label: "2차 심의 / 최종 선정", period: "6~7월",  done: false, note: "" },
  { step: "⑩", label: "계약 체결",            period: "7~8월",  done: false, note: "" },
];

// ─── WA-mall 5단계 선정절차 타임라인 ────────────────────────────────────────────

const WA_TIMELINE = [
  { step: "①", label: "사업공고",      period: "3.3~3.11",   done: true,  note: "" },
  { step: "②", label: "업체 전산입력", period: "3.6~3.17",   done: true,  note: "국군복지단 선정관리시스템 입력" },
  { step: "③", label: "서류 접수",     period: "3.24~",      done: false, note: "별지 #1~#5 구비서류 제출" },
  { step: "④", label: "적격심사",      period: "4~5월 중",   done: false, note: "서류심사 + 가격조사(최저가 10%↑) + 물품 적합성" },
  { step: "⑤", label: "계약 체결",     period: "5월 중",     done: false, note: "계약기간: ~2027.12.31 / 복지율 4%" },
];

function Timeline({ items, color }: {
  items: { step: string; label: string; period: string; done: boolean; note?: string }[];
  color: "amber" | "blue";
}) {
  const active = color === "amber" ? "bg-amber-500 text-white" : "bg-blue-500 text-white";
  const noteBg = color === "amber" ? "text-amber-600" : "text-blue-600";
  return (
    <div className="relative">
      <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-slate-200" />
      <div className="space-y-3">
        {items.map((t) => (
          <div key={t.step} className="flex items-start gap-3">
            <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
              t.done ? active : "bg-slate-100 text-slate-500 border border-slate-300"
            }`}>
              {t.step}
            </div>
            <div className="flex-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-medium ${t.done ? "text-slate-800" : "text-slate-500"}`}>{t.label}</span>
                <Badge variant={t.done ? "success" : "secondary"} className="text-[10px] py-0">{t.period}</Badge>
              </div>
              {t.note && <p className={`text-[10px] mt-0.5 ${noteBg}`}>{t.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProcurementModule() {
  return (
    <Tabs defaultValue="list" className="space-y-4">
      <TabsList className="grid w-full max-w-sm grid-cols-3">
        <TabsTrigger value="list" className="gap-1.5">
          <List className="w-3.5 h-3.5" />
          업체 현황
        </TabsTrigger>
        <TabsTrigger value="register" className="gap-1.5">
          <PlusCircle className="w-3.5 h-3.5" />
          업체 등록
        </TabsTrigger>
        <TabsTrigger value="timeline" className="gap-1.5">
          <ClipboardList className="w-3.5 h-3.5" />
          선정 절차
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <VendorList />
      </TabsContent>

      <TabsContent value="register">
        <div className="max-w-xl">
          <VendorForm />
        </div>
      </TabsContent>

      <TabsContent value="timeline">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-600 mb-4 flex items-center gap-1.5">
                <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                PX/BX 정기선정 10단계 절차
              </p>
              <Timeline items={PX_TIMELINE} color="amber" />
              <div className="mt-4 bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                <strong>핵심 기준:</strong> 적격심사(80점↑) + 할인율(%) 합산 → 소분류별 순위
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <p className="text-xs font-semibold text-slate-600 mb-4 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                WA-mall 일반상품 정기 선정 절차 ('26-1차)
              </p>
              <Timeline items={WA_TIMELINE} color="blue" />
              <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-0.5">
                <p><strong>필수 요건:</strong> 시중 종합몰 2개소 이상 판매 + 최저가 10%↑ 저렴</p>
                <p><strong>배송:</strong> 영업일 3일 내 발송 / 배송비 업체 부담</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
