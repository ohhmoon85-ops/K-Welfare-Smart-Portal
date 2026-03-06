"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Globe, CheckCircle2, XCircle, FileCheck, Truck, Scale } from "lucide-react";

export default function ProcurementCriteria() {
  return (
    <div className="space-y-6">

      {/* ── 채널별 선정 방식 요약 ──────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingBag className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-amber-700">PX/BX 정기선정</span>
          </div>
          <p className="text-xs text-amber-700 leading-relaxed">
            적격심사 80점 이상 업체를 개찰 대상으로 하여,
            <strong> 적격심사 점수 + 할인율 합산 점수</strong> 순으로 소분류별 1차 선정 후
            2차 심의를 통해 최종 계약
          </p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge variant="warning" className="text-[10px]">10단계 절차</Badge>
            <Badge variant="secondary" className="text-[10px]">적격심사 80점 기준</Badge>
          </div>
        </div>
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Globe className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">WA-mall 일반상품 정기선정</span>
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            시중 종합몰 2개소 이상 판매 증빙 + <strong>시중 최저가 대비 10% 이상 저렴</strong>한
            업체를 적격 심사하여 계약 체결 (가격 적격 요건이 핵심)
          </p>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Badge variant="info" className="text-[10px]">5단계 절차</Badge>
            <Badge variant="secondary" className="text-[10px]">가격 10% 요건</Badge>
          </div>
        </div>
      </div>

      {/* ── PX/BX 선정 기준 ────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-amber-700 flex items-center gap-2 mb-3">
          <ShoppingBag className="w-4 h-4" />
          PX/BX 정기선정 — 평가 기준 상세
        </h2>

        <div className="grid grid-cols-2 gap-4">

          {/* 적격심사 통과 기준 */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-500" />
                적격심사 통과 기준
                <Badge variant="warning" className="text-[10px]">80점 이상</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-emerald-50 rounded-lg p-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-700">80점 이상 — 개찰 대상</p>
                    <p className="text-[10px] text-emerald-600">할인율과 합산하여 소분류별 순위 산정</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-red-50 rounded-lg p-2.5">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-red-600">80점 미만 — 개찰 제외</p>
                    <p className="text-[10px] text-red-500">할인율과 무관하게 선정 대상에서 제외</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 bg-amber-50 rounded-lg p-3 text-xs text-amber-700">
                <p className="font-semibold mb-1">합산 점수 산출 방식</p>
                <p className="font-mono bg-white rounded px-2 py-1 text-center text-sm">
                  적격심사 점수 + 할인율(%) = 합산 점수
                </p>
                <p className="mt-1 text-[10px] opacity-80">예) 적격심사 85점 + 할인율 12% = 97점</p>
              </div>
            </CardContent>
          </Card>

          {/* 소분류 유형 */}
          <Card className="border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                소분류 신청 유형
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="text-left px-2 py-1.5 font-medium">유형</th>
                    <th className="text-left px-2 py-1.5 font-medium">특징</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="px-2 py-2 font-semibold text-amber-700">일반 소분류</td>
                    <td className="px-2 py-2 text-slate-600">경쟁 입찰 대상, 일반 서류 제출</td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-2 py-2 font-semibold text-red-600">경쟁과열 소분류</td>
                    <td className="px-2 py-2 text-slate-600">추가 제한 기준 적용, 별도 서류 필요</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 제출서류 */}
          <Card className="border-amber-200 col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-500" />
                PX/BX 제출서류 (⑤ 서류접수 단계)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { num: "①", name: "입찰참가신청서",    note: "기관 양식 / 직인" },
                  { num: "②", name: "사업자등록증",       note: "사본 가능 / 최신본" },
                  { num: "③", name: "POS 영수증",         note: "최근 3개년 판매 실적" },
                  { num: "④", name: "소분류확인서",        note: "판매과 발급" },
                  { num: "⑤", name: "신청유형별 서류",    note: "사업지원과 제출" },
                ].map((doc) => (
                  <div key={doc.num} className="bg-amber-50 rounded-lg p-2.5 border border-amber-200 text-center">
                    <span className="text-[10px] font-bold text-amber-600">{doc.num}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-tight">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{doc.note}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── WA-mall 선정 기준 ───────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold text-blue-700 flex items-center gap-2 mb-3">
          <Globe className="w-4 h-4" />
          WA-mall 일반상품 정기선정 — 평가 기준 상세 ('26-1차)
        </h2>

        <div className="grid grid-cols-2 gap-4">

          {/* 가격 적격 요건 */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-500" />
                가격 적격 요건
                <Badge variant="info" className="text-[10px]">핵심 요건</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                <p className="font-semibold mb-2">판매 요청가 기준</p>
                <p className="font-mono bg-white rounded px-2 py-1 text-center text-sm">
                  판매요청가 ≤ 시중최저가 × 0.9
                </p>
                <p className="mt-1 text-[10px] opacity-80">즉, 시중 온라인 최저가보다 10% 이상 저렴해야 함</p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-700">시중 종합몰 <strong>2개소 이상</strong> 판매 증빙 첨부</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-700">가격 조사 기준: 접수일 기준 최저가</span>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-slate-700">물품 적합성 심사 병행 실시</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 신청자격 유형 */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">신청자격 유형</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500">
                    <th className="text-left px-2 py-1.5 font-medium">유형</th>
                    <th className="text-left px-2 py-1.5 font-medium">대상</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { type: "직접제조판매", desc: "직접 제조·판매하는 제조사" },
                    { type: "OEM",          desc: "위탁 제조 후 자사 브랜드 판매" },
                    { type: "수입 (해외)",   desc: "해외 제품 수입 후 판매" },
                    { type: "판매대행",      desc: "타 브랜드 위탁 판매" },
                  ].map((row) => (
                    <tr key={row.type} className="border-t">
                      <td className="px-2 py-1.5 font-semibold text-blue-700">{row.type}</td>
                      <td className="px-2 py-1.5 text-slate-600">{row.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 계약 조건 */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                계약 주요 조건
              </CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    { label: "계약기간",   value: "~2027. 12. 31" },
                    { label: "복지율",     value: "4%" },
                    { label: "발송기준",   value: "영업일 3일 내 발송" },
                    { label: "배송비",     value: "업체 부담 (무료배송)" },
                    { label: "배송기준",   value: "영업일 5일 내 도착" },
                  ].map((row) => (
                    <tr key={row.label} className="border-t first:border-t-0">
                      <td className="py-1.5 text-slate-500 w-24">{row.label}</td>
                      <td className="py-1.5 font-semibold text-blue-700">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* 배송·서비스 기준 */}
          <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-500" />
                배송 · 서비스 기준
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {[
                { ok: true,  text: "영업일 3일 내 발송 (계약 기준)" },
                { ok: true,  text: "영업일 5일 내 배송 완료 (서류 신청 기준)" },
                { ok: true,  text: "배송비 전액 업체 부담" },
                { ok: true,  text: "반품·교환 기준 준수 (소비자 보호법)" },
                { ok: false, text: "발송 지연 시 위약금 부과 가능" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  {item.ok
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  }
                  <span className={item.ok ? "text-slate-700" : "text-red-600"}>{item.text}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* WA-mall 제출서류 */}
          <Card className="border-blue-200 col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-500" />
                WA-mall 제출서류 (③ 서류접수 단계)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { num: "①", name: "신청서 (별지 #1)",         note: "선정관리시스템 출력" },
                  { num: "②", name: "물품 대표 이미지",          note: "정면·측면·후면 3종↑" },
                  { num: "③", name: "유통 증빙 자료",            note: "종합몰 2개소↑ 판매 캡처" },
                  { num: "④", name: "사업자등록증명원",          note: "3개월 이내 발급" },
                  { num: "⑤", name: "시험성적서/품목제조보고서", note: "식품 등 필수 품목" },
                ].map((doc) => (
                  <div key={doc.num} className="bg-blue-50 rounded-lg p-2.5 border border-blue-200 text-center">
                    <span className="text-[10px] font-bold text-blue-600">{doc.num}</span>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5 leading-tight">{doc.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{doc.note}</p>
                  </div>
                ))}
              </div>

              {/* 대분류 카테고리 */}
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-600 mb-2">신청 가능 대분류 카테고리 (10종)</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "화장품", "패션잡화", "패션의류", "스포츠/레저", "유아동",
                    "가전/디지털/컴퓨터", "가구/침구", "주방/생활/건강", "식품", "애완/취미/자동차용품",
                  ].map((cat) => (
                    <span key={cat} className="bg-blue-100 text-blue-700 text-[10px] font-medium rounded-full px-2.5 py-1">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
